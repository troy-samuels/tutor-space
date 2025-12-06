"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCog, Search, AlertCircle, Loader2 } from "lucide-react";

interface Tutor {
  id: string;
  full_name: string | null;
  email: string;
  username: string | null;
  avatar_url: string | null;
}

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ImpersonatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTutorId = searchParams.get("tutorId");

  const [search, setSearch] = useState("");
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Impersonation modal state
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [reason, setReason] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // If tutorId is provided in URL, fetch that tutor
  useEffect(() => {
    if (preselectedTutorId) {
      fetchTutorById(preselectedTutorId);
    }
  }, [preselectedTutorId]);

  async function fetchTutorById(id: string) {
    try {
      const response = await fetch(`/api/admin/tutors/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTutor({
          id: data.tutor.id,
          full_name: data.tutor.full_name,
          email: data.tutor.email,
          username: data.tutor.username,
          avatar_url: data.tutor.avatar_url,
        });
      }
    } catch (err) {
      console.error("Failed to fetch tutor:", err);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/tutors?search=${encodeURIComponent(search)}&limit=10`
      );
      if (!response.ok) throw new Error("Failed to search tutors");
      const data = await response.json();
      setTutors(data.tutors);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleStartImpersonation() {
    if (!selectedTutor || !reason.trim()) return;

    setStarting(true);
    setStartError(null);

    try {
      const response = await fetch("/api/admin/impersonate/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start impersonation");
      }

      // Redirect to the tutor's dashboard
      router.push(data.redirect || "/dashboard");
      router.refresh();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "An error occurred");
      setStarting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Support Impersonation
        </h1>
        <p className="text-muted-foreground">
          View the platform as a specific tutor for support purposes
        </p>
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800 text-sm">
          <ul className="list-disc list-inside space-y-1">
            <li>All impersonation sessions are logged with full audit trail</li>
            <li>Sessions automatically expire after 1 hour</li>
            <li>
              You must provide a reason for impersonation (for compliance)
            </li>
            <li>A yellow banner will be visible to indicate impersonation</li>
          </ul>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Find Tutor</CardTitle>
          <CardDescription>
            Search for a tutor by name, email, or username
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading || !search.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </form>

          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

          {/* Search Results */}
          {tutors.length > 0 && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutors.map((tutor) => (
                    <TableRow key={tutor.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={tutor.avatar_url || undefined}
                                alt={tutor.full_name || "Tutor avatar"}
                              />
                            <AvatarFallback>
                              {getInitials(tutor.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {tutor.full_name || "No name"}
                            </div>
                            {tutor.username && (
                              <div className="text-xs text-muted-foreground">
                                @{tutor.username}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {tutor.email}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTutor(tutor)}
                        >
                          <UserCog className="h-4 w-4 mr-1" />
                          Impersonate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impersonation Dialog */}
      <Dialog
        open={!!selectedTutor}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTutor(null);
            setReason("");
            setStartError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Impersonation Session</DialogTitle>
            <DialogDescription>
              You are about to view the platform as this tutor
            </DialogDescription>
          </DialogHeader>

          {selectedTutor && (
            <div className="space-y-4">
              {/* Tutor Info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={selectedTutor.avatar_url || undefined}
                    alt={selectedTutor.full_name || "Tutor avatar"}
                  />
                  <AvatarFallback>
                    {getInitials(selectedTutor.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {selectedTutor.full_name || "No name"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedTutor.email}
                  </div>
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Reason for impersonation <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="e.g., Investigating support ticket #1234 - user cannot see bookings"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This will be logged for compliance and audit purposes
                </p>
              </div>

              {startError && (
                <p className="text-red-600 text-sm">{startError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTutor(null)}
              disabled={starting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartImpersonation}
              disabled={starting || reason.trim().length < 5}
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4 mr-2" />
                  Start Impersonation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

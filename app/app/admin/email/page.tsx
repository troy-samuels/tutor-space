"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Send,
  Loader2,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Tutor {
  id: string;
  full_name: string | null;
  email: string;
  username: string | null;
  avatar_url: string | null;
  plan: string | null;
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

export default function AdminEmailPage() {
  const [recipientType, setRecipientType] = useState<string>("all");
  const [selectedTutors, setSelectedTutors] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // For specific tutor selection
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Tutor[]>([]);
  const [searching, setSearching] = useState(false);

  // Recipient counts
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Fetch recipient count when type changes
  useEffect(() => {
    if (recipientType === "specific") {
      setRecipientCount(selectedTutors.length);
      return;
    }

    async function fetchCount() {
      setLoadingCount(true);
      try {
        const response = await fetch(
          `/api/admin/tutors?plan=${recipientType === "all" ? "" : recipientType}&limit=1`
        );
        const data = await response.json();
        setRecipientCount(data.total || 0);
      } catch {
        setRecipientCount(null);
      } finally {
        setLoadingCount(false);
      }
    }

    fetchCount();
  }, [recipientType, selectedTutors.length]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/admin/tutors?search=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await response.json();
      setSearchResults(data.tutors || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function toggleTutor(tutorId: string) {
    setSelectedTutors((prev) =>
      prev.includes(tutorId)
        ? prev.filter((id) => id !== tutorId)
        : [...prev, tutorId]
    );
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;

    setSending(true);
    setResult(null);

    try {
      const payload: {
        subject: string;
        body: string;
        recipientType?: string;
        recipientIds?: string[];
      } = {
        subject: subject.trim(),
        body: body.trim(),
      };

      if (recipientType === "specific") {
        if (selectedTutors.length === 0) {
          setResult({ success: false, message: "Please select at least one tutor" });
          setSending(false);
          return;
        }
        payload.recipientIds = selectedTutors;
      } else {
        payload.recipientType = recipientType;
      }

      const response = await fetch("/api/admin/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send emails");
      }

      setResult({
        success: true,
        message: `Successfully sent to ${data.sentCount} tutor${data.sentCount !== 1 ? "s" : ""}`,
      });

      // Clear form on success
      setSubject("");
      setBody("");
      setSelectedTutors([]);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to send emails",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Email Tutors</h1>
        <p className="text-muted-foreground">
          Send emails to tutors on the platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipients
            </CardTitle>
            <CardDescription>
              Choose who will receive this email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Recipient Group</Label>
              <Select value={recipientType} onValueChange={setRecipientType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tutors</SelectItem>
                  <SelectItem value="free">Free Tier Only</SelectItem>
                  <SelectItem value="professional">Legacy Free</SelectItem>
                  <SelectItem value="business">Business Tier</SelectItem>
                  <SelectItem value="specific">Specific Tutors...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recipientType !== "specific" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {loadingCount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{recipientCount ?? "?"} recipients</span>
                )}
              </div>
            )}

            {recipientType === "specific" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tutors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSearch}
                    disabled={searching}
                  >
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Tutor</TableHead>
                          <TableHead>Plan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((tutor) => (
                          <TableRow
                            key={tutor.id}
                            className="cursor-pointer"
                            onClick={() => toggleTutor(tutor.id)}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedTutors.includes(tutor.id)}
                                onCheckedChange={() => toggleTutor(tutor.id)}
                              />
                            </TableCell>
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
                                  <div className="font-medium text-sm">
                                    {tutor.full_name || "No name"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {tutor.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {tutor.plan || "free"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Selected Count */}
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{selectedTutors.length} tutor(s) selected</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Write your message to tutors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
              />
              <p className="text-xs text-muted-foreground">
                Each paragraph will be wrapped in a &lt;p&gt; tag. The tutor's
                name will be used in the greeting.
              </p>
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  result.success
                    ? "bg-green-50 text-green-800"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span>{result.message}</span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={sending || !subject.trim() || !body.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

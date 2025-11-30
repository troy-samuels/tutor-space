"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, UserPlus, Clock, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { searchTutors, getMyConnections, type TutorSearchResult, type StudentConnection } from "@/lib/actions/student-connections";
import { ConnectionRequestModal } from "./ConnectionRequestModal";

type TutorSearchProps = {
  initialQuery?: string;
};

export function TutorSearch({ initialQuery = "" }: TutorSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<TutorSearchResult[]>([]);
  const [connections, setConnections] = useState<StudentConnection[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [error, setError] = useState("");
  const [selectedTutor, setSelectedTutor] = useState<TutorSearchResult | null>(null);

  // Load existing connections on mount
  useEffect(() => {
    async function loadConnections() {
      const result = await getMyConnections();
      if (result.connections) {
        setConnections(result.connections);
      }
      setLoadingConnections(false);
    }
    loadConnections();
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError("");

    try {
      const result = await searchTutors(searchQuery);
      if (result.error) {
        setError(result.error);
      } else {
        setResults(result.tutors || []);
      }
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Get connection status for a tutor
  const getConnectionStatus = (tutorId: string) => {
    const connection = connections.find((c) => c.tutor_id === tutorId);
    return connection?.status || null;
  };

  // Refresh connections after successful request
  const handleConnectionSuccess = async () => {
    const result = await getMyConnections();
    if (result.connections) {
      setConnections(result.connections);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tutors by username or name..."
          className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Your Connections Section */}
      {!loadingConnections && connections.length > 0 && !query && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Your Tutors</h2>
          <div className="space-y-2">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={connection.tutor.avatar_url || undefined}
                      alt={connection.tutor.full_name || "Tutor avatar"}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(connection.tutor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {connection.tutor.full_name || `@${connection.tutor.username}`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{connection.tutor.username}
                    </div>
                  </div>
                </div>
                <ConnectionStatusBadge status={connection.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query.length >= 2 && (
        <div>
          {results.length === 0 && !searching ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No tutors found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((tutor) => {
                const status = getConnectionStatus(tutor.id);
                return (
                  <div
                    key={tutor.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-border hover:border-primary/50 transition"
                  >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={tutor.avatar_url || undefined}
                      alt={tutor.full_name || "Tutor avatar"}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(tutor.full_name)}
                    </AvatarFallback>
                  </Avatar>
                      <div>
                        <div className="font-medium">
                          {tutor.full_name || `@${tutor.username}`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{tutor.username}
                        </div>
                        {tutor.tagline && (
                          <div className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {tutor.tagline}
                          </div>
                        )}
                      </div>
                    </div>

                    {status ? (
                      <ConnectionStatusBadge status={status} />
                    ) : (
                      <button
                        onClick={() => setSelectedTutor(tutor)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition"
                      >
                        <UserPlus className="h-4 w-4" />
                        Connect
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state when no query and no connections */}
      {!query && connections.length === 0 && !loadingConnections && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Find Your Tutor</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Search for tutors by their username or name to get started with your learning journey.
          </p>
        </div>
      )}

      {/* Connection Request Modal */}
      {selectedTutor && (
        <ConnectionRequestModal
          isOpen={!!selectedTutor}
          onClose={() => setSelectedTutor(null)}
          tutor={selectedTutor}
          onSuccess={handleConnectionSuccess}
        />
      )}
    </div>
  );
}

function ConnectionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium">
          <Clock className="h-3.5 w-3.5" />
          Pending
        </span>
      );
    case "approved":
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
          <CheckCircle className="h-3.5 w-3.5" />
          Connected
        </span>
      );
    case "rejected":
      return (
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
          <XCircle className="h-3.5 w-3.5" />
          Declined
        </span>
      );
    default:
      return null;
  }
}

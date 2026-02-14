"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { UserPlus, Check, X, Loader2, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  approveConnectionRequest,
  rejectConnectionRequest,
} from "@/lib/actions/student-connections";
import type { PendingConnectionRequest } from "@/lib/actions/types";

interface ConnectionRequestsSectionProps {
  requests: PendingConnectionRequest[];
}

export function ConnectionRequestsSection({ requests: initialRequests }: ConnectionRequestsSectionProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (requests.length === 0) {
    return null;
  }

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    startTransition(async () => {
      const result = await approveConnectionRequest(requestId);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
      setProcessingId(null);
    });
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    startTransition(async () => {
      const result = await rejectConnectionRequest(requestId);
      if (result.success) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
      setProcessingId(null);
    });
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/20">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">
              Connection Requests
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {requests.length}
              </span>
            </CardTitle>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-2">
          <p className="text-sm text-muted-foreground mb-4">
            Students who want to connect with you. Approve to let them book lessons.
          </p>
          <div className="space-y-3">
            {requests.map((request) => {
              const isProcessing = processingId === request.id;
              return (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 bg-white rounded-xl border border-border"
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(request.student_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-foreground">
                          {request.student_name || "New Student"}
                        </h4>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{request.student_email}</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(request.requested_at), "MMM d, h:mm a")}
                      </span>
                    </div>

                    {request.initial_message && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm text-foreground">
                        <p className="text-xs text-muted-foreground mb-1">Their message:</p>
                        <p className="whitespace-pre-wrap">{request.initial_message}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        disabled={isProcessing || isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={isProcessing || isPending}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

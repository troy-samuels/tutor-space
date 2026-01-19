"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
  onBack?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ClassroomErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[Classroom] Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="rounded-full bg-amber-50 p-5">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Couldn&apos;t connect to classroom
              </h1>
              <p className="text-muted-foreground">
                There was a problem connecting to the video service.
                Please check your internet connection and try again.
              </p>
            </div>
            <div className="flex gap-3">
              {this.props.onBack && (
                <Button variant="outline" onClick={this.props.onBack} className="rounded-full px-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              )}
              {this.props.onRetry && (
                <Button onClick={this.props.onRetry} className="rounded-full px-6">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { Suspense } from "react";
import VocabularyBank from "@/components/student/VocabularyBank";
import { Card, CardContent } from "@/components/ui/card";

export default function VocabularyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Vocabulary Bank</h1>
          <p className="text-muted-foreground mb-6">
            Build and review your vocabulary with spaced repetition
          </p>
        </div>

        <Suspense
          fallback={
            <Card className="m-4">
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-muted rounded" />
                  <div className="h-20 bg-muted rounded" />
                  <div className="h-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          }
        >
          <VocabularyBank />
        </Suspense>
      </div>
    </div>
  );
}

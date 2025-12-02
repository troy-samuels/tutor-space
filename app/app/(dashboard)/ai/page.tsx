import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getConversations, getConversation } from "@/lib/actions/ai-assistant";
import { AIChatInterface } from "@/components/ai/AIChatInterface";

export const metadata = {
  title: "AI Assistant | TutorLingua",
  description: "AI-powered assistant for lesson preparation, student feedback, and more",
};

export default async function AIPage({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("id", user.id)
    .single();

  // Check if user has access (Growth plan or higher)
  // For now, allow all users - can be gated by plan later
  const userRole = profile ? "tutor" : "student";

  // Fetch conversations
  const conversations = await getConversations();

  // Get current conversation if specified
  const params = await searchParams;
  const currentConversationId = params.conversation || null;
  let messages: Awaited<ReturnType<typeof getConversation>>["messages"] = [];

  if (currentConversationId) {
    const conversationData = await getConversation(currentConversationId);
    messages = conversationData.messages;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get help with lesson preparation, student feedback, content creation, and more
        </p>
      </div>

      <AIChatInterface
        initialConversations={conversations}
        initialMessages={messages}
        initialConversationId={currentConversationId}
        userRole={userRole as "tutor" | "student"}
      />
    </div>
  );
}

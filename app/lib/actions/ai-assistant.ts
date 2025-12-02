"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AIConversation {
  id: string;
  user_id: string;
  user_role: "tutor" | "student";
  title: string | null;
  context_type: "general" | "lesson_prep" | "student_feedback" | "content_creation" | "scheduling" | null;
  is_active: boolean;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
}

export interface AIUsage {
  id: string;
  user_id: string;
  month: string;
  total_tokens: number;
  total_requests: number;
  total_conversations: number;
  created_at: string;
  updated_at: string;
}

// Get all conversations for the current user
export async function getConversations(): Promise<AIConversation[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  return data || [];
}

// Get a single conversation with messages
export async function getConversation(conversationId: string): Promise<{
  conversation: AIConversation | null;
  messages: AIMessage[];
}> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { conversation: null, messages: [] };

  const [conversationResult, messagesResult] = await Promise.all([
    supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true }),
  ]);

  return {
    conversation: conversationResult.data,
    messages: messagesResult.data || [],
  };
}

// Create a new conversation
export async function createConversation(params: {
  title?: string;
  contextType?: AIConversation["context_type"];
  userRole: "tutor" | "student";
}): Promise<{ conversationId: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { conversationId: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: user.id,
      user_role: params.userRole,
      title: params.title || "New Conversation",
      context_type: params.contextType || "general",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating conversation:", error);
    return { conversationId: null, error: error.message };
  }

  // Update usage stats
  await updateUsageStats(user.id, { conversations: 1 });

  revalidatePath("/ai");
  return { conversationId: data.id, error: null };
}

// Add a message to a conversation
export async function addMessage(params: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  tokensUsed?: number;
}): Promise<{ messageId: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messageId: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata || {},
      tokens_used: params.tokensUsed || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding message:", error);
    return { messageId: null, error: error.message };
  }

  // Update conversation title if it's the first user message
  if (params.role === "user") {
    const { data: conversation } = await supabase
      .from("ai_conversations")
      .select("message_count, title")
      .eq("id", params.conversationId)
      .single();

    if (conversation && conversation.message_count <= 1 && conversation.title === "New Conversation") {
      // Generate a title from the first message
      const title = params.content.slice(0, 50) + (params.content.length > 50 ? "..." : "");
      await supabase
        .from("ai_conversations")
        .update({ title })
        .eq("id", params.conversationId);
    }
  }

  // Update usage stats for assistant messages (which use tokens)
  if (params.role === "assistant" && params.tokensUsed) {
    await updateUsageStats(user.id, { tokens: params.tokensUsed, requests: 1 });
  }

  return { messageId: data.id, error: null };
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting conversation:", error);
    return { error: error.message };
  }

  revalidatePath("/ai");
  return { error: null };
}

// Update conversation title
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("ai_conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating conversation:", error);
    return { error: error.message };
  }

  revalidatePath("/ai");
  return { error: null };
}

// Get usage stats for current month
export async function getUsageStats(): Promise<AIUsage | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data, error } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", user.id)
    .eq("month", currentMonth)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching usage stats:", error);
  }

  return data;
}

// Helper to update usage stats
async function updateUsageStats(
  userId: string,
  updates: { tokens?: number; requests?: number; conversations?: number }
): Promise<void> {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Try to get existing record
  const { data: existing } = await supabase
    .from("ai_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from("ai_usage")
      .update({
        total_tokens: existing.total_tokens + (updates.tokens || 0),
        total_requests: existing.total_requests + (updates.requests || 0),
        total_conversations: existing.total_conversations + (updates.conversations || 0),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new record
    await supabase.from("ai_usage").insert({
      user_id: userId,
      month: currentMonth,
      total_tokens: updates.tokens || 0,
      total_requests: updates.requests || 0,
      total_conversations: updates.conversations || 0,
    });
  }
}

// Context types are now exported from @/lib/constants/ai-context-types.ts

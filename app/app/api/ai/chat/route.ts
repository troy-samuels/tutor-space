import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addMessage } from "@/lib/actions/ai-assistant";

// Simple AI response generation (placeholder for actual AI integration)
// In production, this would call OpenAI, Anthropic, or similar
async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  contextType: string
): Promise<{ content: string; tokensUsed: number }> {
  // Context-specific system prompts
  const systemPrompts: Record<string, string> = {
    general: "You are a helpful AI assistant for language tutors. Help them with their tutoring business.",
    lesson_prep: "You are an expert at creating engaging language lesson plans. Help the tutor prepare effective lessons with activities, vocabulary, and exercises.",
    student_feedback: "You are skilled at writing constructive student feedback. Help the tutor write encouraging yet honest progress reports.",
    content_creation: "You are a language learning content creator. Help create exercises, quizzes, worksheets, and learning materials.",
    scheduling: "You are a scheduling assistant. Help the tutor organize their calendar, suggest optimal lesson times, and manage their availability.",
  };

  const systemPrompt = systemPrompts[contextType] || systemPrompts.general;

  // Get the last user message
  const lastUserMessage = messages.filter(m => m.role === "user").pop();

  if (!lastUserMessage) {
    return {
      content: "Hello! How can I help you today? I can assist with lesson preparation, student feedback, content creation, scheduling, and general tutoring questions.",
      tokensUsed: 50,
    };
  }

  // Placeholder responses based on context
  // In production, replace with actual AI API call
  const responses: Record<string, string[]> = {
    general: [
      "That's a great question! Based on best practices for language tutoring, I would suggest focusing on interactive activities that engage your students.",
      "Here are some tips that might help with your tutoring business...",
      "I'd be happy to help you with that. Could you tell me more about your specific situation?",
    ],
    lesson_prep: [
      "For this lesson, I'd suggest starting with a warm-up activity to activate prior knowledge, followed by the main content presentation, practice activities, and a cool-down review.",
      "Here's a lesson plan structure you could use:\n\n1. **Warm-up (5 min)**: Quick review of previous vocabulary\n2. **Introduction (10 min)**: Present new concept\n3. **Practice (20 min)**: Guided exercises\n4. **Production (15 min)**: Free practice\n5. **Wrap-up (5 min)**: Summary and homework",
      "Consider incorporating visual aids and real-world examples to make the lesson more engaging.",
    ],
    student_feedback: [
      "Here's a feedback template you can use:\n\n**Strengths**: [Student name] has shown excellent progress in...\n\n**Areas for Growth**: We're working on improving...\n\n**Recommendations**: For continued progress, I suggest...",
      "When writing feedback, start with specific positives, address areas for improvement constructively, and end with encouragement and next steps.",
      "Remember to be specific with examples when giving feedback - this helps students understand exactly what they did well and what to work on.",
    ],
    content_creation: [
      "Here's a vocabulary exercise template:\n\n**Match the words with their definitions:**\n1. [Word A] - _____\n2. [Word B] - _____\n\n**Fill in the blanks:**\nComplete the sentences using the words above.\n\n**Writing prompt:**\nWrite 3 sentences using at least 2 of the new words.",
      "For creating engaging content, consider including visual elements, real-world contexts, and opportunities for student creativity.",
      "I can help you create:\n- Vocabulary lists with example sentences\n- Grammar exercises\n- Reading comprehension questions\n- Conversation prompts\n- Quiz questions",
    ],
    scheduling: [
      "Based on typical student availability patterns, consider offering time slots in the early morning (before work/school) and evening (after 6 PM) for maximum bookings.",
      "To optimize your schedule, I'd recommend:\n- Block time for lesson prep\n- Schedule breaks between sessions\n- Keep consistent time slots week-to-week for returning students",
      "Would you like me to suggest a weekly schedule template based on your preferred working hours?",
    ],
  };

  const contextResponses = responses[contextType] || responses.general;
  const randomResponse = contextResponses[Math.floor(Math.random() * contextResponses.length)];

  // Simulate token usage (rough estimate)
  const tokensUsed = Math.floor(randomResponse.length / 4) + 50;

  return {
    content: randomResponse,
    tokensUsed,
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message, contextType = "general" } = body;

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Missing conversationId or message" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Add user message
    const userMessageResult = await addMessage({
      conversationId,
      role: "user",
      content: message,
    });

    if (userMessageResult.error) {
      return NextResponse.json(
        { error: userMessageResult.error },
        { status: 500 }
      );
    }

    // Get conversation history for context
    const { data: messageHistory } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Generate AI response
    const aiResponse = await generateAIResponse(
      messageHistory || [],
      contextType
    );

    // Add assistant message
    const assistantMessageResult = await addMessage({
      conversationId,
      role: "assistant",
      content: aiResponse.content,
      tokensUsed: aiResponse.tokensUsed,
    });

    if (assistantMessageResult.error) {
      return NextResponse.json(
        { error: assistantMessageResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: aiResponse.content,
      tokensUsed: aiResponse.tokensUsed,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

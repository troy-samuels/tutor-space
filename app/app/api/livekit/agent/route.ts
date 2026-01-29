import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createAgentToken,
  createAgentSession,
  buildAgentJobData,
  validateAgentConfig,
  addAgentToRoomMetadata,
  removeAgentFromRoomMetadata,
  type AIAgentConfig,
  type AgentDispatchRequest,
  type AgentDispatchResponse,
} from "@/lib/livekit-agents";
import { getRoomServiceClient } from "@/lib/livekit";

type BookingAccessRow = {
  tutor_id: string | null;
  student_id: string | null;
  students: { user_id: string | null } | { user_id: string | null }[] | null;
};

// ============================================
// POST: Dispatch AI agent to a room
// ============================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { roomName, config, bookingId } = body as Partial<AgentDispatchRequest> & {
      config?: AIAgentConfig;
    };

    // Validate required fields
    if (!roomName) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      );
    }

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Agent configuration is required" },
        { status: 400 }
      );
    }

    // Validate agent config
    const validation = validateAgentConfig(config);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.errors.join(", ") },
        { status: 400 }
      );
    }

    let studentUserId: string | null = null;
    let tutorUserId: string | null = null;
    let isTutor = false;

    // Verify user has access to this room/booking
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select("tutor_id, student_id, students(user_id)")
        .eq("id", bookingId)
        .single<BookingAccessRow>();

      if (bookingError || !booking) {
        return NextResponse.json(
          { success: false, error: "Booking not found" },
          { status: 404 }
        );
      }

      // Check if user is tutor or student
      tutorUserId = booking.tutor_id;
      const studentData = booking.students;
      studentUserId = Array.isArray(studentData)
        ? studentData[0]?.user_id ?? null
        : studentData?.user_id ?? null;
      isTutor = tutorUserId === user.id;
      const isStudent = studentUserId === user.id;

      if (!isTutor && !isStudent) {
        return NextResponse.json(
          { success: false, error: "Access denied" },
          { status: 403 }
        );
      }

      // Verify tutor has Studio tier for AI agents
      if (isTutor) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("tier")
          .eq("id", user.id)
          .single();

        if (profile?.tier !== "studio") {
          return NextResponse.json(
            { success: false, error: "Studio tier required for AI agents" },
            { status: 403 }
          );
        }
      }
    }

    // Create agent session
    const session = createAgentSession(roomName, config);

    // Generate agent token
    const agentToken = await createAgentToken(roomName, config.agentType);

    // Get room service client to update room metadata
    try {
      const roomService = getRoomServiceClient();
      const rooms = await roomService.listRooms([roomName]);

      if (rooms.length > 0) {
        const existingMetadata = rooms[0].metadata;
        const newMetadata = addAgentToRoomMetadata(existingMetadata, session);
        await roomService.updateRoomMetadata(roomName, newMetadata);
      }
    } catch (err) {
      // Room might not exist yet, which is okay
      console.log("[Agent Dispatch] Room not found, will be created on join");
    }

    // Build job data for the agent worker
    const jobData = buildAgentJobData({
      roomName,
      config,
      studentId: bookingId && isTutor ? studentUserId ?? user.id : user.id,
      tutorId: bookingId ? (isTutor ? user.id : tutorUserId ?? undefined) : undefined,
      bookingId,
    });

    // In production, you would dispatch this to your LiveKit Agents worker
    // via a message queue (Redis, SQS, etc.) or direct HTTP call
    //
    // For now, we return the session info and token for manual agent start
    // or for use with a self-hosted agent worker

    const response: AgentDispatchResponse = {
      success: true,
      session: {
        ...session,
        status: "starting",
      },
    };

    return NextResponse.json({
      ...response,
      // Include these for agent worker connection
      _agentToken: agentToken,
      _jobData: jobData,
    });
  } catch (error) {
    console.error("[Agent Dispatch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Remove AI agent from a room
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("roomName");
    const agentIdentity = searchParams.get("agentIdentity");

    if (!roomName) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      );
    }

    const roomService = getRoomServiceClient();

    // Remove agent from room if identity provided
    if (agentIdentity) {
      try {
        await roomService.removeParticipant(roomName, agentIdentity);
      } catch (err) {
        // Agent might already be disconnected
        console.log("[Agent Remove] Agent already disconnected");
      }
    }

    // Update room metadata
    try {
      const rooms = await roomService.listRooms([roomName]);
      if (rooms.length > 0) {
        const existingMetadata = rooms[0].metadata;
        const newMetadata = removeAgentFromRoomMetadata(existingMetadata);
        await roomService.updateRoomMetadata(roomName, newMetadata);
      }
    } catch (err) {
      console.log("[Agent Remove] Failed to update room metadata:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Agent Remove] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Get agent status for a room
// ============================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("roomName");

    if (!roomName) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      );
    }

    const roomService = getRoomServiceClient();

    try {
      const rooms = await roomService.listRooms([roomName]);

      if (rooms.length === 0) {
        return NextResponse.json({
          success: true,
          hasAgent: false,
          agentInfo: null,
        });
      }

      const room = rooms[0];
      const participants = await roomService.listParticipants(roomName);

      // Find AI agent participants
      const agentParticipants = participants.filter((p) =>
        p.identity.startsWith("ai-tutor")
      );

      // Parse room metadata for agent info
      let agentInfo = null;
      if (room.metadata) {
        try {
          const metadata = JSON.parse(room.metadata);
          agentInfo = metadata.ai_agent || null;
        } catch {
          // Invalid metadata
        }
      }

      return NextResponse.json({
        success: true,
        hasAgent: agentParticipants.length > 0,
        agentInfo,
        agentParticipants: agentParticipants.map((p) => ({
          identity: p.identity,
          name: p.name,
          joinedAt: Number(p.joinedAt),
          metadata: p.metadata,
        })),
      });
    } catch (err) {
      // Room doesn't exist
      return NextResponse.json({
        success: true,
        hasAgent: false,
        agentInfo: null,
      });
    }
  } catch (error) {
    console.error("[Agent Status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

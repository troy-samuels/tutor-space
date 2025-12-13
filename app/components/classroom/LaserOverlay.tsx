"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

interface LaserOverlayProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isTutor: boolean;
}

type LaserPayload = {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  role: "tutor" | "student";
};

type PointerState = {
  x: number;
  y: number;
  role: "tutor" | "student";
  updatedAt: number;
};

const TOPIC = "laser_pointer";
const SEND_INTERVAL_MS = 50;
const FADE_AFTER_MS = 2000;

export function LaserOverlay({ containerRef, isTutor }: LaserOverlayProps) {
  const room = useRoomContext();
  const lastSentRef = useRef(0);
  const [pointers, setPointers] = useState<Record<string, PointerState>>({});
  const [, forceNow] = useState(Date.now());

  // Keep a heartbeat to allow fade-out rendering
  useEffect(() => {
    const id = window.setInterval(() => forceNow(Date.now()), 300);
    return () => window.clearInterval(id);
  }, []);

  // Send pointer positions
  useEffect(() => {
    const el = containerRef.current;
    if (!room || !el) return;

    const handleMove = (event: MouseEvent) => {
      const now = performance.now();
      if (now - lastSentRef.current < SEND_INTERVAL_MS) return;
      lastSentRef.current = now;

      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      const payload: LaserPayload = {
        x: Math.min(Math.max(x, 0), 1),
        y: Math.min(Math.max(y, 0), 1),
        role: isTutor ? "tutor" : "student",
      };

      try {
        const bytes = new TextEncoder().encode(JSON.stringify(payload));
        room.localParticipant.publishData(bytes, { topic: TOPIC });

        // Update local pointer immediately for feedback
        setPointers((prev) => ({
          ...prev,
          [room.localParticipant.identity]: {
            ...payload,
            updatedAt: Date.now(),
          },
        }));
      } catch (err) {
        console.error("[Laser] Failed to publish pointer", err);
      }
    };

    el.addEventListener("mousemove", handleMove);
    return () => el.removeEventListener("mousemove", handleMove);
  }, [containerRef, room, isTutor]);

  // Receive remote pointers
  useEffect(() => {
    if (!room) return;

    const handleData = (
      payload: Uint8Array,
      participant?: { identity?: string },
      _kind?: any,
      topic?: string
    ) => {
      if (topic !== TOPIC) return;
      const id = participant?.identity;
      if (!id) return;

      try {
        const decoded = JSON.parse(new TextDecoder().decode(payload)) as LaserPayload;
        if (typeof decoded.x !== "number" || typeof decoded.y !== "number") return;

        setPointers((prev) => ({
          ...prev,
          [id]: {
            x: decoded.x,
            y: decoded.y,
            role: decoded.role === "tutor" ? "tutor" : "student",
            updatedAt: Date.now(),
          },
        }));
      } catch (err) {
        console.error("[Laser] Failed to parse pointer", err);
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  const dots = Object.entries(pointers);

  return (
    <div className="pointer-events-none absolute inset-0">
      {dots.map(([id, pointer]) => {
        const age = Date.now() - pointer.updatedAt;
        const opacity = age < FADE_AFTER_MS ? 1 : 0;
        const color =
          pointer.role === "tutor"
            ? "bg-red-500 shadow-[0_0_24px_rgba(239,68,68,0.65)]"
            : "bg-sky-500 shadow-[0_0_24px_rgba(14,165,233,0.65)]";

        return (
          <div
            key={id}
            className={`absolute h-4 w-4 rounded-full transition-opacity duration-500 ${color}`}
            style={{
              left: `${pointer.x * 100}%`,
              top: `${pointer.y * 100}%`,
              transform: "translate(-50%, -50%)",
              opacity,
            }}
          />
        );
      })}
    </div>
  );
}

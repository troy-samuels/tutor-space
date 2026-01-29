# LiveKit Configuration Improvements for TutorLingua

## Research Summary

After reviewing the LiveKit documentation and the current implementation, this document outlines configuration improvements that could enhance the user experience for the language tutoring platform.

---

## Current Implementation Analysis

The app already has a solid LiveKit foundation:

| Feature | Status | File Location |
|---------|--------|---------------|
| Video quality presets (high/medium/low/auto) | Implemented | `lib/livekit-video-config.ts` |
| Simulcast layers (1080p, 720p) | Implemented | `lib/livekit-video-config.ts` |
| Pre-join device testing | Implemented | `components/classroom/PreJoinScreen.tsx` |
| Connection quality monitoring | Implemented | `lib/hooks/useLiveKitQualityMonitor.ts` |
| Audio-only recording (OGG to S3) | Implemented | `lib/livekit.ts` |
| In-room chat via data channels | Implemented | `components/classroom/ChatTab.tsx` |
| Screen sharing | Implemented | `lib/livekit-video-config.ts` |
| Dynacast (send only consumed layers) | Enabled | `buildRoomOptions()` |
| Adaptive streaming | Enabled | `buildRoomOptions()` |
| DTX (audio bandwidth savings) | Enabled | `buildRoomOptions()` |
| RED (audio resilience) | Enabled | `buildRoomOptions()` |

---

## Recommended Configuration Improvements

### 1. LiveKit Agents for AI Voice Tutoring (High Impact)

**What it is**: LiveKit Agents is a framework for adding AI-powered participants to rooms that can process speech-to-text, run through an LLM, and respond with text-to-speech - all in real-time.

**Why it matters for TutorLingua**:
- Enable AI conversation practice directly in video rooms
- Pronunciation feedback in real-time during lessons
- AI teaching assistant that can answer student questions when tutor is busy
- Real-time translation during multilingual lessons

**Implementation approach**:
- Deploy a Python/Node.js agent that joins rooms on-demand
- Integrate with existing OpenAI setup for LLM
- Use Deepgram (already integrated) for STT
- Add voice selection for TTS (ElevenLabs, Azure, etc.)

**Documentation**: https://docs.livekit.io/agents/

---

### 2. Connection Quality UI Feedback (Medium Impact)

**Current state**: `useLiveKitQualityMonitor` exists but quality feedback isn't prominently shown to users.

**Improvement**: Add a visible connection quality indicator in the classroom UI that:
- Shows current connection state (Excellent/Good/Poor)
- Displays bandwidth warnings before issues occur
- Provides actionable tips ("Try turning off video" when degraded)

**Implementation location**: `components/classroom/ConnectionQuality.tsx`

---

### 3. Automatic Track Pausing (Medium Impact)

**What it is**: LiveKit's adaptive streaming can automatically pause video tracks when elements are hidden or very small.

**Current state**: Adaptive streaming is enabled, but could be enhanced by:
- Using `track.attach(element)` consistently (enables automatic size detection)
- Setting explicit video quality based on element size with `setVideoQuality()`
- Pausing tracks when sidebar is collapsed or participant is off-screen

**Benefit**: Reduces bandwidth usage by 50-70% when participants minimize windows.

---

### 4. End-to-End Encryption (E2EE) (Medium Impact)

**What it is**: Optional encryption where media is encrypted on sender and decrypted on receiver - LiveKit servers cannot access content.

**Why it matters**:
- Premium privacy feature for sensitive lessons (medical English, legal prep)
- Differentiator for enterprise/institutional clients
- HIPAA compliance requirements

**Implementation**: E2EE is configured client-side with shared encryption keys.

---

### 5. Improved Reconnection Handling (Medium Impact)

**Current state**: LiveKit handles reconnection automatically, but UX could be better.

**Improvements**:
- Add UI states for: `Reconnecting...`, `Reconnected!`, `Connection Lost`
- Preserve chat messages during brief disconnections
- Show countdown during reconnection attempts
- Graceful fallback to audio-only on repeated video failures

**Events to handle**:
- `RoomEvent.Reconnecting`
- `RoomEvent.Reconnected`
- `RoomEvent.Disconnected`

---

### 6. Auto Egress for Recording (Low Impact)

**What it is**: Automatically start recording when a room is created, without manual trigger.

**Current state**: Recording requires tutor to manually click "Start Recording".

**Option**: Configure `egress` in `CreateRoom` to auto-start recording. This ensures no lessons are missed, but requires updating consent flow.

---

### 7. Selective Subscription (Low Impact)

**What it is**: Disable `autoSubscribe` and manually control which tracks to receive.

**Use case**: For group lessons (3+ participants):
- Only subscribe to active speaker's video
- Keep thumbnail-quality for non-speakers
- Significantly reduce bandwidth in larger rooms

**Current relevance**: Low (most lessons are 1:1), but valuable if group classes are added.

---

## Priority Ranking

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| LiveKit Agents for AI Voice | High | High | 1 |
| Connection Quality UI | Medium | Low | 2 |
| Automatic Track Pausing | Medium | Medium | 3 |
| Reconnection UX | Medium | Low | 4 |
| E2EE for Privacy | Medium | Medium | 5 |
| Auto Egress | Low | Low | 6 |
| Selective Subscription | Low | Medium | 7 |

---

## Key Files Reference

**Core LiveKit**:
- `/lib/livekit.ts` - Token generation, room management, recording
- `/lib/livekit-video-config.ts` - Video quality presets, simulcast layers
- `/lib/livekit-capabilities.ts` - Browser capability detection
- `/lib/livekit-fallbacks.ts` - Bandwidth/codec fallback logic
- `/app/api/livekit/token/route.ts` - Token endpoint
- `/app/api/livekit/recording/route.ts` - Recording management

**Classroom Components**:
- `/components/classroom/VideoStage.tsx` - Video grid + screen share
- `/components/classroom/ChatTab.tsx` - In-room messaging
- `/components/classroom/ControlBar.tsx` - Video controls
- `/components/classroom/PreJoinScreen.tsx` - Device setup
- `/components/classroom/ConnectionQuality.tsx` - Quality indicator
- `/components/classroom/ConnectionToast.tsx` - Connection notifications

**Hooks**:
- `/lib/hooks/useLiveKitQualityMonitor.ts` - Quality metrics monitoring
- `/lib/hooks/useLiveKitConnectionMonitor.ts` - Connection state tracking

---

## LiveKit Documentation Resources

- **Agents Framework**: https://docs.livekit.io/agents/
- **Client SDK (React)**: https://docs.livekit.io/realtime/quickstarts/react/
- **Publishing Tracks**: https://docs.livekit.io/realtime/client/publish/
- **Receiving Tracks**: https://docs.livekit.io/realtime/client/receive/
- **Egress (Recording)**: https://docs.livekit.io/egress/
- **Room Events**: https://docs.livekit.io/realtime/client/events/

---

*Last updated: January 2026*

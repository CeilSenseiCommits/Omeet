import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  MonitorUp, 
  PhoneOff, 
  Hand, 
  MessageSquare, 
  Users, 
  Copy, 
  Check, 
  ShieldAlert, 
  Building, 
  ArrowLeft, 
  Sparkles,
  Send,
  Loader2,
  Lock,
  Globe
} from "lucide-react";

interface MeetingData {
  id: string;
  meetingCode: string;
  title: string;
  status: string;
  scope: string;
  meetingType: string;
  isHierarchical: boolean;
  scheduledAt: string;
  startedAt?: string;
  host: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  organization: {
    id: string;
    name: string;
  } | null;
  userRole: string;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
  }>;
}

function MeetingRoomPage() {
  const { meetingCode } = useParams<{ meetingCode: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [restrictedOrgName, setRestrictedOrgName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Audio / Video controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Side drawers
  const [activeSideDrawer, setActiveSideDrawer] = useState<"participants" | "chat" | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "System", text: "Welcome to the meeting room! Audio and video channels active.", time: "Just now" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 1. Verify meeting & load room data
  useEffect(() => {
    async function verifyAndLoadMeeting() {
      if (!meetingCode) return;
      try {
        setIsLoading(true);
        setAccessDeniedError(null);
        setNotFound(false);

        const res = await fetch(
          `http://localhost:5000/api/meetings/${meetingCode}?userId=${user?.id || ""}`,
          {
            headers: {
              "x-user-id": user?.id || "",
            },
          }
        );

        if (res.status === 404) {
          setNotFound(true);
          return;
        }

        if (res.status === 403 || res.status === 401) {
          const errData = await res.json();
          setAccessDeniedError(errData.error || "You do not have permission to join this meeting.");
          setRestrictedOrgName(errData.organizationName || "this organization");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load meeting room.");
        }

        const data = await res.json();
        setMeeting(data.meeting);
      } catch (err: any) {
        console.error("Error joining meeting room:", err);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAndLoadMeeting();
  }, [meetingCode, user?.id]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyCode = () => {
    if (!meeting?.meetingCode) return;
    navigator.clipboard.writeText(meeting.meetingCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSendChatMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !user) return;
    const newMsg = {
      sender: user.name || "You",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const handleLeaveMeeting = () => {
    if (meeting?.organization?.id) {
      navigate(`/organization/${meeting.organization.id}`);
    } else {
      navigate("/");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-fuchsia-500 mb-4" />
        <h2 className="text-lg font-semibold tracking-wide">Connecting to Meeting Room...</h2>
        <p className="mt-1 text-sm text-zinc-400 font-mono">Verifying credentials & organization permissions</p>
      </div>
    );
  }

  // Restricted Access Denied View
  if (accessDeniedError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-900/50 bg-[#121215] p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-800/60 bg-rose-950/40 text-rose-400 mb-5 shadow-lg shadow-rose-950/40">
            <Lock className="h-8 w-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-800/40 bg-rose-950/60 px-3 py-1 text-xs font-semibold text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5" /> Organization Restricted
          </span>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Access Denied</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            {accessDeniedError}
          </p>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-left text-xs text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-300">
              <Building className="h-4 w-4 text-fuchsia-400" />
              <span>Target Organization: <strong className="text-white">{restrictedOrgName}</strong></span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Only verified, active employees of this organization are granted permission to participate in this meeting room.
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              <ArrowLeft className="h-4 w-4" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not Found View
  if (notFound || !meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#121215] p-8 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
          <p className="mt-2 text-sm text-zinc-400">
            No meeting matches code <span className="font-mono font-semibold text-fuchsia-400">{meetingCode}</span>.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-6 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isOrgMeeting = Boolean(meeting.organization);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0a0a0c] text-white">
      {/* 1. Header Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-6 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 min-w-0">
          <button
            type="button"
            onClick={handleLeaveMeeting}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition"
            title="Leave meeting"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white truncate max-w-xs sm:max-w-md">
                {meeting.title}
              </h1>
              {isOrgMeeting ? (
                <span className="flex items-center gap-1 rounded-md border border-fuchsia-800/50 bg-fuchsia-950/50 px-2 py-0.5 text-[10px] font-semibold text-fuchsia-300 shrink-0">
                  <Building className="h-3 w-3" />
                  {meeting.organization?.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-md border border-sky-800/50 bg-sky-950/50 px-2 py-0.5 text-[10px] font-semibold text-sky-300 shrink-0">
                  <Globe className="h-3 w-3" /> Open Meeting
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="font-mono text-zinc-300">{formatTimer(elapsedSeconds)}</span>
              <span>·</span>
              <span className="text-zinc-500">Host: {meeting.host.name}</span>
            </div>
          </div>
        </div>

        {/* Header Right: Code copy & status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
            title="Click to copy meeting code"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                <span>{meeting.meetingCode}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Connected</span>
          </div>
        </div>
      </header>

      {/* 2. Main Video Stage & Side Drawer */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Stage Video Grid */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="grid flex-1 gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-full overflow-y-auto">
            {/* User Tile (Self) */}
            <div className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/70 overflow-hidden shadow-xl aspect-video sm:aspect-auto">
              {isCameraOn ? (
                <div className="relative h-full w-full flex items-center justify-center bg-gradient-to-tr from-zinc-900 to-zinc-950">
                  {/* Video simulation preview */}
                  <div className="flex flex-col items-center">
                    <img
                      src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "You")}&background=2563eb&color=ffffff`}
                      alt="You"
                      className="h-24 w-24 rounded-full border-2 border-fuchsia-500/60 object-cover shadow-2xl"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-medium text-zinc-300">Live Video Feed Active</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-950">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 text-xl font-bold text-zinc-400 border border-zinc-700">
                    {(user?.name || "U")[0]}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Camera turned off</p>
                </div>
              )}

              {/* Tile Overlay Label */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs backdrop-blur-md border border-white/10">
                <span className="font-semibold text-white">You ({user?.name})</span>
                {isMicOn ? (
                  <Mic className="h-3 w-3 text-emerald-400" />
                ) : (
                  <MicOff className="h-3 w-3 text-rose-400" />
                )}
              </div>

              {isHandRaised && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-lg bg-amber-500 px-2 py-1 text-xs font-bold text-zinc-950 shadow-lg">
                  <Hand className="h-3.5 w-3.5" /> Hand Raised
                </div>
              )}
            </div>

            {/* Host Tile */}
            {meeting.host.id !== user?.id && (
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-xl aspect-video sm:aspect-auto">
                <div className="flex flex-col items-center">
                  <img
                    src={meeting.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.host.name)}&background=7c3aed&color=ffffff`}
                    alt={meeting.host.name}
                    className="h-24 w-24 rounded-full border-2 border-indigo-500/60 object-cover shadow-2xl"
                  />
                  <p className="mt-2 text-xs text-zinc-400">Host Audio Stream Active</p>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs backdrop-blur-md border border-white/10">
                  <span className="font-semibold text-white">{meeting.host.name} (Host)</span>
                  <Mic className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Other Simulated Participants */}
            {meeting.participants
              .filter((p) => p.id !== user?.id && p.id !== meeting.host.id)
              .map((p) => (
                <div key={p.id} className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl aspect-video sm:aspect-auto">
                  <div className="flex flex-col items-center">
                    <img
                      src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=059669&color=ffffff`}
                      alt={p.name}
                      className="h-20 w-20 rounded-full border border-zinc-700 object-cover"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Connected</p>
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/60 px-2.5 py-1 text-xs backdrop-blur-md border border-white/10">
                    <span className="font-medium text-white">{p.name}</span>
                    <Mic className="h-3 w-3 text-emerald-400" />
                  </div>
                </div>
              ))}
          </div>
        </main>

        {/* Side Drawer: Participants or Chat */}
        {activeSideDrawer && (
          <aside className="w-80 sm:w-96 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col shadow-2xl z-20">
            {/* Drawer Header */}
            <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSideDrawer("participants")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeSideDrawer === "participants"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Participants ({(meeting.participants.length || 0) + 1})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideDrawer("chat")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeSideDrawer === "chat"
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body: Participants List */}
            {activeSideDrawer === "participants" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">In Meeting</div>
                {/* You */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "You")}`}
                      alt="You"
                      className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{user?.name} (You)</p>
                      <p className="text-[10px] text-fuchsia-400">{meeting.userRole}</p>
                    </div>
                  </div>
                  {isMicOn ? <Mic className="h-3.5 w-3.5 text-emerald-400" /> : <MicOff className="h-3.5 w-3.5 text-rose-400" />}
                </div>

                {/* Host */}
                {meeting.host.id !== user?.id && (
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-2.5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={meeting.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.host.name)}`}
                        alt={meeting.host.name}
                        className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-white">{meeting.host.name}</p>
                        <p className="text-[10px] text-amber-400">Host</p>
                      </div>
                    </div>
                    <Mic className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                )}

                {/* Other members */}
                {meeting.participants
                  .filter((p) => p.id !== user?.id && p.id !== meeting.host.id)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-zinc-800/40 bg-zinc-900/30 p-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`}
                          alt={p.name}
                          className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-white">{p.name}</p>
                          <p className="text-[10px] text-zinc-400">{p.role || "Member"}</p>
                        </div>
                      </div>
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ))}
              </div>
            )}

            {/* Drawer Body: In-Meeting Chat */}
            {activeSideDrawer === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-2.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                        <span className="font-semibold text-zinc-300">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-zinc-200">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="border-t border-zinc-800 p-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to meeting..."
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-fuchsia-600 transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-40 transition"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 3. Bottom Meeting Controls Bar */}
      <footer className="flex h-20 shrink-0 items-center justify-center border-t border-zinc-800/80 bg-zinc-950 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Microphone */}
          <button
            type="button"
            onClick={() => setIsMicOn(!isMicOn)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              isMicOn
                ? "border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-700"
                : "border-rose-800 bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/40"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              isCameraOn
                ? "border-zinc-700 bg-zinc-800/80 text-white hover:bg-zinc-700"
                : "border-rose-800 bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/40"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              isScreenSharing
                ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500"
                : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          >
            <MonitorUp className="h-5 w-5" />
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              isHandRaised
                ? "border-amber-600 bg-amber-500 text-zinc-950 hover:bg-amber-400"
                : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="h-5 w-5" />
          </button>

          {/* Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "chat" ? null : "chat")}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              activeSideDrawer === "chat"
                ? "border-fuchsia-600 bg-fuchsia-600 text-white"
                : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title="In-meeting chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>

          {/* Participants Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "participants" ? null : "participants")}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition shadow-lg ${
              activeSideDrawer === "participants"
                ? "border-fuchsia-600 bg-fuchsia-600 text-white"
                : "border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
            title="View participants"
          >
            <Users className="h-5 w-5" />
          </button>

          {/* End Call / Leave */}
          <button
            type="button"
            onClick={handleLeaveMeeting}
            className="flex h-12 items-center gap-2 rounded-2xl bg-rose-600 hover:bg-rose-500 px-6 text-sm font-semibold text-white transition shadow-lg shadow-rose-950/50"
            title="Leave meeting room"
          >
            <PhoneOff className="h-5 w-5" />
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default MeetingRoomPage;

import { API_BASE_URL } from "../lib/api";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
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
  endedAt?: string;
  isEnded?: boolean;
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
  const location = useLocation();

  const [meeting, setMeeting] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [restrictedOrgName, setRestrictedOrgName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Meeting Termination & Leaving State
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isEndingMeeting, setIsEndingMeeting] = useState(false);
  const [isMeetingEnded, setIsMeetingEnded] = useState(false);
  const [endReason, setEndReason] = useState<string>("");

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

  const isHost = Boolean(meeting && user && meeting.host.id === user.id);

  // 1. Verify meeting & load room data
  useEffect(() => {
    async function verifyAndLoadMeeting() {
      if (!meetingCode) return;
      try {
        setIsLoading(true);
        setAccessDeniedError(null);
        setNotFound(false);

        const res = await fetch(
          `${API_BASE_URL}/api/meetings/${meetingCode}?userId=${user?.id || ""}`,
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
        if (data.meeting?.status === "ENDED" || data.meeting?.isEnded) {
          setIsMeetingEnded(true);
          setEndReason("This meeting has already ended.");
          return;
        }
        setMeeting(data.meeting);
      } catch (err: any) {
        console.error("Error joining meeting room:", err);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAndLoadMeeting();
  }, [meetingCode, user?.id]);

  // Periodic Status Polling for End-for-All & Inactivity Expiration
  useEffect(() => {
    if (!meetingCode || isMeetingEnded || isLoading) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingCode}?userId=${user?.id || ""}`, {
          headers: { "x-user-id": user?.id || "" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.meeting?.status === "ENDED" || data.meeting?.isEnded) {
            setIsMeetingEnded(true);
            setEndReason("This meeting was ended by the host.");
          }
        }
      } catch {
        // network blip, retry next interval
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [meetingCode, user?.id, isMeetingEnded, isLoading]);

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

  const handleRedirectOut = () => {
    const fromOrgId = location.state?.fromOrgId || meeting?.organization?.id;
    const fromTab = location.state?.fromTab || "Meetings";
    if (fromOrgId) {
      navigate(`/organization/${fromOrgId}?tab=${fromTab}`);
    } else {
      navigate("/");
    }
  };

  const handleLeaveClick = () => {
    if (isHost) {
      setIsEndModalOpen(true);
    } else {
      handleConfirmLeaveOnly();
    }
  };

  const handleConfirmEndForAll = async () => {
    if (!meetingCode || !user?.id) return;
    try {
      setIsEndingMeeting(true);
      await fetch(`${API_BASE_URL}/api/meetings/${meetingCode}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({ userId: user.id }),
      });
      setIsEndModalOpen(false);
      handleRedirectOut();
    } catch (err) {
      console.error("Failed to end meeting:", err);
      handleRedirectOut();
    } finally {
      setIsEndingMeeting(false);
    }
  };

  const handleConfirmLeaveOnly = async () => {
    if (!meetingCode) return;
    try {
      if (user?.id) {
        await fetch(`${API_BASE_URL}/api/meetings/${meetingCode}/leave`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({ userId: user.id }),
        });
      }
      setIsEndModalOpen(false);
      handleRedirectOut();
    } catch (err) {
      console.error("Failed to leave meeting:", err);
      handleRedirectOut();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#121418] text-[#F3F3EE]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4963C8] mb-3" />
        <h2 className="text-sm font-semibold tracking-wide">Connecting to Meeting Room...</h2>
        <p className="mt-1 text-xs text-[#7E7C77] font-mono">Verifying credentials & organization permissions</p>
      </div>
    );
  }

  // Meeting Ended View
  if (isMeetingEnded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121418] px-4">
        <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-6 text-center shadow-2xl space-y-3.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-[#B44A4A]/50 bg-[#B44A4A]/20 text-[#FF8A8A]">
            <PhoneOff className="h-6 w-6" />
          </div>

          <h1 className="text-lg font-bold tracking-tight text-[#F3F3EE]">Meeting Ended</h1>
          <p className="text-xs text-[#A9ACB4] leading-relaxed">
            {endReason || "This meeting has concluded."}
          </p>

          <button
            type="button"
            onClick={handleRedirectOut}
            className="mt-3 w-full rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] py-2.5 text-xs font-semibold text-white transition shadow-sm"
          >
            {location.state?.fromOrgId || meeting?.organization?.id ? "Return to Workspace" : "Return to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  // Restricted Access Denied View
  if (accessDeniedError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121418] px-4">
        <div className="w-full max-w-lg rounded-[8px] border border-[#B44A4A]/40 bg-[#1D2026] p-6 shadow-2xl text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[6px] border border-[#B44A4A]/60 bg-[#B44A4A]/20 text-[#FF8A8A] mb-4">
            <Lock className="h-6 w-6" />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#B44A4A]/40 bg-[#B44A4A]/10 px-2.5 py-0.5 text-[10px] font-semibold text-[#FF8A8A]">
            <ShieldAlert className="h-3.5 w-3.5" /> Organization Restricted
          </span>

          <h1 className="mt-3 text-lg font-bold tracking-tight text-[#F3F3EE]">Access Denied</h1>
          <p className="mt-1.5 text-xs text-[#A9ACB4] leading-relaxed">
            {accessDeniedError}
          </p>

          <div className="mt-5 rounded-[5px] border border-[#383D47] bg-[#252932] p-3 text-left text-xs text-[#A9ACB4] space-y-1">
            <div className="flex items-center gap-2 text-[#C8C6C0]">
              <Building className="h-3.5 w-3.5 text-[#4963C8]" />
              <span>Target Organization: <strong className="text-[#F3F3EE]">{restrictedOrgName}</strong></span>
            </div>
            <p className="text-[11px] text-[#7E7C77]">
              Only verified, active employees of this organization are granted permission to participate in this meeting room.
            </p>
          </div>

          <div className="mt-6 flex justify-center gap-2.5">
            <button
              type="button"
              onClick={handleRedirectOut}
              className="flex items-center gap-1.5 rounded-[5px] bg-[#252932] hover:bg-[#2C3039] border border-[#383D47] px-4 py-2 text-xs font-semibold text-[#F3F3EE] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {location.state?.fromOrgId || meeting?.organization?.id ? "Return to Workspace" : "Return to Dashboard"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not Found View
  if (notFound || !meeting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121418] px-4">
        <div className="w-full max-w-md rounded-[8px] border border-[#383D47] bg-[#1D2026] p-6 text-center shadow-2xl">
          <h2 className="text-lg font-bold text-[#F3F3EE]">Meeting Not Found</h2>
          <p className="mt-1.5 text-xs text-[#A9ACB4]">
            No meeting matches code <span className="font-mono font-semibold text-[#9BB1FA]">{meetingCode}</span>.
          </p>
          <button
            type="button"
            onClick={handleRedirectOut}
            className="mt-4 rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] px-4 py-2 text-xs font-semibold text-white transition shadow-sm"
          >
            {location.state?.fromOrgId ? "Return to Workspace" : "Back to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  const isOrgMeeting = Boolean(meeting.organization);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#121418] text-[#F3F3EE]">
      {/* 1. Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#383D47] bg-[#1D2026] px-5 z-10">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={handleLeaveClick}
            className="flex items-center gap-1.5 rounded-[5px] border border-[#383D47] bg-[#252932] hover:bg-[#2C3039] px-2.5 py-1 text-xs font-medium text-[#C8C6C0] transition"
            title={isHost ? "End or leave meeting" : "Leave meeting"}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isHost ? "Exit" : "Leave"}</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#F3F3EE] truncate max-w-xs sm:max-w-md">
                {meeting.title}
              </h1>
              {isOrgMeeting ? (
                <span className="flex items-center gap-1 rounded-[3px] border border-[#4963C8]/40 bg-[#4963C8]/10 px-2 py-0.5 text-[10px] font-semibold text-[#9BB1FA] shrink-0">
                  <Building className="h-3 w-3" />
                  {meeting.organization?.name}
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-[3px] border border-[#383D47] bg-[#252932] px-2 py-0.5 text-[10px] font-semibold text-[#C8C6C0] shrink-0">
                  <Globe className="h-3 w-3" /> Open Meeting
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#A9ACB4]">
              <span className="font-mono text-[#C8C6C0]">{formatTimer(elapsedSeconds)}</span>
              <span>·</span>
              <span className="text-[#7E7C77]">Host: {meeting.host.name}</span>
            </div>
          </div>
        </div>

        {/* Header Right: Code copy & status */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 rounded-[5px] border border-[#383D47] bg-[#252932] px-2.5 py-1 text-xs font-mono font-medium text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE] transition"
            title="Click to copy meeting code"
          >
            {copiedCode ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#10B981]" />
                <span className="text-[#10B981]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#7E7C77]" />
                <span>{meeting.meetingCode}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 rounded-[3px] border border-[#10B981]/30 bg-[#10B981]/10 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            <span className="hidden sm:inline">Connected</span>
          </div>
        </div>
      </header>

      {/* 2. Main Video Stage & Side Drawer */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Stage Video Grid */}
        <main className="flex-1 flex flex-col p-3 sm:p-4 overflow-hidden">
          <div className="grid flex-1 gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-h-full overflow-y-auto">
            {/* User Tile (Self) */}
            <div className="relative flex flex-col items-center justify-center rounded-[6px] border border-[#383D47] bg-[#1D2026] overflow-hidden shadow-sm aspect-video sm:aspect-auto">
              {isCameraOn ? (
                <div className="relative h-full w-full flex items-center justify-center bg-[#17191E]">
                  {/* Video simulation preview */}
                  <div className="flex flex-col items-center">
                    <img
                      src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "You")}&background=2563eb&color=ffffff`}
                      alt="You"
                      className="h-20 w-20 rounded-[6px] border-2 border-[#4963C8]/60 object-cover shadow-md"
                    />
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                      <span className="text-xs font-medium text-[#C8C6C0]">Video Feed Active</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full bg-[#17191E]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[6px] bg-[#252932] text-lg font-bold text-[#A9ACB4] border border-[#383D47]">
                    {(user?.name || "U")[0]}
                  </div>
                  <p className="mt-2 text-xs text-[#7E7C77]">Camera turned off</p>
                </div>
              )}

              {/* Tile Overlay Label */}
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-0.5 text-[11px] backdrop-blur-sm border border-white/10">
                <span className="font-semibold text-[#F3F3EE]">You ({user?.name})</span>
                {isMicOn ? (
                  <Mic className="h-3 w-3 text-[#10B981]" />
                ) : (
                  <MicOff className="h-3 w-3 text-[#FF8A8A]" />
                )}
              </div>

              {isHandRaised && (
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-[3px] bg-[#D97706] px-1.5 py-0.5 text-[10px] font-bold text-black shadow-sm">
                  <Hand className="h-3 w-3" /> Hand Raised
                </div>
              )}
            </div>

            {/* Host Tile */}
            {meeting.host.id !== user?.id && (
              <div className="relative flex flex-col items-center justify-center rounded-[6px] border border-[#383D47] bg-[#1D2026] overflow-hidden shadow-sm aspect-video sm:aspect-auto">
                <div className="flex flex-col items-center">
                  <img
                    src={meeting.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.host.name)}&background=4963c8&color=ffffff`}
                    alt={meeting.host.name}
                    className="h-20 w-20 rounded-[6px] border border-[#383D47] object-cover shadow-md"
                  />
                  <p className="mt-2 text-xs text-[#7E7C77]">Host Audio Active</p>
                </div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-0.5 text-[11px] backdrop-blur-sm border border-white/10">
                  <span className="font-semibold text-[#F3F3EE]">{meeting.host.name} (Host)</span>
                  <Mic className="h-3 w-3 text-[#10B981]" />
                </div>
              </div>
            )}

            {/* Other Simulated Participants */}
            {meeting.participants
              .filter((p) => p.id !== user?.id && p.id !== meeting.host.id)
              .map((p) => (
                <div key={p.id} className="relative flex flex-col items-center justify-center rounded-[6px] border border-[#383D47] bg-[#1D2026] overflow-hidden shadow-sm aspect-video sm:aspect-auto">
                  <div className="flex flex-col items-center">
                    <img
                      src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=383d47&color=ffffff`}
                      alt={p.name}
                      className="h-16 w-16 rounded-[6px] border border-[#383D47] object-cover"
                    />
                    <p className="mt-2 text-xs text-[#7E7C77]">Connected</p>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-[4px] bg-black/70 px-2 py-0.5 text-[11px] backdrop-blur-sm border border-white/10">
                    <span className="font-medium text-[#F3F3EE]">{p.name}</span>
                    <Mic className="h-3 w-3 text-[#10B981]" />
                  </div>
                </div>
              ))}
          </div>
        </main>

        {/* Side Drawer: Participants or Chat */}
        {activeSideDrawer && (
          <aside className="w-80 shrink-0 border-l border-[#383D47] bg-[#1D2026] flex flex-col shadow-2xl z-20">
            {/* Drawer Header */}
            <div className="flex h-12 items-center justify-between border-b border-[#383D47] px-3">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSideDrawer("participants")}
                  className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium transition ${
                    activeSideDrawer === "participants"
                      ? "bg-[#252932] text-[#F3F3EE]"
                      : "text-[#A9ACB4] hover:text-[#F3F3EE]"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Participants ({(meeting.participants.length || 0) + 1})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSideDrawer("chat")}
                  className={`flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium transition ${
                    activeSideDrawer === "chat"
                      ? "bg-[#252932] text-[#F3F3EE]"
                      : "text-[#A9ACB4] hover:text-[#F3F3EE]"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveSideDrawer(null)}
                className="text-[#A9ACB4] hover:text-[#F3F3EE] text-xs px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body: Participants List */}
            {activeSideDrawer === "participants" && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#7E7C77]">In Meeting</div>
                {/* You */}
                <div className="flex items-center justify-between rounded-[5px] border border-[#383D47] bg-[#252932] p-2.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || "You")}`}
                      alt="You"
                      className="h-7 w-7 rounded-[4px] border border-[#383D47] object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#F3F3EE]">{user?.name} (You)</p>
                      <p className="text-[10px] text-[#9BB1FA]">{meeting.userRole}</p>
                    </div>
                  </div>
                  {isMicOn ? <Mic className="h-3.5 w-3.5 text-[#10B981]" /> : <MicOff className="h-3.5 w-3.5 text-[#FF8A8A]" />}
                </div>

                {/* Host */}
                {meeting.host.id !== user?.id && (
                  <div className="flex items-center justify-between rounded-[5px] border border-[#383D47] bg-[#252932] p-2.5">
                    <div className="flex items-center gap-2">
                      <img
                        src={meeting.host.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.host.name)}`}
                        alt={meeting.host.name}
                        className="h-7 w-7 rounded-[4px] border border-[#383D47] object-cover"
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#F3F3EE]">{meeting.host.name}</p>
                        <p className="text-[10px] text-[#FBBF24]">Host</p>
                      </div>
                    </div>
                    <Mic className="h-3.5 w-3.5 text-[#10B981]" />
                  </div>
                )}

                {/* Other members */}
                {meeting.participants
                  .filter((p) => p.id !== user?.id && p.id !== meeting.host.id)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-[5px] border border-[#383D47] bg-[#252932] p-2.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}`}
                          alt={p.name}
                          className="h-7 w-7 rounded-[4px] border border-[#383D47] object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-[#F3F3EE]">{p.name}</p>
                          <p className="text-[10px] text-[#A9ACB4]">{p.role || "Member"}</p>
                        </div>
                      </div>
                      <Mic className="h-3.5 w-3.5 text-[#10B981]" />
                    </div>
                  ))}
              </div>
            )}

            {/* Drawer Body: In-Meeting Chat */}
            {activeSideDrawer === "chat" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="rounded-[5px] border border-[#383D47] bg-[#252932] p-2 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-[#7E7C77] mb-1">
                        <span className="font-semibold text-[#C8C6C0]">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-[#F3F3EE]">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} className="border-t border-[#383D47] p-2.5 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 rounded-[5px] border border-[#383D47] bg-[#17191E] px-2.5 py-1.5 text-xs text-[#F3F3EE] placeholder:text-[#7E7C77] outline-none focus:border-[#4963C8] transition"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-[5px] bg-[#4963C8] hover:bg-[#3E56B5] text-white disabled:opacity-40 transition shrink-0"
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
      <footer className="flex h-16 shrink-0 items-center justify-center border-t border-[#383D47] bg-[#1D2026] px-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Microphone */}
          <button
            type="button"
            onClick={() => setIsMicOn(!isMicOn)}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              isMicOn
                ? "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
                : "border-[#B44A4A] bg-[#B44A4A] text-white hover:bg-[#A33E3E]"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              isCameraOn
                ? "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
                : "border-[#B44A4A] bg-[#B44A4A] text-white hover:bg-[#A33E3E]"
            }`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          {/* Screen Share */}
          <button
            type="button"
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              isScreenSharing
                ? "border-[#10B981] bg-[#10B981] text-white"
                : "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
            }`}
            title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          >
            <MonitorUp className="h-4 w-4" />
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={() => setIsHandRaised(!isHandRaised)}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              isHandRaised
                ? "border-[#D97706] bg-[#D97706] text-black"
                : "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
            }`}
            title={isHandRaised ? "Lower hand" : "Raise hand"}
          >
            <Hand className="h-4 w-4" />
          </button>

          {/* Chat Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "chat" ? null : "chat")}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              activeSideDrawer === "chat"
                ? "border-[#4963C8] bg-[#4963C8] text-white"
                : "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
            }`}
            title="In-meeting chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          {/* Participants Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveSideDrawer(activeSideDrawer === "participants" ? null : "participants")}
            className={`flex h-10 w-10 items-center justify-center rounded-[5px] border transition shadow-sm ${
              activeSideDrawer === "participants"
                ? "border-[#4963C8] bg-[#4963C8] text-white"
                : "border-[#383D47] bg-[#252932] text-[#C8C6C0] hover:bg-[#2C3039] hover:text-[#F3F3EE]"
            }`}
            title="View participants"
          >
            <Users className="h-4 w-4" />
          </button>

          {/* End Call / Leave */}
          <button
            type="button"
            onClick={handleLeaveClick}
            className={`flex h-10 items-center gap-1.5 rounded-[5px] px-4 text-xs font-semibold text-white transition shadow-sm ${
              isHost
                ? "bg-[#B44A4A] hover:bg-[#A33E3E]"
                : "bg-[#252932] hover:bg-[#2C3039] border border-[#383D47] text-[#C8C6C0]"
            }`}
            title={isHost ? "End meeting for all or leave" : "Leave meeting room"}
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">{isHost ? "End Meeting" : "Leave Room"}</span>
          </button>
        </div>
      </footer>

      {/* End Meeting Modal for Host */}
      {isEndModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[8px] border border-[#383D47] bg-[#1D2026] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#B44A4A]/60 bg-[#B44A4A]/20 text-[#FF8A8A]">
                <PhoneOff className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F3F3EE]">End Meeting</h3>
                <p className="text-xs text-[#A9ACB4]">Choose how to exit this room</p>
              </div>
            </div>

            <p className="text-xs text-[#C8C6C0] leading-relaxed">
              You are the meeting creator. You can choose to <strong className="text-[#F3F3EE]">End the meeting for all participants</strong> immediately, or simply <strong className="text-[#F3F3EE]">Leave</strong> and let other participants continue.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isEndingMeeting}
                onClick={handleConfirmEndForAll}
                className="flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#B44A4A] hover:bg-[#A33E3E] py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition disabled:opacity-50"
              >
                {isEndingMeeting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneOff className="h-3.5 w-3.5" />}
                End Meeting for All
              </button>

              <button
                type="button"
                disabled={isEndingMeeting}
                onClick={handleConfirmLeaveOnly}
                className="flex w-full items-center justify-center rounded-[5px] border border-[#383D47] bg-[#252932] hover:bg-[#2C3039] py-2.5 text-xs font-semibold text-[#F3F3EE] transition disabled:opacity-50"
              >
                Just Leave Meeting
              </button>

              <button
                type="button"
                disabled={isEndingMeeting}
                onClick={() => setIsEndModalOpen(false)}
                className="w-full text-center py-1.5 text-xs font-medium text-[#7E7C77] hover:text-[#F3F3EE] transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingRoomPage;

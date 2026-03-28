import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMessages, useSendMessage } from "../hooks/useQueries";

interface ChatScreenProps {
  requestId: string;
  otherPartyName: string;
  userRole: "customer" | "mechanic";
  onBack: () => void;
}

export default function ChatScreen({
  requestId,
  otherPartyName,
  userRole,
  onBack,
}: ChatScreenProps) {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? "";
  const { data: messages, isLoading } = useGetMessages(requestId);
  const sendMessage = useSendMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesCount = messages?.length ?? 0;

  // Auto-scroll to latest message whenever message count changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesCount triggers scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesCount]);

  // Scroll to bottom when keyboard opens (visual viewport resize)
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await sendMessage.mutateAsync({ requestId, message: text });
    } catch {
      // keep input cleared; error is transient
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function formatTime(createdAt: bigint) {
    const ms = Number(createdAt) / 1_000_000;
    return new Date(ms).toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      className="flex flex-col h-[100dvh] overflow-hidden bg-background"
      data-ocid="chat.screen"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 bg-card border-b border-border shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center active:scale-95 transition-transform"
          data-ocid="chat.back.button"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex flex-col">
          <p className="font-bold text-foreground text-base leading-tight">
            {userRole === "customer" ? "Mechanic" : "Customer"}:{" "}
            {otherPartyName}
          </p>
          <p className="text-muted-foreground text-xs">Service Chat</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !messages || messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col items-center justify-center gap-3 py-16 text-center"
          >
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Send className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">
              Start conversation
            </p>
            <p className="text-muted-foreground/70 text-xs">
              Messages are visible only to you and the{" "}
              {userRole === "customer" ? "mechanic" : "customer"}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.senderId.toString() === currentPrincipal;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-0.5 ${
                  isOwnMessage ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                    isOwnMessage
                      ? "bg-yellow-400 text-black rounded-2xl rounded-br-sm"
                      : "bg-zinc-700 text-white rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 pt-3 bg-card border-t border-border shrink-0 flex items-center gap-2"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          data-ocid="chat.input"
          className="flex-1 h-11 rounded-2xl bg-secondary border border-border px-4 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sendMessage.isPending || !input.trim()}
          data-ocid="chat.send.button"
          className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-50"
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
          ) : (
            <Send className="w-4 h-4 text-primary-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Bot, User } from "lucide-react";
import RichMessage from "./RichMessage";

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <span className="chat-typing-dot w-2 h-2 rounded-full" style={{ background: "var(--chat-accent)" }} />
    <span className="chat-typing-dot w-2 h-2 rounded-full" style={{ background: "var(--chat-accent)" }} />
    <span className="chat-typing-dot w-2 h-2 rounded-full" style={{ background: "var(--chat-accent)" }} />
  </div>
);

const ChatMessageList = ({
  messages,
  isTyping,
  welcomeMessage,
  jobs,
  backendUrl,
  threadRef,
  restoring,
}) => (
  <div
    ref={threadRef}
    className="chat-thread-scroll flex-1 overflow-y-auto px-4 py-4 lg:px-6 space-y-5 min-h-0"
  >
    {restoring && (
      <p className="text-center text-xs py-4" style={{ color: "var(--chat-text-muted)" }}>
        Restoring conversation…
      </p>
    )}

    {messages.map((msg, idx) => (
      <div
        key={idx}
        className={`flex gap-3 app-animate-in max-w-3xl mx-auto w-full ${
          msg.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: msg.role === "user" ? "var(--chat-accent)" : "var(--chat-surface-muted)",
            color: msg.role === "user" ? "#fff" : "var(--chat-accent)",
            border: msg.role === "assistant" ? "1px solid var(--chat-border)" : "none",
          }}
        >
          {msg.role === "user" ? <User size={17} /> : <Bot size={17} />}
        </div>
        <div
          className={`max-w-[85%] px-4 py-3 rounded-2xl ${
            msg.role === "user" ? "chat-bubble-user rounded-br-md" : "chat-bubble-bot rounded-bl-md"
          }`}
        >
          {msg.role === "user" ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="rich-chat-text">
              <RichMessage content={msg.content} jobs={jobs} backendUrl={backendUrl} light />
            </div>
          )}
        </div>
      </div>
    ))}

    {isTyping && (
      <div className="flex gap-3 max-w-3xl mx-auto w-full">
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--chat-surface-muted)",
            color: "var(--chat-accent)",
            border: "1px solid var(--chat-border)",
          }}
        >
          <Bot size={17} />
        </div>
        <div className="chat-bubble-bot rounded-2xl rounded-bl-md">
          <TypingIndicator />
        </div>
      </div>
    )}

    <div className="h-2" aria-hidden="true" />
  </div>
);

export { TypingIndicator };
export default ChatMessageList;

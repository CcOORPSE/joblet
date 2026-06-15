import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import RecruiterRichMessage from "../../components/recruiter/RecruiterRichMessage";
import SuggestedRecruiterChips from "../../components/recruiter/SuggestedRecruiterChips";
import { Bot, Send, Sparkles, User } from "lucide-react";

const WELCOME =
  "Hi! I'm **HireBot**, your hiring assistant. I can summarize your applicant pipeline, help screen candidates, draft job descriptions, and analyze job performance. What would you like to know?";

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-3">
    <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce [animation-delay:0ms]" />
    <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce [animation-delay:150ms]" />
    <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce [animation-delay:300ms]" />
  </div>
);

const RecruiterChat = () => {
  const navigate = useNavigate();
  const { sendRecruiterChatMessage, backendUrl, companyToken } = useContext(AppContext);

  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chipsVisible, setChipsVisible] = useState(true);
  const threadRef = useRef(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setChipsVisible(false);
    const userMessage = { role: "user", content: trimmed };
    const history = messages
      .filter((m) => m.content !== WELCOME || m.role === "user")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const response = await sendRecruiterChatMessage(trimmed, history, sessionId);

    setIsTyping(false);
    if (response.sessionId) setSessionId(response.sessionId);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: response.success
          ? response.reply
          : response.reply || "HireBot is temporarily unavailable. Please try again.",
      },
    ]);
  };

  const handleUseInAddJob = (markdown) => {
    navigate("/dashboard/add-job", { state: { prefilledDescription: markdown } });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[480px] -m-2">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">AI Assistant — HireBot</h2>
          <p className="text-xs text-gray-500">Pipeline, screening, and job drafts</p>
        </div>
      </div>

      <SuggestedRecruiterChips
        onSelect={sendMessage}
        disabled={isTyping}
        visible={chipsVisible}
      />

      <div ref={threadRef} className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-brand-orange text-white"
                  : "bg-brand-orange/10 text-brand-orange"
              }`}
            >
              {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                msg.role === "user"
                  ? "bg-brand-orange text-white rounded-tr-sm"
                  : "bg-white border border-gray-100 shadow-sm rounded-tl-sm"
              }`}
            >
              {msg.role === "user" ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <RecruiterRichMessage
                  content={msg.content}
                  backendUrl={backendUrl}
                  onUseInAddJob={handleUseInAddJob}
                />
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="shrink-0 w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="pt-4 border-t border-gray-100">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask HireBot about your pipeline, candidates, or job posts..."
            rows={1}
            aria-label="Message to HireBot"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 rounded-xl outline-none resize-none text-sm text-gray-700 max-h-32"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="shrink-0 p-3 bg-brand-orange text-white rounded-xl hover:bg-jl-accent transition-all disabled:opacity-40"
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecruiterChat;

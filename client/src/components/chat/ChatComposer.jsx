import React from "react";
import { Loader2, Mic, Paperclip, Send, Sparkles } from "lucide-react";

const ChatComposer = ({
  input,
  onInputChange,
  onSubmit,
  onAttachClick,
  isTyping,
  isParsing,
  disabled,
  fileInputRef,
  onFileChange,
  activeMode = "default",
  onChangeMode,
  placeholder = "Initiate a query or send a command to the AI...",
}) => (
  <div className="chat-composer-wrap shrink-0 px-4 pb-4 pt-2 lg:px-6 lg:pb-6">
    <form onSubmit={onSubmit}>
      <div className="chat-composer rounded-2xl p-3 lg:p-4">
        <div className="flex items-start gap-2 mb-3">
          <Sparkles size={18} className="shrink-0 mt-0.5" style={{ color: "var(--chat-accent)" }} />
          <textarea
            value={input}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder={
              activeMode === "job-scraper"
                ? "Describe the job role and location to scrape, e.g. Node.js developer in Singapore..."
                : activeMode === "resume_job"
                ? "Ask me to match jobs against your uploaded resume..."
                : activeMode === "websearch"
                ? "Enter your search query to seek answers from the web..."
                : placeholder
            }
            rows={1}
            disabled={disabled}
            aria-label="Message to CareerBot"
            className="flex-1 bg-transparent outline-none resize-none text-base max-h-28 disabled:opacity-50 leading-relaxed"
            style={{ color: "var(--chat-text)" }}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAttachClick}
              disabled={isParsing || disabled}
              className="chat-btn-ghost flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
            >
              <Paperclip size={18} />
              <span className="hidden sm:inline">Attach</span>
            </button>

            <select
              value={activeMode}
              onChange={(e) => onChangeMode && onChangeMode(e.target.value)}
              disabled={disabled}
              className="bg-transparent border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none transition-all duration-300 hover:brightness-110 cursor-pointer disabled:opacity-50"
              style={{
                borderColor: "var(--chat-border)",
                background: "var(--chat-surface-muted)",
                color: "var(--chat-text-secondary)",
                backdropFilter: "blur(8px)"
              }}
            >
              <option value="default" style={{ background: "var(--chat-bg)", color: "var(--chat-text)" }}>Default (CareerBot)</option>
              <option value="job-scraper" style={{ background: "var(--chat-bg)", color: "var(--chat-text)" }}>@server/job-scraper/</option>
              <option value="resume_job" style={{ background: "var(--chat-bg)", color: "var(--chat-text)" }}>@server/resume_job/</option>
              <option value="websearch" style={{ background: "var(--chat-bg)", color: "var(--chat-text)" }}>Web Search</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="chat-btn-ghost p-2 rounded-xl opacity-40 cursor-not-allowed hidden sm:flex"
              aria-label="Voice input (coming soon)"
              title="Voice input coming soon"
            >
              <Mic size={18} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onFileChange}
            />

            {isTyping ? (
              <button
                type="button"
                disabled
                className="chat-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold min-w-[100px] justify-center"
              >
                <Loader2 size={18} className="chat-spinner" />
                Thinking…
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className="chat-btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
              >
                <Send size={18} />
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  </div>
);

export default ChatComposer;

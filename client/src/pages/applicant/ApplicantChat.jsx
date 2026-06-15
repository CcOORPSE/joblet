import React, { useContext, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../../context/AppContext";
import ChatHeader from "../../components/chat/ChatHeader";
import ChatWelcome from "../../components/chat/ChatWelcome";
import ChatMessageList from "../../components/chat/ChatMessageList";
import ChatComposer from "../../components/chat/ChatComposer";
import SuggestedChips from "../../components/chat/SuggestedChips";
import { FileText, X } from "lucide-react";
import { detectChatMode } from "../../utils/chatModeUtils";

const SESSION_STORAGE_KEY = "applicantChatSessionId";

const WELCOME_MESSAGE =
  "Hi! I'm **CareerBot**, your AI career assistant. I can analyze your resume for ATS compatibility, recommend matching jobs, and give personalized career advice.\n\nAttach a PDF resume or try a suggested prompt below!";

const ApplicantChat = () => {
  const {
    user,
    sendChatMessage,
    parseResumeForChat,
    fetchChatSession,
    jobs,
    backendUrl,
    loginWithGoogle,
  } = useContext(AppContext);

  const [searchParams, setSearchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(SESSION_STORAGE_KEY));
  const [messages, setMessages] = useState([{ role: "assistant", content: WELCOME_MESSAGE }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [activeMode, setActiveMode] = useState("default");
  const threadRef = useRef(null);
  const fileInputRef = useRef(null);

  const isWelcomeOnly =
    messages.length === 1 && messages[0].role === "assistant" && messages[0].content === WELCOME_MESSAGE;

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping, isWelcomeOnly]);

  useEffect(() => {
    const paramSession = searchParams.get("session");
    const idToLoad = paramSession || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!user || !idToLoad) return;

    let active = true;
    setRestoring(true);

    fetchChatSession(idToLoad).then((session) => {
      if (!active || !session?.messages?.length) {
        setRestoring(false);
        return;
      }
      setSessionId(session.id);
      localStorage.setItem(SESSION_STORAGE_KEY, session.id);
      setMessages(session.messages);
      setRestoring(false);
    });

    return () => {
      active = false;
    };
  }, [user, searchParams, fetchChatSession]);

  const startNewChat = () => {
    setSessionId(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSearchParams({});
    setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
    setResumeText("");
    setAttachedFile(null);
    setActiveMode("default");
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    if (!user) {
      loginWithGoogle();
      e.target.value = "";
      return;
    }

    setAttachedFile(file);
    setIsParsing(true);
    const result = await parseResumeForChat(file);
    setIsParsing(false);
    if (result?.success) {
      setResumeText(result.resumeText);
    } else {
      setAttachedFile(null);
      setResumeText("");
    }
    e.target.value = "";
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    setResumeText("");
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    if (!user) {
      loginWithGoogle();
      return;
    }

    const resolvedMode = detectChatMode(trimmed, { resumeText, currentMode: activeMode });
    if (resolvedMode !== activeMode) {
      setActiveMode(resolvedMode);
    }

    const userMessage = { role: "user", content: trimmed };
    const history = messages
      .filter((m) => m.content !== WELCOME_MESSAGE || m.role === "user")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const response = await sendChatMessage(trimmed, history, resumeText, sessionId, resolvedMode);

    setIsTyping(false);

    if (response.chatMode && response.chatMode !== resolvedMode) {
      setActiveMode(response.chatMode);
    }

    if (response.sessionId) {
      setSessionId(response.sessionId);
      localStorage.setItem(SESSION_STORAGE_KEY, response.sessionId);
    }

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: response.success
          ? response.reply
          : response.reply || "Something went wrong. Try again.",
      },
    ]);
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <ChatHeader onNewChat={startNewChat} user={user} />

      {!user && (
            <div
              className="mx-4 mt-3 px-4 py-3 rounded-xl text-sm flex flex-col sm:flex-row sm:items-center gap-2 justify-between shrink-0"
              style={{ background: "var(--chat-accent-soft)", color: "var(--chat-text)" }}
            >
              <span>Sign in to chat with CareerBot</span>
              <button
                type="button"
                onClick={loginWithGoogle}
                className="shrink-0 px-4 py-1.5 text-xs font-semibold text-white rounded-lg chat-btn-primary"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {isWelcomeOnly && !restoring ? (
            <ChatWelcome onSelectChip={sendMessage} disabled={isTyping || restoring || !user} />
          ) : (
            <>
              {!isWelcomeOnly && (
                <div className="shrink-0 px-4 pt-2 lg:hidden">
                  <SuggestedChips onSelect={sendMessage} disabled={isTyping || restoring} />
                </div>
              )}
              <ChatMessageList
                messages={messages}
                isTyping={isTyping}
                welcomeMessage={WELCOME_MESSAGE}
                jobs={jobs}
                backendUrl={backendUrl}
                threadRef={threadRef}
                restoring={restoring}
              />
            </>
          )}

          {(attachedFile || isParsing) && (
            <div
              className="shrink-0 px-4 lg:px-6 py-2"
              style={{ borderTop: "1px solid var(--chat-border)" }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm max-w-3xl mx-auto"
                style={{ background: "var(--chat-surface-muted)", color: "var(--chat-text-secondary)" }}
              >
                <FileText size={16} style={{ color: "var(--chat-accent)" }} />
                <span className="truncate max-w-[200px]">
                  {isParsing ? "Parsing resume..." : attachedFile?.name}
                </span>
                {!isParsing && (
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="hover:opacity-80"
                    aria-label="Remove attachment"
                  >
                    <X size={16} style={{ color: "var(--chat-accent)" }} />
                  </button>
                )}
              </div>
            </div>
          )}

          <ChatComposer
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSubmit={handleSend}
            onAttachClick={() => fileInputRef.current?.click()}
            isTyping={isTyping}
            isParsing={isParsing}
            disabled={!user || restoring}
            fileInputRef={fileInputRef}
            onFileChange={handleFileAttach}
            activeMode={activeMode}
            onChangeMode={setActiveMode}
            placeholder={
              user ? "Initiate a query or send a command to the AI..." : "Sign in to start chatting..."
            }
          />
    </div>
  );
};

export default ApplicantChat;

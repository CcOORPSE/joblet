import React from "react";
import { Plus } from "lucide-react";
import AppSectionHeader from "./AppSectionHeader";

const ChatHeader = ({ onNewChat, user }) => (
  <AppSectionHeader
    title="CareerBot"
    subtitle="Your AI career assistant"
    action={
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl text-white transition-colors"
          style={{ background: "var(--chat-text)" }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Chat</span>
        </button>
        {user?.photoURL && (
          <img
            src={user.photoURL}
            alt=""
            className="w-8 h-8 rounded-full object-cover hidden sm:block"
            style={{ border: "2px solid var(--chat-border)" }}
          />
        )}
      </div>
    }
  />
);

export default ChatHeader;

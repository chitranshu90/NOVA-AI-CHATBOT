import { Check, Copy, Sparkles, UserRound } from "lucide-react";

export default function Message({ message, copied, onCopy }) {
  const isUser = message.role === "user";
  const isError = message.role === "error";

  return (
    <article className={`message-row ${isUser ? "from-user" : "from-assistant"} ${isError ? "is-error" : ""}`}>
      <div className={`message-avatar ${isUser ? "user-avatar" : "assistant-avatar"}`} aria-hidden="true">
        {isUser ? <UserRound size={16} /> : <Sparkles size={16} />}
      </div>
      <div className="message-content">
        <div className="message-label">{isUser ? "You" : isError ? "Couldn’t send" : "Nova"}</div>
        <div className="message-text">{message.content}</div>
        {!isUser && !isError && (
          <button
            className="copy-button"
            onClick={() => onCopy(message.id, message.content)}
            aria-label={copied ? "Response copied" : "Copy response"}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        )}
      </div>
    </article>
  );
}


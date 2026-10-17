import { ArrowUp, Paperclip } from "lucide-react";
import { useRef } from "react";

export default function ChatInput({ value, onChange, onSend, isLoading }) {
  const textareaRef = useRef(null);

  function handleChange(event) {
    onChange(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${Math.min(event.target.scrollHeight, 180)}px`;
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="composer-shell">
      <div className="composer">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Nova..."
          rows={1}
          maxLength={8000}
          aria-label="Message Nova"
          disabled={isLoading}
        />
        <div className="composer-controls">
          <span className="input-hint"><Paperclip size={14} /> Shift + Enter for a new line</span>
          <button
            className="send-button"
            onClick={onSend}
            disabled={isLoading || !value.trim()}
            aria-label="Send message"
            title="Send message"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </div>
      </div>
      <p className="composer-disclaimer">Nova can make mistakes. Check important information.</p>
    </div>
  );
}


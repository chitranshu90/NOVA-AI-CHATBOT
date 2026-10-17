import {
  MessageSquare,
  Moon,
  Plus,
  Sparkles,
  Sun,
  X,
} from "lucide-react";

export default function Sidebar({
  conversations,
  activeId,
  theme,
  isOpen,
  onNewChat,
  onSelectChat,
  onToggleTheme,
  onClose,
}) {
  return (
    <>
      <button
        aria-label="Close navigation"
        className={`sidebar-backdrop ${isOpen ? "is-visible" : ""}`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
      />
      <aside className={`sidebar ${isOpen ? "is-open" : ""}`} aria-label="Chat navigation">
        <div className="sidebar-top">
          <a className="brand" href="/" aria-label="Nova AI home">
            <span className="brand-mark"><Sparkles size={17} strokeWidth={2.3} /></span>
            <span>nova<span className="brand-ai">.ai</span></span>
          </a>
          <button className="icon-button sidebar-close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <button className="new-chat-button" onClick={onNewChat}>
          <Plus size={17} />
          <span>New chat</span>
          <span className="shortcut">Ctrl K</span>
        </button>

        <div className="history">
          <p className="section-label">RECENT</p>
          {conversations.length === 0 ? (
            <p className="empty-history">Your conversations will show up here.</p>
          ) : (
            <nav className="conversation-list" aria-label="Conversation history">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`history-item ${activeId === conversation.id ? "is-active" : ""}`}
                  onClick={() => onSelectChat(conversation.id)}
                  title={conversation.title}
                >
                  <MessageSquare size={15} />
                  <span>{conversation.title}</span>
                </button>
              ))}
            </nav>
          )}
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-note">
            <span className="privacy-dot" />
            <span>Your chats stay on this device</span>
          </div>
          <button className="theme-button" onClick={onToggleTheme}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Light appearance" : "Dark appearance"}</span>
          </button>
          <div className="sidebar-credit">A little more clarity, every day.</div>
        </div>
      </aside>
    </>
  );
}


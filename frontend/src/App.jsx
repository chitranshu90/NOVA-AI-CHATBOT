import {
  BookOpen,
  Code2,
  Menu,
  MessageCircleQuestion,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ChatInput from "./components/ChatInput.jsx";
import Message from "./components/Message.jsx";
import Sidebar from "./components/Sidebar.jsx";

const STORAGE_KEY = "nova-ai-conversations";
const THEME_KEY = "nova-ai-theme";
const configuredApiUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const API_BASE_URL = (configuredApiUrl.includes("://") ? configuredApiUrl : `https://${configuredApiUrl}`)
  .replace(/\/+$/, "");

const suggestions = [
  { label: "Explain a difficult concept", prompt: "Explain a difficult concept to me in simple, clear steps.", icon: BookOpen },
  { label: "Help me write code", prompt: "Help me write some code. Ask what I am trying to build first.", icon: Code2 },
  { label: "Prepare me for an interview", prompt: "Help me prepare for an interview. Start by asking what role I am interviewing for.", icon: UsersRound },
  { label: "Help me learn something new", prompt: "Teach me something new in an engaging, beginner-friendly way.", icon: MessageCircleQuestion },
];

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) {
      throw new Error("Saved conversations are not a list.");
    }
    return {
      conversations: saved.filter(
          (conversation) =>
            conversation &&
            typeof conversation.id === "string" &&
            typeof conversation.title === "string" &&
            Array.isArray(conversation.messages) &&
            conversation.messages.every(
              (message) =>
                message &&
                typeof message.id === "string" &&
                ["user", "assistant", "error"].includes(message.role) &&
                typeof message.content === "string",
            ),
      ),
      theme: localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light",
      error: "",
    };
  } catch (error) {
    console.error("Could not read saved Nova AI settings.", error);
    return {
      conversations: [],
      theme: "light",
      error: "Nova could not read browser storage. Conversations and appearance may not be saved.",
    };
  }
}

function createId() {
  return crypto.randomUUID();
}

function makeTitle(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 34 ? `${trimmed.slice(0, 34).trimEnd()}…` : trimmed;
}

function makeMessage(role, content) {
  return { id: createId(), role, content };
}

export default function App() {
  const [savedState] = useState(readSavedState);
  const [conversations, setConversations] = useState(savedState.conversations);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(savedState.theme);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copyError, setCopyError] = useState("");
  const [storageError, setStorageError] = useState(savedState.error);
  const messagesEndRef = useRef(null);
  const inFlightRef = useRef(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeId),
    [activeId, conversations],
  );
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    if (savedState.error) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error("Could not save Nova AI conversations.", error);
      setStorageError("Nova could not save conversations to browser storage.");
    }
  }, [conversations, savedState.error]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (savedState.error) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error("Could not save Nova AI appearance.", error);
      setStorageError("Nova could not save appearance to browser storage.");
    }
  }, [savedState.error, theme]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  useEffect(() => {
    function handleShortcut(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startNewChat();
      }
      if (event.key === "Escape") setIsSidebarOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function updateConversation(id, update) {
    setConversations((current) =>
      current.map((conversation) => (conversation.id === id ? update(conversation) : conversation)),
    );
  }

  function startNewChat() {
    setActiveId(null);
    setDraft("");
    setIsSidebarOpen(false);
  }

  function clearConversation() {
    if (!activeId || isLoading) return;
    setConversations((current) => current.filter((conversation) => conversation.id !== activeId));
    setActiveId(null);
    setDraft("");
  }

  async function sendMessage(text = draft) {
    const content = text.trim();
    if (!content || isLoading || inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setDraft("");

    const conversationId = activeId || createId();
    const userMessage = makeMessage("user", content);
    const history = (activeConversation?.messages || [])
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map(({ role, content: messageContent }) => ({ role, content: messageContent }));
    const recentContext = [...history, { role: "user", content }];
    const requestMessages = [];
    let contextCharacters = 0;
    for (const message of recentContext.reverse()) {
      if (
        requestMessages.length >= 40 ||
        message.content.length > 8_000 ||
        contextCharacters + message.content.length > 24_000
      ) {
        break;
      }
      requestMessages.push(message);
      contextCharacters += message.content.length;
    }
    requestMessages.reverse();

    setActiveId(conversationId);
    setConversations((current) => {
      const existing = current.find((conversation) => conversation.id === conversationId);
      const next = {
        id: conversationId,
        title: existing?.title || makeTitle(content),
        updatedAt: new Date().toISOString(),
        messages: [...(existing?.messages || []), userMessage],
      };
      return [next, ...current.filter((conversation) => conversation.id !== conversationId)];
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Nova could not answer just now. Please try again.");
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Nova returned an empty response. Please try again.");
      }
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        updatedAt: new Date().toISOString(),
        messages: [...conversation.messages, makeMessage("assistant", data.reply.trim())],
      }));
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "Could not reach the Nova AI server. Refresh the page and check that the backend is running."
          : error.message;
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: [...conversation.messages, makeMessage("error", message)],
      }));
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }

  async function copyResponse(id, content) {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch (error) {
      console.error("Could not copy the Nova AI response.", error);
      setCopyError("Clipboard access is unavailable. Select the response text to copy it.");
      window.setTimeout(() => setCopyError(""), 4000);
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        theme={theme}
        isOpen={isSidebarOpen}
        onNewChat={startNewChat}
        onSelectChat={(id) => {
          setActiveId(id);
          setIsSidebarOpen(false);
        }}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="main-panel">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <div className="topbar-title">
            <span className="status-dot" />
            <span>Nova AI</span>
            <span className="model-caption">Your thoughtful assistant</span>
          </div>
          {messages.length > 0 ? (
            <button className="clear-button" onClick={clearConversation} disabled={isLoading}>
              <Trash2 size={15} />
              <span>Clear chat</span>
            </button>
          ) : <div className="topbar-spacer" />}
        </header>

        <section className={`chat-stage ${messages.length ? "has-messages" : "is-welcome"}`}>
          {messages.length === 0 ? (
            <div className="welcome-panel">
              <div className="welcome-kicker"><span className="kicker-line" /> A LITTLE MORE CLARITY</div>
              <h1>What can I help<br className="desktop-break" /> you with?</h1>
              <p className="welcome-copy">A curious mind is a powerful thing. Ask, explore, and make your next idea happen.</p>
              <div className="suggestion-grid">
                {suggestions.map(({ label, prompt, icon: Icon }) => (
                  <button className="suggestion-card" key={label} onClick={() => sendMessage(prompt)}>
                    <span className="suggestion-icon"><Icon size={17} /></span>
                    <span>{label}</span>
                    <span className="suggestion-arrow" aria-hidden="true">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list" aria-live="polite">
              {messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  copied={copiedId === message.id}
                  onCopy={copyResponse}
                />
              ))}
              {isLoading && (
                <div className="message-row from-assistant loading-row" role="status" aria-label="Nova is thinking">
                  <div className="message-avatar assistant-avatar"><span className="loading-star">✳</span></div>
                  <div className="loading-dots"><span /><span /><span /></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <div className="composer-area">
          {storageError && <p className="storage-warning" role="status">{storageError}</p>}
          {copyError && <p className="copy-error" role="status">{copyError}</p>}
          <ChatInput value={draft} onChange={setDraft} onSend={() => sendMessage()} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
}

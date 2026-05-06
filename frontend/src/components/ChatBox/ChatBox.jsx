import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, RotateCcw, SendHorizontal, X } from "lucide-react";
import {
  DEFAULT_CENTER_INFO,
  DEFAULT_SUGGESTIONS,
  DEFAULT_CHAT_CONFIG,
} from "./chatConfig";
import { askAssistant } from "../../services/chatAssistantService";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import api from "../../services/api";

const MAX_HISTORY = 20;

function withAlpha(hex, alpha) {
  if (!hex || !hex.startsWith("#")) return hex;
  return `${hex}${alpha}`;
}

export default function ChatBox() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);

  const [chatCfg, setChatCfg] = useState(DEFAULT_CHAT_CONFIG);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevBotCount = useRef(0);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await api.get("/chat-config");
        const data = res.data;

        if (data.suggestions?.length) setSuggestions(data.suggestions);
        if (data.chatConfig) {
          setChatCfg((prev) => ({ ...prev, ...data.chatConfig }));
        }

        const welcomeMsg =
          data.chatConfig?.welcomeMessage || DEFAULT_CHAT_CONFIG.welcomeMessage;
        setMessages([{ role: "bot", text: welcomeMsg }]);
        prevBotCount.current = 1;
      } catch {
        setMessages([{ role: "bot", text: DEFAULT_CHAT_CONFIG.welcomeMessage }]);
        prevBotCount.current = 1;
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [open]);

  useEffect(() => {
    const botCount = messages.filter((m) => m.role === "bot").length;
    if (botCount > prevBotCount.current && !open) {
      setHasUnread(true);
    }
    prevBotCount.current = botCount;
  }, [messages, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      const target = event.target;

      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const sendMessage = useCallback(
    async (textOverride) => {
      const text = (textOverride ?? input).trim();
      if (!text || loading) return;

      setInput("");
      setShowSuggestions(false);
      setError(null);

      const userMsg = { role: "user", text };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const recentHistory = [...messages, userMsg].slice(-MAX_HISTORY);
        const reply = await askAssistant(recentHistory);
        setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      } catch (err) {
        if (err?.code === "MISSING_API_KEY") {
          setError(t("chatbox.errors.missing_api_key"));
        } else if (err?.code === "RATE_LIMIT") {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: t("chatbox.fallback.rate_limit_reply", DEFAULT_CENTER_INFO),
            },
          ]);
        } else if (err?.code === "TIMEOUT") {
          setError(t("chatbox.errors.timeout"));
        } else {
          setError(t("chatbox.errors.generic"));
        }

        if (err?.code !== "RATE_LIMIT") {
          setMessages((prev) => prev.slice(0, -1));
          setInput(text);
        }
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, t]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (text) => {
    sendMessage(text.trim());
  };

  const handleReset = () => {
    setMessages([
      {
        role: "bot",
        text: chatCfg.welcomeMessage || DEFAULT_CHAT_CONFIG.welcomeMessage,
      },
    ]);
    setShowSuggestions(true);
    setError(null);
    setInput("");
  };

  const accentColor = chatCfg.accentColor || DEFAULT_CHAT_CONFIG.accentColor;
  const bubbleColor = chatCfg.bubbleColor || DEFAULT_CHAT_CONFIG.bubbleColor;
  const accentHex = chatCfg.accentHex || DEFAULT_CHAT_CONFIG.accentHex;
  const bubbleStyle = {
    backgroundColor: withAlpha(accentHex, "12"),
    borderColor: withAlpha(accentHex, "24"),
    color: accentHex,
  };
  const suggestionStyle = {
    backgroundColor: withAlpha(accentHex, "12"),
    borderColor: withAlpha(accentHex, "30"),
    color: accentHex,
  };

  return (
    <>
      <div
        ref={triggerRef}
        className="fixed bottom-24 right-4 z-[80] sm:bottom-24 sm:right-6"
      >
        {hasUnread && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white z-10 pointer-events-none" />
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? t("chatbox.actions.close") : t("chatbox.actions.open")}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 bg-gradient-to-br ${accentColor} hover:scale-110 active:scale-95 overflow-hidden border-[3px] bg-white`}
          style={{
            borderColor: withAlpha(accentHex, "B8"),
            boxShadow: `0 14px 30px ${withAlpha(accentHex, "2E")}`,
          }}
        >
          {open ? (
            <X className="w-6 h-6 text-white" strokeWidth={2.5} />
          ) : configLoading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <img
              src="/logo.jpeg"
              alt="Lucy"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML =
                  '<span class="flex items-center justify-center w-full h-full text-white font-bold text-lg">L</span>';
              }}
            />
          )}
        </button>
      </div>

      <div
        ref={panelRef}
        className={`fixed bottom-36 right-4 z-[80] w-[350px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 origin-bottom-right sm:bottom-36 sm:right-6 ${
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
        style={{
          height: "480px",
          borderColor: withAlpha(accentHex, "38"),
          boxShadow: `0 24px 60px ${withAlpha(accentHex, "22")}`,
        }}
        aria-hidden={!open}
      >
        <div className={`bg-gradient-to-r ${accentColor} px-4 py-3 flex items-center gap-3`}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/30">
            <img
              src="/logo.jpeg"
              alt="Lucy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML =
                  '<span class="text-white font-bold text-sm">L</span>';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              {chatCfg.botName}
            </p>
            <p className="text-white/80 text-xs">{t("chatbox.widget.subtitle")}</p>
          </div>
          <button
            onClick={handleReset}
            title={t("chatbox.actions.reset")}
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/20"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
          {configLoading ? (
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                <div className="h-16 flex-1 rounded-2xl bg-gray-100 animate-pulse" />
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  text={msg.text}
                  isLatest={i === messages.length - 1}
                  config={{ accentColor, bubbleColor, accentHex }}
                />
              ))}

              {loading && (
                <TypingIndicator
                  accentColor={accentColor}
                  accentHex={accentHex}
                  bubbleStyle={bubbleStyle}
                />
              )}

              {error && (
                <div className="text-center">
                  <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 inline-block">
                    {error}
                  </p>
                </div>
              )}

              {showSuggestions && messages.length === 1 && !loading && (
                <div className="pt-1">
                  <p className="text-xs text-gray-400 mb-2 text-center">
                    {t("chatbox.widget.suggestions_label")}
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(s)}
                        className="text-xs rounded-full px-3 py-1.5 transition-colors text-left leading-snug border"
                        style={suggestionStyle}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div
          className="border-t px-3 py-2.5 bg-white"
          style={{ borderColor: withAlpha(accentHex, "24") }}
        >
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("chatbox.widget.input_placeholder")}
              rows={1}
              disabled={loading || configLoading}
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none border transition-all max-h-24 overflow-y-auto disabled:opacity-60"
              style={{
                minHeight: "36px",
                backgroundColor: withAlpha(accentHex, "0F"),
                borderColor: "transparent",
              }}
              onInput={(e) => {
                e.target.style.height = "36px";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || configLoading}
              aria-label={t("chatbox.actions.send")}
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !loading && !configLoading
                  ? `bg-gradient-to-br ${accentColor} text-white hover:scale-105 active:scale-95 shadow-sm`
                  : "bg-gray-100 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SendHorizontal className="w-4 h-4" strokeWidth={2.25} />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-center mt-1.5 leading-tight">
            {t("chatbox.widget.helper")}
          </p>
        </div>
      </div>
    </>
  );
}

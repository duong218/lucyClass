import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  Bot,
  Eye,
  Lightbulb,
  MessageSquareText,
  PaintBucket,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import api from "../../services/api";
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_SUGGESTIONS,
  DEFAULT_CHAT_CONFIG,
} from "../../components/ChatBox/chatConfig";

function withAlpha(hex, alpha) {
  if (!hex || !hex.startsWith("#")) return hex;
  return `${hex}${alpha}`;
}

export default function ChatConfigPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [chatConfig, setChatConfig] = useState(DEFAULT_CHAT_CONFIG);
  const [newSuggestion, setNewSuggestion] = useState("");

  const accentOptions = [
    {
      label: t("chatbox.colors.teal"),
      value: "from-teal-600 to-teal-800",
      hex: "#1C695C",
    },
    {
      label: t("chatbox.colors.emerald"),
      value: "from-emerald-500 to-emerald-700",
      hex: "#059669",
    },
    {
      label: t("chatbox.colors.blue"),
      value: "from-blue-500 to-blue-700",
      hex: "#2563EB",
    },
    {
      label: t("chatbox.colors.violet"),
      value: "from-violet-500 to-violet-700",
      hex: "#7C3AED",
    },
    {
      label: t("chatbox.colors.rose"),
      value: "from-rose-500 to-rose-700",
      hex: "#E11D48",
    },
    {
      label: t("chatbox.colors.amber"),
      value: "from-amber-500 to-amber-700",
      hex: "#D97706",
    },
  ];

  const bubbleOptions = [
    {
      label: t("chatbox.bubbles.teal"),
      value: "bg-teal-50 text-teal-900",
      previewBg: "#F0FDFA",
      previewText: "#134E4A",
    },
    {
      label: t("chatbox.bubbles.blue"),
      value: "bg-blue-50 text-blue-900",
      previewBg: "#EFF6FF",
      previewText: "#1E3A8A",
    },
    {
      label: t("chatbox.bubbles.emerald"),
      value: "bg-emerald-50 text-emerald-900",
      previewBg: "#ECFDF5",
      previewText: "#064E3B",
    },
    {
      label: t("chatbox.bubbles.violet"),
      value: "bg-violet-50 text-violet-900",
      previewBg: "#F5F3FF",
      previewText: "#4C1D95",
    },
    {
      label: t("chatbox.bubbles.rose"),
      value: "bg-rose-50 text-rose-900",
      previewBg: "#FFF1F2",
      previewText: "#881337",
    },
    {
      label: t("chatbox.bubbles.amber"),
      value: "bg-amber-50 text-amber-900",
      previewBg: "#FFFBEB",
      previewText: "#78350F",
    },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/chat-config/admin");
        const data = res.data;
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.suggestions?.length) setSuggestions(data.suggestions);
        if (data.chatConfig) {
          setChatConfig((prev) => ({ ...prev, ...data.chatConfig }));
        }
      } catch {
        toast.error(t("chatbox.config.toasts.load_error"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/chat-config", { systemPrompt, suggestions, chatConfig });
      toast.success(t("chatbox.config.toasts.save_success"));
    } catch {
      toast.error(t("chatbox.config.toasts.save_error"));
    } finally {
      setSaving(false);
    }
  };

  const addSuggestion = () => {
    const trimmed = newSuggestion.trim();
    if (!trimmed) return;
    if (suggestions.length >= 10) {
      toast.warning(t("chatbox.config.toasts.max_suggestions"));
      return;
    }
    setSuggestions((prev) => [...prev, trimmed]);
    setNewSuggestion("");
  };

  const removeSuggestion = (index) => {
    setSuggestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setSuggestions(DEFAULT_SUGGESTIONS);
    setChatConfig(DEFAULT_CHAT_CONFIG);
    toast.info(t("chatbox.config.toasts.reset"));
  };

  const handleSuggestionKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSuggestion();
    }
  };

  const selectedBubble =
    bubbleOptions.find((option) => option.value === chatConfig.bubbleColor) ||
    bubbleOptions[0];

  const inputSurface = {
    backgroundColor: withAlpha(chatConfig.accentHex, "10"),
    borderColor: withAlpha(chatConfig.accentHex, "24"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-500">
          <Bot className="w-5 h-5" />
          <span>{t("chatbox.config.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Bot className="w-6 h-6 text-teal-600" />
            {t("chatbox.config.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("chatbox.config.subtitle")}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t("chatbox.actions.reset_default")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t("chatbox.actions.saving") : t("chatbox.actions.save")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-800">
              <Bot className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold">{t("chatbox.config.bot_section")}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t("chatbox.config.bot_name")}
                </label>
                <input
                  type="text"
                  value={chatConfig.botName}
                  onChange={(e) =>
                    setChatConfig((prev) => ({ ...prev, botName: e.target.value }))
                  }
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  style={inputSurface}
                  placeholder="Lucy AI"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("chatbox.config.welcome_message")}
              </label>
              <textarea
                value={chatConfig.welcomeMessage}
                onChange={(e) =>
                  setChatConfig((prev) => ({ ...prev, welcomeMessage: e.target.value }))
                }
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 resize-none"
                style={inputSurface}
                placeholder={t("chatbox.config.welcome_placeholder")}
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-800">
              <Palette className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold">{t("chatbox.config.accent_section")}</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {accentOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setChatConfig((prev) => ({
                      ...prev,
                      accentColor: option.value,
                      accentHex: option.hex,
                    }))
                  }
                  className={`px-3 py-2 rounded-xl border text-sm inline-flex items-center gap-2 transition-all ${
                    chatConfig.accentColor === option.value
                      ? "border-gray-800 shadow-sm"
                      : "border-gray-200"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: option.hex }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 text-gray-800">
              <PaintBucket className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold">{t("chatbox.config.bubble_section")}</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bubbleOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setChatConfig((prev) => ({ ...prev, bubbleColor: option.value }))
                  }
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    chatConfig.bubbleColor === option.value
                      ? "border-gray-800 shadow-sm"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-2">{option.label}</div>
                  <div
                    className="rounded-2xl rounded-tl-sm px-3 py-2 text-sm inline-block max-w-full"
                    style={{
                      backgroundColor: option.previewBg,
                      color: option.previewText,
                    }}
                  >
                    {t("chatbox.config.preview_sample")}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-800">
                <Lightbulb className="w-4 h-4 text-teal-600" />
                <h2 className="font-semibold">{t("chatbox.config.suggestions_section")}</h2>
              </div>
              <span className="text-xs text-gray-400">{suggestions.length}/10</span>
            </div>

            <p className="text-xs text-gray-400">{t("chatbox.config.suggestions_hint")}</p>

            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 border"
                  style={inputSurface}
                >
                  <span className="flex-1 text-sm text-gray-700">{suggestion}</span>
                  <button
                    onClick={() => removeSuggestion(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={t("chatbox.actions.remove_suggestion")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {suggestions.length < 10 ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSuggestion}
                  onChange={(e) => setNewSuggestion(e.target.value)}
                  onKeyDown={handleSuggestionKeyDown}
                  placeholder={t("chatbox.config.new_suggestion_placeholder")}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  style={inputSurface}
                />
                <button
                  onClick={addSuggestion}
                  className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("chatbox.actions.add")}
                </button>
              </div>
            ) : (
              <p className="text-xs text-amber-500">{t("chatbox.config.max_reached")}</p>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-gray-800">
                <MessageSquareText className="w-4 h-4 text-teal-600" />
                <h2 className="font-semibold">{t("chatbox.config.prompt_section")}</h2>
              </div>
              <span className="text-xs text-gray-400">
                {systemPrompt.length} {t("chatbox.config.characters")}
              </span>
            </div>

            <p className="text-xs text-gray-400">{t("chatbox.config.prompt_hint")}</p>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={16}
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-300 resize-y"
              style={inputSurface}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 sticky top-24">
            <div className="flex items-center gap-2 text-gray-800">
              <Eye className="w-4 h-4 text-teal-600" />
              <h2 className="font-semibold">{t("chatbox.config.preview_section")}</h2>
            </div>

            <div className="flex justify-center">
              <div
                className="w-72 rounded-2xl shadow-lg border overflow-hidden bg-white"
                style={{
                  height: "340px",
                  borderColor: withAlpha(chatConfig.accentHex, "24"),
                }}
              >
                <div
                  className={`bg-gradient-to-r ${chatConfig.accentColor} px-4 py-3 flex items-center gap-3`}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 overflow-hidden">
                    <img
                      src="/logo.jpeg"
                      alt="Lucy"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentNode.innerHTML =
                          '<span class="text-white font-bold text-xs">L</span>';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {chatConfig.botName || "Lucy AI"}
                    </p>
                    <p className="text-white/75 text-xs">{t("chatbox.widget.subtitle")}</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 h-[244px] overflow-hidden">
                  <div className="h-full overflow-hidden rounded-xl">
                    <div className="flex gap-2 items-start h-full">
                      <div
                        className={`w-6 h-6 rounded-full bg-gradient-to-br ${chatConfig.accentColor} flex-shrink-0 overflow-hidden`}
                      >
                        <img
                          src="/logo.jpeg"
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%] whitespace-pre-wrap break-words overflow-hidden"
                        style={{
                          backgroundColor: selectedBubble.previewBg,
                          color: selectedBubble.previewText,
                        }}
                      >
                        {chatConfig.welcomeMessage || t("chatbox.config.preview_sample")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

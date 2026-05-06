import { CHAT_CONFIG } from "./chatConfig";

function renderInlineMarkdown(text, keyPrefix) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={`${keyPrefix}-code-${index}`}
          className="px-1 py-0.5 rounded bg-black/10 text-[0.95em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-strong-${index}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${keyPrefix}-em-${index}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }

    return part;
  });
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  const nodes = [];
  let listItems = [];
  let listType = null;

  const flushList = () => {
    if (!listItems.length) return;

    if (listType === "ol") {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="list-decimal pl-5 space-y-1">
          {listItems.map((item, index) => (
            <li key={`ol-item-${index}`}>{renderInlineMarkdown(item, `ol-${index}`)}</li>
          ))}
        </ol>
      );
    } else {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="list-disc pl-5 space-y-1">
          {listItems.map((item, index) => (
            <li key={`ul-item-${index}`}>{renderInlineMarkdown(item, `ul-${index}`)}</li>
          ))}
        </ul>
      );
    }

    listItems = [];
    listType = null;
  };

  lines.forEach((line, index) => {
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const orderedMatch = line.match(/^\s*\d+\.\s+(.+)$/);

    if (bulletMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(bulletMatch[1]);
      return;
    }

    if (orderedMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(orderedMatch[1]);
      return;
    }

    flushList();

    if (!line.trim()) {
      nodes.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    nodes.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {renderInlineMarkdown(line, `p-${index}`)}
      </p>
    );
  });

  flushList();
  return nodes;
}

export default function ChatMessage({ role, text, isLatest, config }) {
  const isBot = role === "bot";
  const bubbleColor = config?.bubbleColor || CHAT_CONFIG.bubbleColor;
  const accentColor = config?.accentColor || CHAT_CONFIG.accentColor;

  return (
    <div
      className={`flex gap-2 ${isBot ? "justify-start" : "justify-end"} ${
        isLatest ? "animate-fade-in" : ""
      }`}
    >
      {isBot && (
        <div
          className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${accentColor} flex items-center justify-center text-white shadow-sm overflow-hidden`}
        >
          <img
            src="/logo.jpeg"
            alt="Lucy"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML =
                '<span class="text-xs font-bold text-white">L</span>';
            }}
          />
        </div>
      )}

      <div
        className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
          isBot
            ? `${bubbleColor} rounded-tl-sm`
            : `bg-gradient-to-br ${accentColor} text-white rounded-tr-sm`
        }`}
      >
        <div className="space-y-1">{renderMarkdown(text)}</div>
      </div>
    </div>
  );
}

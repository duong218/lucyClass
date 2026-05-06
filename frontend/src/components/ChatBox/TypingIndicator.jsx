export default function TypingIndicator({
  accentColor = "from-teal-600 to-teal-800",
  accentHex = "#1C695C",
  bubbleStyle,
}) {
  return (
    <div className="flex gap-2 justify-start">
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

      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center border"
        style={bubbleStyle}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0ms]"
          style={{ backgroundColor: accentHex }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:150ms]"
          style={{ backgroundColor: accentHex }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:300ms]"
          style={{ backgroundColor: accentHex }}
        />
      </div>
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm" style={{ color: "#DAC0A3" }}>
            Hi! I am Socratix. What math problem are you working on today?
          </p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              backgroundColor: message.role === "user" ? "#DAC0A3" : "#102C57",
              color: message.role === "user" ? "#102C57" : "#FEFAF6",
            }}
          >
            {message.role === "user" ? "U" : "S"}
          </div>
          <div
            className="px-4 py-3 rounded-2xl max-w-sm text-sm"
            style={{
              backgroundColor: message.role === "user" ? "#102C57" : "#EADBC8",
              color: message.role === "user" ? "#FEFAF6" : "#102C57",
              borderRadius: message.role === "user" ? "1rem 1rem 0 1rem" : "1rem 1rem 1rem 0",
              boxShadow: "0 4px 12px rgba(16, 44, 87, 0.10)",
            }}
          >
            {message.content || (isLoading && message.role === "assistant" ? "..." : "")}
          </div>
        </div>
      ))}
    </div>
  );
}

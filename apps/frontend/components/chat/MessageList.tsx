export default function MessageList() {
  const aiMessages = [
    "Hi! I'm Socratix. What math problem are you working on today?",
    "Let's think about this together. What does it mean when we say a number is 'prime'?",
    "Exactly! A prime number has exactly two factors: 1 and itself. Now, can you list the factors of 12?",
    "Good! The factors are 1, 2, 3, 4, 6, and 12. Which of these would you consider the most important when determining if 12 is prime or composite?",
    "Right! Since 12 has factors other than 1 and itself (like 2, 3, 4, and 6), it's a composite number. Now, can you think about how we might find all the prime factors of a number?",
  ];

  const userMessages = [
    "I think the answer is 9",
    "A prime number is a number that can only be divided by 1 and itself?",
    "The factors of 12 are 1, 2, 3, 4, 6, and 12.",
    "I would say 2 and 3 are the most important factors because they show that 12 can be divided evenly by numbers other than 1 and itself.",
    "Maybe by breaking it down into smaller factors?",
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
        >
          S
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#EADBC8",
            color: "#102C57",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)",
          }}
        >
          {aiMessages[0]}
        </div>
      </div>

      {/* User Message */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#DAC0A3", color: "#102C57" }}
        >
          U
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
          }}
        >
          {userMessages[0]}
        </div>
      </div>

      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
        >
          S
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#EADBC8",
            color: "#102C57",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)",
          }}
        >
          {aiMessages[1]}
        </div>
      </div>

      {/* User Message */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#DAC0A3", color: "#102C57" }}
        >
          U
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
          }}
        >
          {userMessages[1]}
        </div>
      </div>

      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
        >
          S
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#EADBC8",
            color: "#102C57",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)",
          }}
        >
          {aiMessages[2]}
        </div>
      </div>

      {/* User Message */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#DAC0A3", color: "#102C57" }}
        >
          U
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
          }}
        >
          {userMessages[2]}
        </div>
      </div>

      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
        >
          S
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#EADBC8",
            color: "#102C57",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)",
          }}
        >
          {aiMessages[3]}
        </div>
      </div>

      {/* User Message */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#DAC0A3", color: "#102C57" }}
        >
          U
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
          }}
        >
          {userMessages[3]}
        </div>
      </div>

      {/* AI Message */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#102C57", color: "#FEFAF6" }}
        >
          S
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#EADBC8",
            color: "#102C57",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.08), 0 1px 3px rgba(16, 44, 87, 0.12)",
          }}
        >
          {aiMessages[4]}
        </div>
      </div>

      {/* User Message */}
      <div className="flex items-start gap-3 flex-row-reverse">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#DAC0A3", color: "#102C57" }}
        >
          U
        </div>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] sm:max-w-sm text-sm body-text"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
            boxShadow: "0 4px 12px rgba(16, 44, 87, 0.15), 0 1px 3px rgba(16, 44, 87, 0.2)",
          }}
        >
          {userMessages[4]}
        </div>
      </div>
    </div>
  );
}
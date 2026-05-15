 
"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FEFAF6" }}
    >
      <div
        className="rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm"
        style={{
          backgroundColor: "#FEFAF6",
          boxShadow: "0 4px 24px rgba(16, 44, 87, 0.10)",
        }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: "#102C57" }}>
            Socratix
          </h1>
          <p className="text-sm mt-2" style={{ color: "#DAC0A3" }}>
            Your Socratic Math Tutor
          </p>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/chat" })}
          className="w-full py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-3"
          style={{
            backgroundColor: "#102C57",
            color: "#FEFAF6",
          }}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
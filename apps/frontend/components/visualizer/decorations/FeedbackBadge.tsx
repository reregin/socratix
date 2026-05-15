"use client";

import { motion } from "framer-motion";

export function SuccessBadge({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
      style={{
        background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)",
        borderColor: "rgba(74, 222, 128, 0.3)",
        boxShadow: "0 4px 16px rgba(74, 222, 128, 0.15)",
      }}
    >
      <motion.span
        className="text-2xl"
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5 }}
      >
        🎉
      </motion.span>
      <p className="text-sm font-bold" style={{ color: "#059669" }}>
        {message}
      </p>
    </motion.div>
  );
}

export function ErrorBadge({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
      style={{
        background: "linear-gradient(135deg, #FFF8EB, #FEF3C7)",
        borderColor: "rgba(255, 185, 70, 0.3)",
        boxShadow: "0 4px 16px rgba(255, 185, 70, 0.1)",
      }}
    >
      <motion.span
        className="text-2xl"
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.4 }}
      >
        🤔
      </motion.span>
      <p className="text-sm font-bold" style={{ color: "#B45309" }}>
        {message}
      </p>
    </motion.div>
  );
}

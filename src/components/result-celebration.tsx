"use client";

import { motion, useReducedMotion } from "framer-motion";

export const ResultCelebration = () => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="mb-4 text-5xl">🎉</div>;
  }

  return (
    <motion.div
      className="mb-4 text-5xl"
      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
      animate={{ opacity: 1, scale: [0.5, 1.18, 1], rotate: [0, 8, -6, 0] }}
      transition={{ duration: 0.65, times: [0, 0.55, 1] }}
    >
      🎉
    </motion.div>
  );
};

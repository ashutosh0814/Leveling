import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { FiClock } from "react-icons/fi";

const MiniTimer = ({ timeLeft, mode, onClick, onClose }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const timerRef = useRef(null);

  const bind = useDrag(({ offset: [x, y] }) => {
    setPosition({ x, y });
  });

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      ref={timerRef}
      {...bind()}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: "fixed",
        x: position.x,
        y: position.y,
        zIndex: 9999,
        touchAction: "none",
      }}
      className="flex items-center space-x-2 bg-purple-700/90 backdrop-blur-sm text-white rounded-full px-3 py-2 shadow-lg cursor-move select-none"
      onClick={onClick}
    >
      <FiClock className="h-4 w-4" />
      <span className="text-sm font-mono">{formatTime(timeLeft)}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="ml-2 text-white/70 hover:text-white"
      >
        ×
      </button>
    </motion.div>
  );
};

export default MiniTimer;
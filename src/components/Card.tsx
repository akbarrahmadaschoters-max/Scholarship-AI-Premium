import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  return (
    <motion.div
      whileHover={hoverEffect ? { y: -4, boxShadow: "0 20px 60px -15px rgba(99, 102, 241, 0.15)" } : {}}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`bg-white rounded-[24px] border border-white/50 shadow-soft overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
};

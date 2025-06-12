"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  gradient?: boolean;
  size?: "sm" | "md" | "lg";
}

const PageHeader = ({
  title,
  subtitle,
  icon,
  gradient = false,
  size = "md",
}: PageHeaderProps) => {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0 },
    visible: {
      scaleX: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative mb-8"
    >
      {/* Background gradient overlay */}
      {gradient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg -z-10"
        />
      )}

      <div className="flex items-center gap-4 py-4">
        {/* Icon with animation */}
        {icon && (
          <motion.div variants={itemVariants} className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              {icon}
            </div>
          </motion.div>
        )}

        {/* Title and subtitle container */}
        <div className="flex-1 min-w-0">
          <motion.h1
            variants={itemVariants}
            className={`${sizeClasses[size]} font-bold text-gray-900 mb-1 text-right`}
            style={{
              background: gradient
                ? "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)"
                : undefined,
              WebkitBackgroundClip: gradient ? "text" : undefined,
              WebkitTextFillColor: gradient ? "transparent" : undefined,
              backgroundClip: gradient ? "text" : undefined,
            }}
          >
            {title}
          </motion.h1>

          {subtitle && (
            <motion.p
              variants={itemVariants}
              className="text-gray-600 text-sm font-medium text-right"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>

      {/* Animated underline */}
      <motion.div
        variants={lineVariants}
        className="h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full origin-right"
        style={{ transformOrigin: "right center" }}
      />

      {/* Subtle shadow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-sm"
      />
    </motion.div>
  );
};

export default PageHeader;

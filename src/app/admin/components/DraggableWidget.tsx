"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { X, GripVertical } from "lucide-react";
// Dashboard Widget type definition (copied from useDashboardLayout)
export interface WidgetPosition {
  row: number;
  col: number;
  width: number;
  height: number;
}

export interface DashboardWidget {
  id: string;
  widgetType: string;
  position: WidgetPosition;
  config: Record<string, unknown>;
}

interface DraggableWidgetProps {
  widget: DashboardWidget;
  isCustomizing: boolean;
  onRemove: (widgetId: string) => void;
  children: React.ReactNode;
}

export function DraggableWidget({
  widget,
  isCustomizing,
  onRemove,
  children,
}: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    data: {
      type: "widget",
      widget,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${widget.position.width}`,
    gridRow: `span ${widget.position.height}`,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`
        relative group
        ${isDragging ? "z-50 opacity-50" : ""}
        ${isCustomizing ? "cursor-move" : ""}
      `}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Drag Handle and Remove Button - Only visible in customize mode */}
      {isCustomizing && (
        <div className="absolute -top-2 -right-2 z-10 flex gap-1">
          <motion.button
            {...attributes}
            {...listeners}
            className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <GripVertical className="h-3 w-3" />
          </motion.button>
          <motion.button
            onClick={() => onRemove(widget.id)}
            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-3 w-3" />
          </motion.button>
        </div>
      )}

      {/* Widget Content */}
      <div
        className={`
        h-full
        ${
          isCustomizing ? "ring-2 ring-blue-300 ring-opacity-50 rounded-lg" : ""
        }
        ${isDragging ? "shadow-2xl" : ""}
      `}
      >
        {children}
      </div>
    </motion.div>
  );
}

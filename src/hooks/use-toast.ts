import { useState, useCallback } from "react";

interface Toast {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = "default" }: Toast) => {
    // For now, just use alert - in a real app you'd implement proper toast notifications
    if (variant === "destructive") {
      alert(`خطا: ${title}\n${description || ""}`);
    } else {
      alert(`${title}\n${description || ""}`);
    }
    
    // Add to toasts array for potential future use
    setToasts(prev => [...prev, { title, description, variant }]);
    
    // Remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1));
    }, 5000);
  }, []);

  return { toast, toasts };
} 
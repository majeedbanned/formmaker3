"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

interface Announcement {
  id: string;
  version: number;
  title: string;
  body: string;
  imageUrl?: string;
  roles: string[];
  active: boolean;
  createdAt: string;
}

interface AnnouncementModalProps {
  announcements: Announcement[];
  onClose: () => void;
  onDismiss: (announcementIds: string[]) => void;
}

export default function AnnouncementModal({
  announcements,
  onClose,
  onDismiss,
}: AnnouncementModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const currentAnnouncement = announcements[currentIndex];
  const hasMultiple = announcements.length > 1;
  const isLastAnnouncement = currentIndex === announcements.length - 1;

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDontShowAgain(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setDontShowAgain(false);
    }
  };

  const handleClose = async () => {
    if (dontShowAgain) {
      // Dismiss current announcement
      await onDismiss([currentAnnouncement.id]);
    }
    
    if (isLastAnnouncement) {
      setIsOpen(false);
      onClose();
    } else {
      handleNext();
    }
  };

  const handleDismissAll = async () => {
    const allIds = announcements.map((ann) => ann.id);
    await onDismiss(allIds);
    setIsOpen(false);
    onClose();
  };

  if (!currentAnnouncement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsOpen(false);
        onClose();
      }
    }}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header with progress indicator */}
        {hasMultiple && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-white shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                اطلاعیه {currentIndex + 1} از {announcements.length}
              </span>
              <div className="flex gap-1">
                {announcements.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-8 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-white"
                        : index < currentIndex
                        ? "bg-white/70"
                        : "bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Section - This will grow and scroll */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Image Section */}
          {currentAnnouncement.imageUrl && (
            <div className="relative w-full h-64 bg-gradient-to-br from-blue-50 to-purple-50">
              <Image
                src={currentAnnouncement.imageUrl}
                alt={currentAnnouncement.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 pb-4">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl font-bold text-right text-gray-800">
                {currentAnnouncement.title}
              </DialogTitle>
            </DialogHeader>

            <div
              className="prose prose-sm max-w-none text-right mb-6"
              style={{
                direction: "rtl",
                fontFamily: "Vazirmatn, sans-serif",
              }}
              dangerouslySetInnerHTML={{ __html: currentAnnouncement.body }}
            />

            {/* Don't show again checkbox */}
            <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              />
              <label
                htmlFor="dont-show-again"
                className="text-sm text-gray-700 cursor-pointer select-none"
              >
                دیگر این اطلاعیه را نشان نده
              </label>
            </div>
          </div>
        </div>

        {/* Fixed Footer at Bottom - This stays at bottom */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Left side: Navigation buttons for multiple announcements */}
            {hasMultiple ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="gap-1"
                >
                  <ChevronRight className="h-4 w-4" />
                  قبلی
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleNext}
                  disabled={isLastAnnouncement}
                  className="gap-1"
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div></div>
            )}

            {/* Right side: Action buttons */}
            <div className="flex gap-2">
              {hasMultiple && (
                <Button
                  variant="ghost"
                  size="default"
                  onClick={handleDismissAll}
                  className="text-gray-600 hover:text-gray-800"
                >
                  بستن همه
                </Button>
              )}
              <Button
                onClick={handleClose}
                size="default"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white min-w-[120px]"
              >
                {isLastAnnouncement ? "بستن" : "بعدی"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { DeleteModalProps } from "../types/crud";

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  itemCount = 1,
  layout = {
    direction: "ltr",
    texts: {
      deleteModalTitle: "Delete Confirmation",
      deleteConfirmationMessage:
        "Are you sure you want to delete this item? This action cannot be undone.",
      deleteConfirmationMessagePlural:
        "Are you sure you want to delete these items? This action cannot be undone.",
      cancelButton: "Cancel",
      deleteButton: "Delete",
      processingMessage: "Processing...",
    },
  },
}: DeleteModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={layout.direction}>
        <DialogHeader>
          <DialogTitle
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {layout.texts?.deleteModalTitle}
          </DialogTitle>
          <DialogDescription
            className={layout.direction === "rtl" ? "text-right" : "text-left"}
          >
            {itemCount > 1
              ? layout.texts?.deleteConfirmationMessagePlural
              : layout.texts?.deleteConfirmationMessage}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter
          className={
            layout.direction === "rtl" ? "sm:justify-start" : "sm:justify-end"
          }
        >
          <div
            className={`flex gap-2 ${
              layout.direction === "rtl" ? "flex-row-reverse" : ""
            }`}
          >
            <Button variant="outline" onClick={onClose}>
              {layout.texts?.cancelButton}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading
                ? layout.texts?.processingMessage
                : layout.texts?.deleteButton}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

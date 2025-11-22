"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Participant {
  _id: string;
  examId: string;
  userId: string;
  schoolCode: string;
  entryTime: string;
  persianEntryDate?: string;
  isFinished: boolean;
  sumScore?: number;
  maxScore?: number;
  correctAnswerCount?: number;
  wrongAnswerCount?: number;
  unansweredCount?: number;
  gradingStatus?: string;
  userName?: string;
}

interface ExamInfo {
  _id: string;
  data: {
    examName: string;
    examCode: string;
    settings?: {
      showScoreAfterExam?: boolean;
      showanswersafterexam?: boolean;
    };
  };
}

interface ExamParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
}

export function ExamParticipantsModal({
  isOpen,
  onClose,
  examId,
}: ExamParticipantsModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && examId) {
      fetchExamInfo();
      fetchParticipants();
    }
  }, [isOpen, examId]);

  const fetchExamInfo = async () => {
    try {
      const response = await fetch(`/api/exams/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam information");
      }
      const data = await response.json();
      setExamInfo(data);
    } catch (error) {
      setError("Error fetching exam information");
      console.error(error);
    }
  };

  const fetchParticipants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/examparticipants/${examId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exam participants");
      }
      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      setError("Error fetching participants");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredParticipants = participants.filter((participant) => {
    return (
      participant.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.gradingStatus
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  const handleViewAnswersheet = (participantId: string) => {
    router.push(`/admin/exam/participants/answersheet/${participantId}`);
    onClose();
  };

  const handleViewResults = (participantId: string) => {
    router.push(`/admin/exam/participants/results/${participantId}`);
    onClose();
  };

  const handleGradeAnswers = (participantId: string) => {
    router.push(`/admin/exam/participants/grade/${participantId}`);
    onClose();
  };

  const handleViewStatistics = () => {
    router.push(`/admin/exam/statistics/${examId}`);
    onClose();
  };

  const handleDownloadAnswers = async (participantId: string) => {
    try {
      // Implement download functionality
      // console.log(`Downloading answers for participant ${participantId}`);
    } catch (error) {
      console.error("Error downloading answers", error);
    }
  };

  const handleDeleteClick = (participant: Participant) => {
    setDeletingParticipant(participant);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingParticipant) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/examparticipant/${deletingParticipant._id}`, {
        method: "DELETE",
        headers: {
          "x-domain": window.location.host,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete participant");
      }

      toast.success("شرکت‌کننده با موفقیت حذف شد");
      setDeletingParticipant(null);
      // Refresh participants list
      await fetchParticipants();
    } catch (error) {
      console.error("Error deleting participant:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "خطا در حذف شرکت‌کننده"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">
              خطا
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 text-center">
            <p>{error}</p>
            <Button onClick={onClose} className="mt-4">
              بستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            شرکت‌کنندگان در آزمون
          </DialogTitle>
          {examInfo && (
            <DialogDescription>
              {examInfo.data.examName} (کد: {examInfo.data.examCode})
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-500">
                تعداد شرکت‌کنندگان: {participants.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewStatistics}
                  className="flex items-center"
                >
                  <ChartBarIcon className="h-4 w-4 ml-1" />
                  گزارش آماری
                </Button>
                <Input
                  placeholder="جستجوی شرکت‌کنندگان..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                هیچ شرکت‌کننده‌ای یافت نشد.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام کاربر</TableHead>
                      <TableHead className="text-right">زمان شرکت</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">نمره</TableHead>
                      <TableHead className="text-right">وضعیت تصحیح</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.map((participant) => (
                      <TableRow key={participant._id}>
                        <TableCell className="font-medium">
                          {participant.userName || participant.userId}
                        </TableCell>
                        <TableCell>
                          {participant.persianEntryDate || "نامشخص"}
                        </TableCell>
                        <TableCell>
                          {participant.isFinished ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                              تکمیل شده
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              ناتمام
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {participant.sumScore !== undefined
                            ? `${participant.sumScore} از ${
                                participant.maxScore || 0
                              }`
                            : "نامشخص"}
                        </TableCell>
                        <TableCell>
                          {participant.gradingStatus === "autoGraded" ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              تصحیح خودکار
                            </Badge>
                          ) : participant.gradingStatus === "manualGraded" ? (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              تصحیح دستی
                            </Badge>
                          ) : participant.gradingStatus === "partialGraded" ? (
                            <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                              نیاز به تصحیح
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                              بدون تصحیح
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleViewAnswersheet(participant._id)
                              }
                              title="مشاهده پاسخنامه"
                            >
                              <DocumentTextIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResults(participant._id)}
                              title="مشاهده نتایج"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleGradeAnswers(participant._id)
                              }
                              title="تصحیح پاسخ‌ها"
                              className="text-blue-600 border-blue-300 hover:bg-blue-50"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadAnswers(participant._id)
                              }
                              title="دانلود پاسخ‌ها"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(participant)}
                              title="حذف شرکت‌کننده"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingParticipant !== null}
        onOpenChange={(open) => !open && setDeletingParticipant(null)}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <TrashIcon className="h-5 w-5 ml-2" />
              تایید حذف شرکت‌کننده
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              <div className="space-y-3 mt-4">
                <p className="text-gray-700">
                  آیا از حذف این شرکت‌کننده اطمینان دارید؟ این عملیات قابل بازگشت نیست.
                </p>
                {deletingParticipant && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>نام کاربر:</strong>{" "}
                      {deletingParticipant.userName || deletingParticipant.userId}
                    </p>
                    {deletingParticipant.persianEntryDate && (
                      <p className="text-sm text-red-800">
                        <strong>زمان شرکت:</strong> {deletingParticipant.persianEntryDate}
                      </p>
                    )}
                    {deletingParticipant.sumScore !== undefined && (
                      <p className="text-sm text-red-800">
                        <strong>نمره:</strong> {deletingParticipant.sumScore} از{" "}
                        {deletingParticipant.maxScore || 0}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "در حال حذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}

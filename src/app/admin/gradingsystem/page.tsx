"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Users,
  FileText,
  Save,
  HelpCircle,
  Info,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ClassSelectionStep } from "./components/ClassSelectionStep";
import { SubjectSelectionStep } from "./components/SubjectSelectionStep";
import { GradeTitleStep } from "./components/GradeTitleStep";
import { StudentsGradingStep } from "./components/StudentsGradingStep";
import { ReviewSaveStep } from "./components/ReviewSaveStep";
import { GradeListsView } from "./components/GradeListsView";
import HelpPanel from "@/components/ui/HelpPanel";
import { gradingSystemHelpSections } from "./GradingSystemHelpContent";
import PageHeader from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GradingData {
  selectedClass: any | null;
  selectedSubject: any | null;
  gradeTitle: string;
  gradeDate: string;
  gradingType: "numerical" | "descriptive";
  studentGrades: {
    [studentCode: string]: {
      score?: number;
      descriptiveText?: string;
      studentName: string;
    };
  };
  isEditing: boolean;
  editingGradeListId?: string;
}

const STEPS = [
  {
    id: 1,
    title: "انتخاب کلاس",
    icon: Users,
    description: "کلاس مورد نظر را انتخاب کنید",
  },
  {
    id: 2,
    title: "انتخاب درس",
    icon: GraduationCap,
    description: "درس مورد نظر را انتخاب کنید",
  },
  {
    id: 3,
    title: "عنوان نمره",
    icon: FileText,
    description: "عنوان برای این ثبت نمره وارد کنید",
  },
  {
    id: 4,
    title: "ثبت نمرات",
    icon: FileText,
    description: "نمرات دانش‌آموزان را وارد کنید",
  },
  {
    id: 5,
    title: "بررسی و ذخیره",
    icon: Save,
    description: "نمرات را بررسی و ذخیره کنید",
  },
];

export default function GradingSystemPage() {
  const { user ,isLoading} = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [gradingData, setGradingData] = useState<GradingData>({
    selectedClass: null,
    selectedSubject: null,
    gradeTitle: "",
    gradeDate: "",
    gradingType: "numerical",
    studentGrades: {},
    isEditing: false,
  });
  const [showWizard, setShowWizard] = useState(false);
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);

  // Check if teacher has adminAccess
  useEffect(() => {
    const checkTeacherAdminAccess = async () => {
      if (isLoading) return;
      if (!user || user.userType !== "teacher" || !user.username) {
        setIsAdminTeacher(false);
        return;
      }

      try {
        const response = await fetch(`/api/teachers?schoolCode=${user.schoolCode}`);
        if (!response.ok) {
          console.error("Failed to fetch teacher data");
          setIsAdminTeacher(false);
          return;
        }

        const teachers = await response.json();
        const currentTeacher = teachers.find(
          (t: any) => t.data?.teacherCode === user.username
        );

        if (currentTeacher?.data?.adminAccess === true) {
          setIsAdminTeacher(true);
        } else {
          setIsAdminTeacher(false);
        }
      } catch (err) {
        console.error("Error checking teacher admin access:", err);
        setIsAdminTeacher(false);
      }
    };

    checkTeacherAdminAccess();
  }, [user, isLoading]);

  // Keyboard shortcut for help panel (F1)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F1") {
        event.preventDefault();
        setHelpPanelOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setGradingData({
      selectedClass: null,
      selectedSubject: null,
      gradeTitle: "",
      gradeDate: "",
      gradingType: "numerical",
      studentGrades: {},
      isEditing: false,
    });
    setShowWizard(false);
  };

  const startNewGrading = () => {
    resetWizard();
    setShowWizard(true);
  };

  const startEditGrading = (gradeListData: any) => {
    setGradingData({
      selectedClass: gradeListData.classData,
      selectedSubject: gradeListData.subjectData,
      gradeTitle: gradeListData.title,
      gradeDate: gradeListData.date || "",
      gradingType: gradeListData.gradingType || "numerical",
      studentGrades: gradeListData.grades,
      isEditing: true,
      editingGradeListId: gradeListData._id,
    });
    setCurrentStep(4); // Go directly to grades entry step
    setShowWizard(true);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return gradingData.selectedClass !== null;
      case 2:
        return gradingData.selectedSubject !== null;
      case 3:
        return (
          gradingData.gradeTitle.trim() !== "" && gradingData.gradeDate !== ""
        );
      case 4:
        const grades = Object.values(gradingData.studentGrades);
        if (gradingData.gradingType === "numerical") {
          return grades.some((grade) => grade.score !== undefined);
        } else {
          return grades.some(
            (grade) =>
              grade.descriptiveText && grade.descriptiveText.trim() !== ""
          );
        }
      default:
        return true;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            در حال بارگذاری...
          </p>
        </CardContent>
      </Card>
    );
  }

  if(user?.userType === "student"){
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">شما دسترسی به این صفحه را ندارید</div>
        </div>
      </div>
    );
  }
  // Only teachers and school admins can access grading system
  if (user.userType !== "teacher" && user.userType !== "school") {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            شما دسترسی به سیستم نمره‌دهی ندارید.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!showWizard) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <PageHeader
          title="سیستم نمره‌دهی"
          subtitle="مدیریت و ثبت نمرات دانش‌آموزان"
          icon={<FileText className="w-6 h-6" />}
          gradient={true}
        />
        
        {/* Important Notice */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">توجه مهم</AlertTitle>
          <AlertDescription className="text-blue-800">
            <div className="space-y-2">
              <p>
                • نمرات ثبت شده در این بخش <strong>در دفتر کلاسی نمایش داده نمی‌شوند</strong> و مخصوص کارنامه‌های شخصی‌سازی شده هستند.
              </p>
              <p>
                • اگر می‌خواهید نمرات را در <strong>دفتر کلاسی</strong> ثبت کنید، لطفاً به بخش دفتر کلاسی مراجعه کرده و از گزینه <strong>افزودن نمره گروهی</strong> استفاده نمایید.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHelpPanelOpen(true)}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              راهنما
            </Button>
            {(user.userType === "teacher" || user.userType === "school") && (
              <Button onClick={startNewGrading} size="lg" className="gap-2">
                <FileText className="h-5 w-5" />
                ثبت نمره جدید
              </Button>
            )}
          </div>
        </div>

        <GradeListsView
          userType={user.userType}
          userCode={user.userType === "teacher" ? user.username : undefined}
          schoolCode={user.schoolCode}
          onEditGradeList={startEditGrading}
          isAdminTeacher={isAdminTeacher}
        />

        <HelpPanel
          isOpen={helpPanelOpen}
          onClose={() => setHelpPanelOpen(false)}
          sections={gradingSystemHelpSections}
          title="راهنمای سیستم نمره‌دهی"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                {gradingData.isEditing ? "ویرایش نمرات" : "ثبت نمره جدید"}
              </CardTitle>
              <CardDescription>
                {STEPS[currentStep - 1]?.description}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHelpPanelOpen(true)}
                className="gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                راهنما
              </Button>
              <Button variant="outline" onClick={resetWizard}>
                بازگشت به فهرست
              </Button>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">پیشرفت:</span>
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {currentStep} از {STEPS.length}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {STEPS.map((step) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-100 text-green-800"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && !gradingData.isEditing && (
            <ClassSelectionStep
              selectedClass={gradingData.selectedClass}
              onClassSelect={(classData: any) =>
                setGradingData({ ...gradingData, selectedClass: classData })
              }
              userCode={user.username}
              userType={user.userType}
              schoolCode={user.schoolCode}
              isAdminTeacher={isAdminTeacher}
            />
          )}

          {currentStep === 2 && !gradingData.isEditing && (
            <SubjectSelectionStep
              selectedClass={gradingData.selectedClass}
              selectedSubject={gradingData.selectedSubject}
              onSubjectSelect={(subjectData: any) =>
                setGradingData({ ...gradingData, selectedSubject: subjectData })
              }
              userCode={user.username}
              userType={user.userType}
              schoolCode={user.schoolCode}
              isAdminTeacher={isAdminTeacher}
            />
          )}

          {currentStep === 3 && !gradingData.isEditing && (
            <GradeTitleStep
              gradeTitle={gradingData.gradeTitle}
              gradeDate={gradingData.gradeDate}
              gradingType={gradingData.gradingType}
              onTitleChange={(title: string) =>
                setGradingData({ ...gradingData, gradeTitle: title })
              }
              onDateChange={(date: string) =>
                setGradingData({ ...gradingData, gradeDate: date })
              }
              onGradingTypeChange={(type: "numerical" | "descriptive") =>
                setGradingData({ ...gradingData, gradingType: type })
              }
            />
          )}

          {currentStep === 4 && (
            <StudentsGradingStep
              selectedClass={gradingData.selectedClass}
              gradingType={gradingData.gradingType}
              studentGrades={gradingData.studentGrades}
              onGradesChange={(grades: any) =>
                setGradingData({ ...gradingData, studentGrades: grades })
              }
            />
          )}

          {currentStep === 5 && (
            <ReviewSaveStep
              gradingData={gradingData}
              onSaveSuccess={resetWizard}
              userCode={user.username}
              schoolCode={user.schoolCode}
            />
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={
                currentStep === 1 ||
                (gradingData.isEditing && currentStep === 4)
              }
              className="gap-2"
            >
              <ChevronRight className="h-4 w-4" />
              قبلی
            </Button>

            <Button
              onClick={nextStep}
              disabled={!canProceed() || currentStep === STEPS.length}
              className="gap-2"
            >
              بعدی
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <HelpPanel
        isOpen={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
        sections={gradingSystemHelpSections}
        title="راهنمای سیستم نمره‌دهی"
      />
    </div>
  );
}

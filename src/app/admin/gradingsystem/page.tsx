"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ClassSelectionStep } from "./components/ClassSelectionStep";
import { SubjectSelectionStep } from "./components/SubjectSelectionStep";
import { GradeTitleStep } from "./components/GradeTitleStep";
import { StudentsGradingStep } from "./components/StudentsGradingStep";
import { ReviewSaveStep } from "./components/ReviewSaveStep";
import { GradeListsView } from "./components/GradeListsView";

interface GradingData {
  selectedClass: any | null;
  selectedSubject: any | null;
  gradeTitle: string;
  studentGrades: {
    [studentCode: string]: { score: number; studentName: string };
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
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [gradingData, setGradingData] = useState<GradingData>({
    selectedClass: null,
    selectedSubject: null,
    gradeTitle: "",
    studentGrades: {},
    isEditing: false,
  });
  const [showWizard, setShowWizard] = useState(false);

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
        return gradingData.gradeTitle.trim() !== "";
      case 4:
        return Object.keys(gradingData.studentGrades).length > 0;
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
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">سیستم نمره‌دهی</h1>
            <p className="text-muted-foreground mt-2">
              مدیریت و ثبت نمرات دانش‌آموزان
            </p>
          </div>
          {user.userType === "teacher" && (
            <Button onClick={startNewGrading} size="lg" className="gap-2">
              <FileText className="h-5 w-5" />
              ثبت نمره جدید
            </Button>
          )}
        </div>

        <GradeListsView
          userType={user.userType}
          userCode={user.userType === "teacher" ? user.username : undefined}
          schoolCode={user.schoolCode}
          onEditGradeList={startEditGrading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
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
            <Button variant="outline" onClick={resetWizard}>
              بازگشت به فهرست
            </Button>
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
              onClassSelect={(classData) =>
                setGradingData({ ...gradingData, selectedClass: classData })
              }
              userCode={user.username}
              schoolCode={user.schoolCode}
            />
          )}

          {currentStep === 2 && !gradingData.isEditing && (
            <SubjectSelectionStep
              selectedClass={gradingData.selectedClass}
              selectedSubject={gradingData.selectedSubject}
              onSubjectSelect={(subjectData) =>
                setGradingData({ ...gradingData, selectedSubject: subjectData })
              }
              userCode={user.username}
              schoolCode={user.schoolCode}
            />
          )}

          {currentStep === 3 && !gradingData.isEditing && (
            <GradeTitleStep
              gradeTitle={gradingData.gradeTitle}
              onTitleChange={(title) =>
                setGradingData({ ...gradingData, gradeTitle: title })
              }
            />
          )}

          {currentStep === 4 && (
            <StudentsGradingStep
              selectedClass={gradingData.selectedClass}
              studentGrades={gradingData.studentGrades}
              onGradesChange={(grades) =>
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
    </div>
  );
}

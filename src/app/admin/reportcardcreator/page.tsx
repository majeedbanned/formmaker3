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
import { ChevronLeft, ChevronRight, FileText, Search, Eye } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GradingSelectionStep } from "./components/GradingSelectionStep";
import { ReportConfigurationStep } from "./components/ReportConfigurationStep";
import { ReportPreviewStep } from "./components/ReportPreviewStep";
import PageHeader from "@/components/PageHeader";

interface GradeData {
  score?: number;
  descriptiveText?: string;
  studentName: string;
}

interface SelectedGrading {
  _id: string;
  title: string;
  date?: string;
  gradingType: "numerical" | "descriptive";
  grades: { [studentCode: string]: GradeData };
  statistics?: {
    average?: number;
    highest?: number;
    lowest?: number;
    total: number;
  };
  classData?: {
    data?: {
      className?: string;
    };
  };
  subjectData?: {
    courseName?: string;
  };
}

interface ReportCardData {
  selectedGradings: SelectedGrading[];
  reportTitle: string;
  includeStatistics: boolean;
  includeClassRanking: boolean;
  includeTeacherComments: boolean;
  showGradeBreakdown: boolean;
  reportFormat: "detailed" | "summary" | "minimal" | "statistical";
  headerLogo: boolean;
  schoolInfo: boolean;
  customFooter: string;
}

const STEPS = [
  {
    id: 1,
    title: "انتخاب نمره‌دهی",
    icon: Search,
    description: "نمره‌دهی مورد نظر برای ایجاد کارنامه انتخاب کنید",
  },
  {
    id: 2,
    title: "تنظیمات گزارش",
    icon: FileText,
    description: "تنظیمات و ظاهر کارنامه را مشخص کنید",
  },
  {
    id: 3,
    title: "پیش‌نمایش و چاپ",
    icon: Eye,
    description: "کارنامه را پیش‌نمایش و چاپ کنید",
  },
];

export default function ReportCardCreatorPage() {
  const { user ,isLoading} = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isAdminTeacher, setIsAdminTeacher] = useState(false);
  const [reportData, setReportData] = useState<ReportCardData>({
    selectedGradings: [],
    reportTitle: "کارنامه دانش‌آموز",
    includeStatistics: true,
    includeClassRanking: true,
    includeTeacherComments: false,
    showGradeBreakdown: true,
    reportFormat: "detailed",
    headerLogo: true,
    schoolInfo: true,
    customFooter: "",
  });

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

  const resetCreator = () => {
    setCurrentStep(1);
    setReportData({
      selectedGradings: [],
      reportTitle: "کارنامه دانش‌آموز",
      includeStatistics: true,
      includeClassRanking: true,
      includeTeacherComments: false,
      showGradeBreakdown: true,
      reportFormat: "detailed",
      headerLogo: true,
      schoolInfo: true,
      customFooter: "",
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return reportData.selectedGradings.length > 0;
      case 2:
        return reportData.reportTitle.trim() !== "";
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

  // Only teachers and school admins can access report card creator
  if (user.userType !== "teacher" && user.userType !== "school") {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            شما دسترسی به سازنده کارنامه ندارید.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold">سازنده کارنامه</h1>
          <p className="text-muted-foreground mt-2">
            ایجاد کارنامه‌های تخصصی برای دانش‌آموزان
          </p>
        </div> */}
        <PageHeader
          title="سازنده کارنامه"
          subtitle="ایجاد کارنامه‌های تخصصی برای دانش‌آموزان"
          icon={<FileText className="w-6 h-6" />}
          gradient={true}
        />

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">
                  قدم {currentStep} از {STEPS.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-center p-3 rounded-lg border ${
                    currentStep === step.id
                      ? "bg-primary/10 border-primary"
                      : currentStep > step.id
                      ? "bg-green-50 border-green-200"
                      : "bg-muted"
                  }`}
                >
                  <step.icon
                    className={`h-5 w-5 mr-3 ${
                      currentStep === step.id
                        ? "text-primary"
                        : currentStep > step.id
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {(() => {
                const StepIcon = STEPS[currentStep - 1].icon;
                return <StepIcon className="h-6 w-6 mr-2" />;
              })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <GradingSelectionStep
                userType={user.userType as "teacher" | "school"}
                userCode={user.username}
                schoolCode={user.schoolCode}
                selectedGradings={reportData.selectedGradings}
                onGradingsSelect={(gradings) =>
                  setReportData({ ...reportData, selectedGradings: gradings })
                }
                isAdminTeacher={isAdminTeacher}
              />
            )}

            {currentStep === 2 && (
              <ReportConfigurationStep
                reportData={reportData}
                onConfigChange={(config: any) =>
                  setReportData({ ...reportData, ...config })
                }
              />
            )}

            {currentStep === 3 && (
              <ReportPreviewStep reportData={reportData} userInfo={user} />
            )}
          </CardContent>

          {/* Navigation */}
          <div className="flex justify-between p-6 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  <ChevronRight className="h-4 w-4 ml-2" />
                  قدم قبل
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetCreator}>
                شروع مجدد
              </Button>
              {currentStep < STEPS.length && (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="mr-2"
                >
                  قدم بعد
                  <ChevronLeft className="h-4 w-4 mr-2" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

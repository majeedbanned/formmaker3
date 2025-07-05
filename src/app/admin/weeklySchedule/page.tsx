import { Suspense } from "react";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import WeeklySchedule from "./components/WeeklySchedule";
import { getCurrentUser } from "@/app/api/chatbot7/config/route";
import PageHeader from "@/components/PageHeader";
import { AcademicCapIcon } from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "برنامه هفتگی",
  description: "مشاهده برنامه هفتگی کلاس‌ها",
};

export default async function WeeklySchedulePage() {
  const currentUser = await getCurrentUser();
  const schoolCode = currentUser?.schoolCode || "";
  const role = currentUser?.role || "";
  // Use username from currentUser as userCode
  const userCode = currentUser?.username || "";

  return (
    <div className="flex flex-col p-6 space-y-6">
      {/* <h1 className="text-3xl font-bold tracking-tight text-right">
        برنامه هفتگی
      </h1> */}
      <PageHeader
        title="برنامه هفتگی"
        subtitle="مشاهده برنامه هفتگی کلاس‌ها"
        icon={<AcademicCapIcon className="w-6 h-6" />}
        gradient={true}
      />

      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<div>در حال بارگذاری...</div>}>
            <WeeklySchedule
              schoolCode={schoolCode}
              role={role}
              userCode={userCode}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

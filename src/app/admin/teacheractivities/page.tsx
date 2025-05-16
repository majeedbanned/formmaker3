import { PageWrapper } from "@/components/PageWrapper";
import { Suspense } from "react";
import TeacherActivities from "./components/TeacherActivities";

export default function Page() {
  return (
    <PageWrapper>
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherActivities />
      </Suspense>
    </PageWrapper>
  );
}

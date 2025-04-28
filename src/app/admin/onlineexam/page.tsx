"use client";

/* ──────────────────────────────────────────────────────────────────────────
   OnlineExamPage – fixed Jalali-parsing version
   - Parses Persian dates with `{ jalali:true }` so “۶۲۱ سال” bug disappears
   - Caches parsed dates
   - Inclusive isBetween check
   - Persian-digit → Latin-digit helper
   - Abortable fetch + interval pause on tab-hide (optional nicety)
   ────────────────────────────────────────────────────────────────────────── */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "dayjs";
import jalaliday from "jalaliday";
import relativeTime from "dayjs/plugin/relativeTime";
import isBetween from "dayjs/plugin/isBetween";
import "dayjs/locale/fa";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

/* ───── Day.js config ──────────────────────────────────────────────────── */
dayjs.extend(jalaliday);
dayjs.extend(relativeTime);
dayjs.extend(isBetween);
dayjs.locale("fa");

/* ───── Types ──────────────────────────────────────────────────────────── */
interface ExamDateTime {
  startDate: string;
  endDate: string;
}
interface ExamData {
  examCode: string;
  examName: string;
  schoolCode: string;
  dateTime: ExamDateTime;
  [key: string]: string | number | boolean | object | null | undefined;
}
interface Exam {
  _id: string;
  data: ExamData;
  createdAt: string;
  updatedAt: string;
}

/* ───── Helpers ───────────────────────────────────────────────────────── */
/* Persian-digit → Latin-digit converter (۱۴۰۴ → 1404) */
const toEN = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());

export default function OnlineExamPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(dayjs());

  /* ── Tick each second (pause when tab hidden) ──────────────────────── */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const start = () =>
      (timer = setInterval(() => setCurrentTime(dayjs()), 1_000));
    const stop = () => clearInterval(timer);

    document.addEventListener("visibilitychange", () =>
      document.hidden ? stop() : start()
    );
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", () => {});
    };
  }, []);

  /* ── Fetch exams ───────────────────────────────────────────────────── */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/exams", {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch exams");
        setExams(await res.json());
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "خطای نامشخص");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /* ── Jalali parsing helper & memoised exams ────────────────────────── */
  const parseJalaliDate = useCallback(
    (p?: string) => (p ? dayjs(toEN(p.trim()), { jalali: true }) : null),
    []
  );

  const parsedExams = useMemo(
    () =>
      exams.map((e) => ({
        ...e,
        start: parseJalaliDate(e.data?.dateTime?.startDate),
        end: parseJalaliDate(e.data?.dateTime?.endDate),
      })),
    [exams, parseJalaliDate]
  );

  /* ── Active & status helpers ───────────────────────────────────────── */
  const isExamActive = (start: dayjs.Dayjs | null, end: dayjs.Dayjs | null) =>
    !!start && !!end && currentTime.isBetween(start, end, "minute", "[]"); // inclusive

  const getTimeStatus = (
    start: dayjs.Dayjs | null,
    end: dayjs.Dayjs | null
  ) => {
    if (!start || !end) return "زمان نامشخص";
    if (currentTime.isBefore(start)) return `شروع در ${start.fromNow(true)}`;
    if (currentTime.isAfter(end)) return `پایان یافته ${end.fromNow(true)} قبل`;
    return `در حال برگزاری، پایان در ${end.fromNow(true)}`;
  };

  /* ── UI states ─────────────────────────────────────────────────────── */
  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-red-500">
          <p className="mb-2 text-2xl">خطا</p>
          <p>{error}</p>
        </div>
      </div>
    );

  /* ── Render table ──────────────────────────────────────────────────── */
  return (
    <div className="container mx-auto max-w-7xl p-4" dir="rtl">
      <Card className="shadow-lg">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-xl text-blue-800">
            آزمون‌های آنلاین
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {parsedExams.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              هیچ آزمونی یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">کد آزمون</TableHead>
                    <TableHead className="text-right">نام آزمون</TableHead>
                    <TableHead className="text-right">تاریخ شروع</TableHead>
                    <TableHead className="text-right">تاریخ پایان</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedExams.map(({ _id, data, start, end }) => {
                    const active = isExamActive(start, end);
                    const upcoming = !!start && currentTime.isBefore(start);

                    return (
                      <TableRow key={_id}>
                        <TableCell className="font-medium">
                          {data.examCode}
                        </TableCell>
                        <TableCell>{data.examName}</TableCell>
                        <TableCell>{data.dateTime.startDate}</TableCell>
                        <TableCell>{data.dateTime.endDate}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {active ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-500" />
                            ) : upcoming ? (
                              <ClockIcon className="h-5 w-5 text-orange-500" />
                            ) : (
                              <XCircleIcon className="h-5 w-5 text-red-500" />
                            )}
                            <span>{getTimeStatus(start, end)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {active ? (
                            <Link href={`/admin/onlineexam/take/${_id}`}>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                ورود به آزمون
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="outline" size="sm" disabled>
                              ورود به آزمون
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

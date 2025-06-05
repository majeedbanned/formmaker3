"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CakeIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import moment from "moment-jalaali";

interface User {
  id: string;
  userType: "school" | "teacher" | "student";
  schoolCode: string;
  username: string;
  name: string;
  classCode?: Array<{ label: string; value: string }>;
}

interface BirthdateWidgetProps {
  user: User;
}

interface BirthdayPerson {
  id: string;
  code: string;
  name: string;
  type: "student" | "teacher";
  birthDate: string;
  avatar?: string;
  age: number;
  daysUntilBirthday: number;
  className?: string;
}

export default function BirthdateWidget({ user }: BirthdateWidgetProps) {
  const todayStart = useMemo(() => moment().startOf("day"), []);
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert Persian digits to English
  const persianToEnglish = useCallback((str: string): string => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const englishDigits = "0123456789";

    return str.replace(/[۰-۹]/g, (char) => {
      return englishDigits[persianDigits.indexOf(char)];
    });
  }, []);

  // Calculate days until next birthday using moment-jalaali
  const daysUntilNextBirthday = useCallback(
    (persianDate: string): number => {
      try {
        const cleanDate = persianToEnglish(persianDate);
        const [, month, day] = cleanDate.split("/").map(Number);

        const today = moment();
        const todayJalali = today.jYear();
        const todayMonth = today.jMonth() + 1; // moment months are 0-indexed
        const todayDay = today.jDate();

        // Determine if birthday is this year or next year
        let birthdayYear = todayJalali;
        if (month < todayMonth || (month === todayMonth && day < todayDay)) {
          birthdayYear = todayJalali + 1;
        }

        // Create birthday moment
        const birthday = moment(
          `${birthdayYear}/${month}/${day}`,
          "jYYYY/jM/jD"
        ).startOf("day");

        const diffDays = birthday.diff(todayStart, "days");

        return Math.max(0, diffDays);
      } catch (error) {
        console.error("Error calculating days until birthday:", error);
        return 999;
      }
    },
    [persianToEnglish]
  );

  // Calculate age using moment-jalaali
  const calculateAge = useCallback(
    (birthDatePersian: string): number => {
      try {
        const cleanDate = persianToEnglish(birthDatePersian);
        const [year, month, day] = cleanDate.split("/").map(Number);

        const today = moment();
        const todayJalali = today.jYear();
        const todayMonth = today.jMonth() + 1; // moment months are 0-indexed
        const todayDay = today.jDate();

        let age = todayJalali - year;

        // Adjust age if birthday hasn't occurred this year
        if (month > todayMonth || (month === todayMonth && day > todayDay)) {
          age--;
        }

        return Math.max(0, age);
      } catch (error) {
        console.error("Error calculating age:", error);
        return 0;
      }
    },
    [persianToEnglish]
  );

  // Fetch birthdays based on user type
  const fetchBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/birthdays/upcoming", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-domain": window.location.host,
        },
        body: JSON.stringify({
          userType: user.userType,
          userCode: user.username,
          schoolCode: user.schoolCode,
          classCode: user.classCode,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch birthdays");
      }

      const data = await response.json();

      // Process and sort the data
      const processedBirthdays: BirthdayPerson[] = data.birthdays.map(
        (person: {
          _id: string;
          code: string;
          name: string;
          type: "student" | "teacher";
          birthDate: string;
          avatar?: string;
          className?: string;
        }) => ({
          id: person._id,
          code: person.code,
          name: person.name,
          type: person.type,
          birthDate: person.birthDate,
          avatar: person.avatar,
          className: person.className,
          age: calculateAge(person.birthDate),
          daysUntilBirthday: daysUntilNextBirthday(person.birthDate),
        })
      );

      // Filter for next 7 days and sort by days until birthday
      const upcomingBirthdays = processedBirthdays
        .filter(
          (person) =>
            person.daysUntilBirthday >= 0 && person.daysUntilBirthday <= 7
        )
        .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

      setBirthdays(upcomingBirthdays);
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطا در بارگیری اطلاعات");
      setBirthdays([]);
    } finally {
      setLoading(false);
    }
  }, [user, calculateAge, daysUntilNextBirthday]);

  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  // Memoized birthday groups
  const birthdayGroups = useMemo(() => {
    const groups = {
      today: birthdays.filter((p) => p.daysUntilBirthday === 0),
      tomorrow: birthdays.filter((p) => p.daysUntilBirthday === 1),
      thisWeek: birthdays.filter(
        (p) => p.daysUntilBirthday > 1 && p.daysUntilBirthday <= 7
      ),
    };
    return groups;
  }, [birthdays]);

  // Get current Persian date
  const getCurrentPersianDate = useCallback(() => {
    const today = moment();
    return today.format("jYYYY/jMM/jDD");
  }, []);

  // Get day label
  const getDayLabel = useCallback((days: number): string => {
    if (days === 0) return "امروز";
    if (days === 1) return "فردا";
    return `${days} روز دیگر`;
  }, []);

  // Get user type icon
  const getUserTypeIcon = useCallback((type: "student" | "teacher") => {
    return type === "teacher" ? (
      <AcademicCapIcon className="h-4 w-4 text-blue-600" />
    ) : (
      <UserGroupIcon className="h-4 w-4 text-green-600" />
    );
  }, []);

  // Get avatar URL
  const getAvatarUrl = useCallback((avatar?: string) => {
    if (!avatar) return "/images/default-avatar.png";
    if (avatar.startsWith("http")) return avatar;
    return avatar.startsWith("/") ? avatar : `/${avatar}`;
  }, []);

  // Render birthday person
  const renderBirthdayPerson = useCallback(
    (person: BirthdayPerson) => (
      <div
        key={person.id}
        className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 hover:shadow-md transition-shadow"
      >
        {/* Avatar */}
        <div className="relative">
          <img
            src={getAvatarUrl(person.avatar)}
            alt={person.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/default-avatar.png";
            }}
          />
          <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            <CakeIcon className="h-3 w-3" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 space-x-reverse">
            {getUserTypeIcon(person.type)}
            <p className="text-sm font-medium text-gray-900 truncate">
              {person.name}
            </p>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-600">
            <span>{person.age + 1} ساله می‌شود</span>
            {person.className && (
              <>
                <span>•</span>
                <span>{person.className}</span>
              </>
            )}
          </div>
        </div>

        {/* Days until birthday */}
        <div className="text-left">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              person.daysUntilBirthday === 0
                ? "bg-red-100 text-red-800"
                : person.daysUntilBirthday === 1
                ? "bg-orange-100 text-orange-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {getDayLabel(person.daysUntilBirthday)}
          </span>
        </div>
      </div>
    ),
    [getAvatarUrl, getUserTypeIcon, getDayLabel]
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <CakeIcon className="h-6 w-6 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            تولدهای پیش رو
          </h3>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 space-x-reverse p-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 space-x-reverse mb-4">
          <CakeIcon className="h-6 w-6 text-pink-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            تولدهای پیش رو
          </h3>
        </div>

        <div className="text-center py-6">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={fetchBirthdays}
            className="mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <CakeIcon className="h-6 w-6 text-pink-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              تولدهای پیش رو
            </h3>
            <p className="text-xs text-gray-500">{getCurrentPersianDate()}</p>
          </div>
        </div>

        {birthdays.length > 0 && (
          <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
            {birthdays.length} تولد
          </span>
        )}
      </div>

      {birthdays.length === 0 ? (
        <div className="text-center py-8">
          <CakeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            تولدی در هفت روز آینده وجود ندارد
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's birthdays */}
          {birthdayGroups.today.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                <CakeIcon className="h-4 w-4 ml-1" />
                امروز ({birthdayGroups.today.length})
              </h4>
              <div className="space-y-2">
                {birthdayGroups.today.map(renderBirthdayPerson)}
              </div>
            </div>
          )}

          {/* Tomorrow's birthdays */}
          {birthdayGroups.tomorrow.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-orange-700 mb-2">
                فردا ({birthdayGroups.tomorrow.length})
              </h4>
              <div className="space-y-2">
                {birthdayGroups.tomorrow.map(renderBirthdayPerson)}
              </div>
            </div>
          )}

          {/* This week's birthdays */}
          {birthdayGroups.thisWeek.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                این هفته ({birthdayGroups.thisWeek.length})
              </h4>
              <div className="space-y-2">
                {birthdayGroups.thisWeek.map(renderBirthdayPerson)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

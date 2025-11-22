"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CakeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import moment from "moment-jalaali";
import { useBirthdayMessages } from "@/hooks/useBirthdayMessages";

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

interface MessagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  person: BirthdayPerson;
  onSendMessage: (message: string) => void;
}

// Predefined birthday messages
const BIRTHDAY_MESSAGES = [
  {
    id: 1,
    message: "🎉 تولدت مبارک! روز پر از شادی و خوشحالی برات آرزو می‌کنم 🎂",
    type: "informal",
  },
  {
    id: 2,
    message:
      "🌟 سال نو زندگیت مبارک! امیدوارم سالی پر از موفقیت و سلامتی داشته باشی 🎈",
    type: "formal",
  },
  {
    id: 3,
    message: "🎊 امروز روز ویژه تو هست! تولدت مبارک عزیز 💝",
    type: "informal",
  },
  {
    id: 4,
    message: "🎁 در سالگرد تولدتان، سلامتی و شادکامی برایتان آرزومندم",
    type: "formal",
  },
  {
    id: 5,
    message: "🌈 یک سال دیگه بزرگ‌تر شدی! امیدوارم آرزوهات محقق بشه 🎯",
    type: "informal",
  },
  {
    id: 6,
    message: "🕊️ تولد مبارک! خداوند سالی بهتر از پارسال نصیبتان کند 🌺",
    type: "formal",
  },
  {
    id: 7,
    message: "🎪 پارتی تایم! تولدت مبارک باشه و کیک رو جا نذار 🍰",
    type: "informal",
  },
  {
    id: 8,
    message: "🌙 در این روز مبارک، سال آینده‌تان سرشار از برکت و خیر باشد 🌸",
    type: "formal",
  },
  {
    id: 9,
    message: "🚀 سالی جدید، ماجراجویی‌های جدید! تولدت مبارک قهرمان 🏆",
    type: "informal",
  },
  {
    id: 10,
    message:
      "💫 با آرزوی سالی مملو از شادی، سلامتی و موفقیت. تولدتان مبارک باد 🎖️",
    type: "formal",
  },
];

// Birthday Animation Component
function BirthdayAnimation() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {/* Falling Flowers/Petals */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute text-3xl animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${-30 + Math.random() * 30}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${1.5 + Math.random() * 2.5}s`,
            animationIterationCount: "infinite",
            transform: `rotate(${Math.random() * 360}deg) scale(${
              0.8 + Math.random() * 0.4
            })`,
            filter: "drop-shadow(0 0 8px rgba(255, 192, 203, 0.6))",
          }}
        >
          {
            [
              "🌸",
              "🌺",
              "🌷",
              "🌹",
              "💐",
              "🎊",
              "🎉",
              "✨",
              "💫",
              "🌟",
              "🎈",
              "🧁",
              "🍰",
              "🎂",
            ][Math.floor(Math.random() * 14)]
          }
        </div>
      ))}

      {/* Confetti */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`confetti-${i}`}
          className="absolute animate-spin text-2xl"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            animationIterationCount: "infinite",
            transform: `scale(${0.6 + Math.random() * 0.6})`,
            filter: "drop-shadow(0 0 6px rgba(236, 72, 153, 0.5))",
          }}
        >
          {
            ["🎈", "🎁", "🧁", "🍰", "🎂", "🎪", "🎭", "🎨", "🎯"][
              Math.floor(Math.random() * 9)
            ]
          }
        </div>
      ))}

      {/* Sparkles */}
      {[...Array(35)].map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute animate-ping text-lg"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
            animationIterationCount: "infinite",
            transform: `scale(${0.5 + Math.random() * 0.8})`,
            filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.8))",
          }}
        >
          {
            ["✨", "⭐", "💫", "🌟", "💖", "💝", "🎊", "🎉"][
              Math.floor(Math.random() * 8)
            ]
          }
        </div>
      ))}
    </div>
  );
}

// Birthday Message Component
function BirthdayMessage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-400/30 to-purple-400/30 backdrop-blur-sm rounded-lg">
      <div className="text-center p-6 bg-gradient-to-br from-white/95 to-pink-50/95 rounded-xl shadow-2xl border-2 border-pink-400 max-w-xs transform animate-pulse">
        <div className="text-5xl mb-3 animate-bounce">🎉</div>
        <h3 className="text-xl font-bold text-pink-800 mb-2 animate-pulse">
          تولدت مبارک! 🎂
        </h3>
        <p className="text-sm text-gray-700 mb-3 font-medium">
          امروز روز ویژه و جادویی توست! ✨
        </p>
        <div className="flex items-center justify-center space-x-2 space-x-reverse text-sm text-blue-700 bg-blue-50 rounded-lg p-2 mb-3">
          <EnvelopeIcon className="h-4 w-4 animate-bounce" />
          <span className="font-medium">پیام‌های تولدت را اینجا ببین</span>
        </div>
        <div className="flex justify-center space-x-2 space-x-reverse text-3xl">
          <span className="animate-pulse">💝</span>
          <span className="animate-bounce">🎈</span>
          <span className="animate-ping">🌟</span>
        </div>
      </div>
    </div>
  );
}

// Message Popup Component
function MessagePopup({
  isOpen,
  onClose,
  person,
  onSendMessage,
}: MessagePopupProps) {
  const [selectedMessage, setSelectedMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSend = () => {
    if (selectedMessage) {
      onSendMessage(selectedMessage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              <PaperAirplaneIcon className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                ارسال پیام تولد
              </h3>
              <p className="text-sm text-gray-600">برای {person.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Messages List */}
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            یکی از پیام‌های زیر را انتخاب کنید:
          </p>
          <div className="space-y-3">
            {BIRTHDAY_MESSAGES.map((msg) => (
              <label key={msg.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="birthday-message"
                  value={msg.message}
                  checked={selectedMessage === msg.message}
                  onChange={(e) => setSelectedMessage(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMessage === msg.message
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-pink-300 hover:bg-pink-25"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        msg.type === "formal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {msg.type === "formal" ? "رسمی" : "دوستانه"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {msg.message}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 space-x-reverse p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedMessage}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedMessage
                ? "bg-pink-600 text-white hover:bg-pink-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            ارسال پیام
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BirthdateWidget({ user }: BirthdateWidgetProps) {
  const todayStart = useMemo(() => moment().startOf("day"), []);
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserBirthday, setIsUserBirthday] = useState(false);
  const { unreadCount } = useBirthdayMessages();
  const [messagePopup, setMessagePopup] = useState<{
    isOpen: boolean;
    person: BirthdayPerson | null;
  }>({
    isOpen: false,
    person: null,
  });

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

  // Check if today is user's birthday based on the fetched birthday list
  const checkUserBirthday = useCallback(() => {
    const todaysBirthdays = birthdays.filter(
      (person) => person.daysUntilBirthday === 0
    );
    const userHasBirthday = todaysBirthdays.some(
      (person) => person.code === user.username
    );
    setIsUserBirthday(userHasBirthday);
  }, [birthdays, user.username]);

  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  useEffect(() => {
    checkUserBirthday();
  }, [checkUserBirthday]);

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

  // Handle opening message popup
  const handleSendMessage = useCallback((person: BirthdayPerson) => {
    setMessagePopup({
      isOpen: true,
      person: person,
    });
  }, []);

  // Handle closing message popup
  const handleCloseMessagePopup = useCallback(() => {
    setMessagePopup({
      isOpen: false,
      person: null,
    });
  }, []);

  // Handle sending message
  const handleMessageSend = useCallback(
    async (message: string) => {
      try {
        if (!messagePopup.person) return;

        const response = await fetch("/api/birthday-messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-domain": window.location.host,
          },
          body: JSON.stringify({
            recipientCode: messagePopup.person.code,
            recipientType: messagePopup.person.type,
            message: message,
            messageType: "birthday",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert(`پیام تولد با موفقیت ارسال شد!`);
        } else {
          throw new Error(data.error || "خطا در ارسال پیام");
        }
      } catch (error) {
        console.error("Error sending message:", error);
        alert(error instanceof Error ? error.message : "خطا در ارسال پیام");
      }
    },
    [messagePopup.person]
  );

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
            {/* <span>{person.age + 1} ساله می‌شود</span> */}
            {person.className && (
              <>
                <span>•</span>
                <span>{person.className}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="text-left space-y-2">
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

          {/* Send Message Button */}
          <button
            onClick={() => handleSendMessage(person)}
            className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded-full hover:bg-pink-200 transition-colors"
            title="ارسال پیام تولد"
          >
            <PaperAirplaneIcon className="h-3 w-3" />
            <span>پیام</span>
          </button>
        </div>
      </div>
    ),
    [getAvatarUrl, getUserTypeIcon, getDayLabel, handleSendMessage]
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
    <div className="relative bg-white rounded-lg shadow-md p-6 max-h-96 overflow-y-auto">
      {/* Birthday Animation Overlay */}
      {isUserBirthday && (
        <>
          <BirthdayAnimation />
          <BirthdayMessage />
        </>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <CakeIcon
            className={`h-6 w-6 ${
              isUserBirthday ? "text-pink-600 animate-pulse" : "text-pink-600"
            }`}
          />
          <div>
            <h3
              className={`text-lg font-semibold ${
                isUserBirthday ? "text-pink-700 animate-pulse" : "text-gray-900"
              }`}
            >
              {isUserBirthday ? "🎉 تولدهای پیش رو 🎂" : "تولدهای پیش رو"}
            </h3>
            <p className="text-xs text-gray-500">{getCurrentPersianDate()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse">
          {birthdays.length > 0 && (
            <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2 py-1 rounded-full">
              {birthdays.length} تولد
            </span>
          )}

          {/* View Messages Link */}
          <a
            href="/admin/birthday-messages"
            className="relative flex items-center space-x-1 space-x-reverse px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors text-xs font-medium"
            title="مشاهده پیام‌های تولد"
          >
            <EnvelopeIcon className="h-3 w-3" />
            <span>پیام‌ها</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </a>
        </div>
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

      {/* Message Popup */}
      {messagePopup.isOpen && messagePopup.person && (
        <MessagePopup
          isOpen={messagePopup.isOpen}
          person={messagePopup.person}
          onClose={handleCloseMessagePopup}
          onSendMessage={handleMessageSend}
        />
      )}
    </div>
  );
}

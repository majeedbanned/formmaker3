"use client";

import { useState, useEffect } from "react";

interface Person {
  _id: string;
  name: string;
  code: string;
  type: "student" | "teacher";
  classCode?: unknown[];
}

interface PersonSelectorProps {
  selectedPerson: Person | null;
  onPersonSelect: (person: Person) => void;
  refreshTrigger: number;
}

export default function PersonSelector({
  selectedPerson,
  onPersonSelect,
  refreshTrigger,
}: PersonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [personType, setPersonType] = useState<"both" | "student" | "teacher">(
    "both"
  );
  const [students, setStudents] = useState<Person[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch persons based on search and type
  const fetchPersons = async () => {
    if (searchTerm.length < 2 && personType === "both") return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (personType !== "both") params.append("personType", personType);

      const response = await fetch(`/api/accounting/persons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setTeachers(data.teachers || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Error fetching persons:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect for search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchPersons();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, personType]);

  // Effect for refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPersons();
    }
  }, [refreshTrigger]);

  const handlePersonSelect = (person: Person) => {
    onPersonSelect(person);
    setShowDropdown(false);
    setSearchTerm("");
  };

  const allPersons = [...students, ...teachers];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">انتخاب شخص</h2>

      {/* Person Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          نوع شخص
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setPersonType("both")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              personType === "both"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setPersonType("student")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              personType === "student"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            دانش‌آموزان
          </button>
          <button
            onClick={() => setPersonType("teacher")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              personType === "teacher"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            معلمان
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          جستجو
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="نام، نام خانوادگی یا کد را وارد کنید..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 text-right"
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {loading && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && !loading && allPersons.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {students.length > 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 border-b">
                  دانش‌آموزان ({students.length})
                </div>
                {students.map((student) => (
                  <button
                    key={`student-${student._id}`}
                    onClick={() => handlePersonSelect(student)}
                    className="w-full px-4 py-3 text-right hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          کد: {student.code}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}

            {teachers.length > 0 && (
              <>
                <div className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 border-b">
                  معلمان ({teachers.length})
                </div>
                {teachers.map((teacher) => (
                  <button
                    key={`teacher-${teacher._id}`}
                    onClick={() => handlePersonSelect(teacher)}
                    className="w-full px-4 py-3 text-right hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <div className="flex-1 text-right">
                        <div className="font-medium text-gray-900">
                          {teacher.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          کد: {teacher.code}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}

        {/* No Results */}
        {showDropdown &&
          !loading &&
          allPersons.length === 0 &&
          searchTerm.length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
              نتیجه‌ای یافت نشد
            </div>
          )}
      </div>

      {/* Selected Person Display */}
      {selectedPerson && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">انتخاب شده:</h3>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                selectedPerson.type === "student"
                  ? "bg-green-500"
                  : "bg-purple-500"
              }`}
            ></div>
            <div className="flex-1">
              <div className="font-medium text-blue-900">
                {selectedPerson.name}
              </div>
              <div className="text-sm text-blue-700">
                {selectedPerson.type === "student" ? "دانش‌آموز" : "معلم"} - کد:{" "}
                {selectedPerson.code}
              </div>
            </div>
            <button
              onClick={() => {
                onPersonSelect(null as unknown as Person);
                setShowDropdown(false);
              }}
              className="text-blue-600 hover:text-blue-800 p-1"
              title="حذف انتخاب"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  FolderIcon,
  DocumentIcon,
  FolderPlusIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  TrashIcon,
  FolderArrowDownIcon,
  XMarkIcon,
  PencilIcon,
  EyeSlashIcon,
  EyeIcon,
  LockClosedIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  UserGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  ViewColumnsIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { ChevronLeftIcon } from "lucide-react";

// Define types for our file explorer
interface FileItem {
  _id: string;
  type: "file";
  name: string;
  path: string;
  size: number;
  createdAt: string;
  extension: string;
  publicUrl: string;
  permissions?: Permission[];
  username: string;
  creatorInfo?: CreatorInfo;
}

interface FolderItem {
  _id: string;
  type: "folder";
  name: string;
  path: string;
  createdAt: string;
  password?: string;
  permissions?: Permission[];
  username: string;
  creatorInfo?: CreatorInfo;
}

interface Permission {
  type: "class" | "group" | "teacher" | "student";
  code: string;
  name: string;
}

interface PermissionOption {
  type: "class" | "group" | "teacher";
  code: string;
  name: string;
  selected: boolean;
}

// Add creator info interface
interface CreatorInfo {
  username: string;
  name: string;
  avatar?: string;
  userType: string;
}

type ExplorerItem = FileItem | FolderItem;

// Add these interfaces at the top after the existing type definitions
interface ClassData {
  data: {
    classCode: string;
    className: string;
  };
}

interface GroupData {
  data: {
    groupCode: string;
    groupName: string;
  };
}

interface TeacherData {
  data: {
    teacherCode: string;
    teacherName: string;
  };
}

// Add this interface after the other interface definitions
interface CurrentUser {
  schoolCode: string;
  username: string;
  userType: string;
  classCode?: Array<{ label?: string; value: string }>;
  groups?: Array<{ label?: string; value: string }>;
  [key: string]: unknown;
}

// Add view mode type
type ViewMode =
  | "large-icons"
  | "medium-icons"
  | "small-icons"
  | "list"
  | "details";

// Create modal component
function CreateFolderModal({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, password?: string) => void;
  currentPath: string;
}) {
  const [folderName, setFolderName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setFolderName("");
    setPassword("");
    setShowPassword(false);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">ایجاد پوشه جدید</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label
            htmlFor="folderName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            نام پوشه
          </label>
          <input
            ref={inputRef}
            id="folderName"
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="نام پوشه جدید را وارد کنید"
          />
          <p className="mt-1 text-sm text-gray-500">
            مسیر: {currentPath || "/"}
          </p>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
            {currentPath ? (
              <div>
                <span className="font-bold ml-1">توجه:</span>
                پوشه جدید در داخل
                <span className="mx-1 text-blue-600 font-bold">
                  {currentPath.split("/").pop()}
                </span>
                ایجاد خواهد شد
              </div>
            ) : (
              <div>
                <span className="font-bold ml-1">توجه:</span>
                پوشه جدید در پوشه اصلی ایجاد خواهد شد
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رمز عبور پوشه (اختیاری)
            </label>
            <div className="relative">
              <input
                id="folderPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="رمز عبور برای محدود کردن دسترسی به پوشه"
              />
              <button
                type="button"
                className="absolute inset-y-0 left-0 px-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              در صورت تعیین رمز عبور، برای دسترسی به این پوشه باید رمز وارد شود
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              if (folderName.trim()) {
                onConfirm(folderName, password || undefined);
                onClose();
              }
            }}
            disabled={!folderName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ایجاد
          </button>
        </div>
      </div>
    </div>
  );
}

// Delete confirmation modal
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: ExplorerItem | null;
}) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">تایید حذف</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700">
            {item.type === "folder"
              ? `آیا از حذف پوشه "${item.name}" و تمام محتویات آن اطمینان دارید؟`
              : `آیا از حذف فایل "${item.name}" اطمینان دارید؟`}
          </p>
          <p className="mt-2 text-sm text-red-600">
            این عملیات قابل بازگشت نیست.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// Rename modal component
function RenameModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
  item: ExplorerItem | null;
}) {
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current && item) {
      setNewName(item.name);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen, item]);

  // Only show modal for folders
  if (!isOpen || !item || item.type !== "folder") return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">تغییر نام پوشه</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <label
            htmlFor="newName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            نام جدید
          </label>
          <input
            ref={inputRef}
            id="newName"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              if (newName.trim() && newName !== item.name) {
                onConfirm(newName);
                onClose();
              }
            }}
            disabled={!newName.trim() || newName === item.name}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            تغییر نام
          </button>
        </div>
      </div>
    </div>
  );
}

// Password modal component
function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
  folderName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  folderName: string;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setPassword("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            ورود به پوشه محافظت شده
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">
            پوشه <span className="font-bold text-blue-600">{folderName}</span>{" "}
            با رمز عبور محافظت شده است. لطفاً رمز عبور را وارد کنید.
          </p>

          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                error ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="رمز عبور پوشه را وارد کنید"
            />
            <button
              type="button"
              className="absolute inset-y-0 left-0 px-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={() => {
              if (!password.trim()) {
                setError("لطفاً رمز عبور را وارد کنید");
                return;
              }
              onConfirm(password);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            ورود
          </button>
        </div>
      </div>
    </div>
  );
}

// Share modal component
function ShareModal({
  isOpen,
  onClose,
  file,
}: {
  isOpen: boolean;
  onClose: () => void;
  file: FileItem | null;
}) {
  const [shareLink, setShareLink] = useState<string>("");
  const [expiresIn, setExpiresIn] = useState<string>("7d"); // Default 7 days
  const [isPasswordProtected, setIsPasswordProtected] =
    useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLinkGenerated, setIsLinkGenerated] = useState<boolean>(false);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShareLink("");
      setExpiresIn("7d");
      setIsPasswordProtected(false);
      setPassword("");
      setIsLinkGenerated(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  const generateLink = async () => {
    if (!file) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/fileexplorer/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: file._id,
          expiresIn,
          isPasswordProtected,
          password: isPasswordProtected ? password : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate share link");
      }

      const data = await response.json();
      const fullUrl = `${window.location.origin}/shared-file/${data.shareId}`;
      setShareLink(fullUrl);
      setIsLinkGenerated(true);
    } catch (error) {
      console.error("Error generating share link:", error);
      toast.error("خطا در ایجاد لینک اشتراک‌گذاری");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (linkRef.current) {
      linkRef.current.select();
      document.execCommand("copy");
      toast.success("لینک کپی شد");
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
        dir="rtl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">اشتراک‌گذاری فایل</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-700 mb-3">
            فایل: <span className="font-bold">{file.name}</span>
          </p>

          {isLinkGenerated ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                لینک اشتراک‌گذاری
              </label>
              <div className="flex">
                <input
                  ref={linkRef}
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 p-2 border border-gray-300 rounded-r-none rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-gray-100 px-3 py-2 border border-gray-300 border-r-0 rounded-l-md hover:bg-gray-200"
                  title="کپی کردن لینک"
                >
                  <ClipboardDocumentIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مدت زمان اعتبار
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1h">۱ ساعت</option>
                  <option value="1d">۱ روز</option>
                  <option value="7d">۷ روز</option>
                  <option value="30d">۳۰ روز</option>
                  <option value="never">بدون محدودیت زمانی</option>
                </select>
              </div>

              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    id="password-protection"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={isPasswordProtected}
                    onChange={(e) => setIsPasswordProtected(e.target.checked)}
                  />
                  <label
                    htmlFor="password-protection"
                    className="mr-2 block text-sm text-gray-700"
                  >
                    محافظت با رمز عبور
                  </label>
                </div>

                {isPasswordProtected && (
                  <div className="mt-2 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="رمز عبور برای دسترسی به فایل"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 px-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            بستن
          </button>

          {!isLinkGenerated ? (
            <button
              onClick={generateLink}
              disabled={(isPasswordProtected && !password.trim()) || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 ml-1.5 animate-spin" />
                  در حال ایجاد لینک...
                </>
              ) : (
                <>
                  <ShareIcon className="h-5 w-5 ml-1.5" />
                  ایجاد لینک اشتراک‌گذاری
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLinkGenerated(false);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ایجاد لینک جدید
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Permission Modal Component
function PermissionModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  userType,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permissions: Permission[]) => void;
  item: ExplorerItem | null;
  userType: string;
  currentUser: CurrentUser | null;
}) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<PermissionOption[]>([]);
  const [expandedSections, setExpandedSections] = useState<{
    classes: boolean;
    groups: boolean;
    teachers: boolean;
  }>({ classes: true, groups: true, teachers: true });

  // Fetch available permission options based on user type
  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchOptions = async () => {
      setLoading(true);
      try {
        const permissionOptions: PermissionOption[] = [];

        if (userType === "school") {
          // School can see all classes, groups, and teachers
          const [classesRes, groupsRes, teachersRes] = await Promise.all([
            fetch(`/api/admin/classes?schoolCode=${currentUser.schoolCode}`),
            fetch(`/api/admin/groups?schoolCode=${currentUser.schoolCode}`),
            fetch(
              `/api/admin/teachers/teachers?schoolCode=${currentUser.schoolCode}`
            ),
          ]);

          if (classesRes.ok) {
            const classes: ClassData[] = await classesRes.json();
            console.log("classesRes", classes);
            classes.forEach((cls: ClassData) => {
              permissionOptions.push({
                type: "class",
                code: cls.data.classCode,
                name: cls.data.className,
                selected: false,
              });
            });
          }

          if (groupsRes.ok) {
            const groups: GroupData[] = await groupsRes.json();
            console.log("groupsRes", groups);
            groups.forEach((group: GroupData) => {
              permissionOptions.push({
                type: "group",
                code: group.data.groupCode,
                name: group.data.groupName,
                selected: false,
              });
            });
          }

          if (teachersRes.ok) {
            const teachers: TeacherData[] = await teachersRes.json();
            console.log("teachersRes", teachers);
            teachers.forEach((teacher: TeacherData) => {
              permissionOptions.push({
                type: "teacher",
                code: teacher.data.teacherCode,
                name: teacher.data.teacherName,
                selected: false,
              });
            });
          }
        } else if (userType === "teacher") {
          // Teacher can see their classes and other teachers
          const [classesRes, teachersRes] = await Promise.all([
            fetch(
              `/api/admin/teacher-classes?teacherCode=${currentUser.username}&schoolCode=${currentUser.schoolCode}`
            ),
            fetch(
              `/api/admin/teachers/teachers?schoolCode=${currentUser.schoolCode}`
            ),
          ]);

          if (classesRes.ok) {
            const classes: ClassData[] = await classesRes.json();
            classes.forEach((cls: ClassData) => {
              permissionOptions.push({
                type: "class",
                code: cls.data.classCode,
                name: cls.data.className,
                selected: false,
              });
            });
          }

          if (teachersRes.ok) {
            const teachers: TeacherData[] = await teachersRes.json();
            teachers.forEach((teacher: TeacherData) => {
              permissionOptions.push({
                type: "teacher",
                code: teacher.data.teacherCode,
                name: teacher.data.teacherName,
                selected: false,
              });
            });
          }
        }

        // Set existing permissions as selected
        if (item?.permissions) {
          permissionOptions.forEach((option) => {
            const existingPermission = item.permissions?.find(
              (p) => p.type === option.type && p.code === option.code
            );
            if (existingPermission) {
              option.selected = true;
            }
          });
        }

        setOptions(permissionOptions);
      } catch (error) {
        console.error("Error fetching permission options:", error);
        toast.error("خطا در بارگیری گزینه‌های دسترسی");
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [isOpen, currentUser, userType, item]);

  const toggleOption = (index: number) => {
    setOptions((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, selected: !option.selected } : option
      )
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleConfirm = () => {
    const selectedPermissions: Permission[] = options
      .filter((option) => option.selected)
      .map((option) => ({
        type: option.type,
        code: option.code,
        name: option.name,
      }));

    onConfirm(selectedPermissions);
    onClose();
  };

  const selectAll = (type: "class" | "group" | "teacher") => {
    setOptions((prev) =>
      prev.map((option) =>
        option.type === type ? { ...option, selected: true } : option
      )
    );
  };

  const deselectAll = (type: "class" | "group" | "teacher") => {
    setOptions((prev) =>
      prev.map((option) =>
        option.type === type ? { ...option, selected: false } : option
      )
    );
  };

  const groupedOptions = {
    classes: options.filter((opt) => opt.type === "class"),
    groups: options.filter((opt) => opt.type === "group"),
    teachers: options.filter((opt) => opt.type === "teacher"),
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
        dir="rtl"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="h-6 w-6 ml-2 text-blue-600" />
            مدیریت دسترسی - {item.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
              <span className="mr-3 text-gray-500">در حال بارگیری...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                <span className="font-bold">توجه:</span> با انتخاب هر گروه، کلاس
                یا معلم، دسترسی به این{" "}
                {item.type === "folder" ? "پوشه" : "فایل"} به آن‌ها داده خواهد
                شد.
              </div>

              {/* Classes Section */}
              {groupedOptions.classes.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection("classes")}
                  >
                    <h4 className="font-medium text-gray-900 flex items-center">
                      کلاس‌ها ({groupedOptions.classes.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAll("class");
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                      >
                        انتخاب همه
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deselectAll("class");
                        }}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded"
                      >
                        حذف همه
                      </button>
                      {expandedSections.classes ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.classes && (
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {groupedOptions.classes.map((option) => {
                        const actualIndex = options.findIndex(
                          (opt) =>
                            opt.type === option.type && opt.code === option.code
                        );
                        return (
                          <label
                            key={`${option.type}-${option.code}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={option.selected}
                              onChange={() => toggleOption(actualIndex)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 mr-2">
                              {option.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Groups Section */}
              {groupedOptions.groups.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection("groups")}
                  >
                    <h4 className="font-medium text-gray-900 flex items-center">
                      گروه‌ها ({groupedOptions.groups.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAll("group");
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                      >
                        انتخاب همه
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deselectAll("group");
                        }}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded"
                      >
                        حذف همه
                      </button>
                      {expandedSections.groups ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.groups && (
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {groupedOptions.groups.map((option) => {
                        const actualIndex = options.findIndex(
                          (opt) =>
                            opt.type === option.type && opt.code === option.code
                        );
                        return (
                          <label
                            key={`${option.type}-${option.code}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={option.selected}
                              onChange={() => toggleOption(actualIndex)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 mr-2">
                              {option.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Teachers Section */}
              {groupedOptions.teachers.length > 0 && (
                <div className="border border-gray-200 rounded-lg">
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSection("teachers")}
                  >
                    <h4 className="font-medium text-gray-900 flex items-center">
                      معلمان ({groupedOptions.teachers.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAll("teacher");
                        }}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                      >
                        انتخاب همه
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deselectAll("teacher");
                        }}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded"
                      >
                        حذف همه
                      </button>
                      {expandedSections.teachers ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {expandedSections.teachers && (
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {groupedOptions.teachers.map((option) => {
                        const actualIndex = options.findIndex(
                          (opt) =>
                            opt.type === option.type && opt.code === option.code
                        );
                        return (
                          <label
                            key={`${option.type}-${option.code}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={option.selected}
                              onChange={() => toggleOption(actualIndex)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 mr-2">
                              {option.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {options.length === 0 && !loading && (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    هیچ گزینه‌ای برای تنظیم دسترسی موجود نیست
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            تایید دسترسی
          </button>
        </div>
      </div>
    </div>
  );
}

// Creator display component with avatar and name
function CreatorDisplay({
  creatorInfo,
  currentUsername,
}: {
  creatorInfo?: CreatorInfo;
  currentUsername?: string;
}) {
  if (!creatorInfo) {
    return <span className="text-xs text-gray-500">نامشخص</span>;
  }

  const isCurrentUser = creatorInfo.username === currentUsername;
  const displayName = isCurrentUser ? "شما" : creatorInfo.name;

  // Generate a color for the avatar based on username
  const getAvatarColor = (username: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];
    const hash = username.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case "teacher":
        return "👨‍🏫";
      case "student":
        return "👨‍🎓";
      case "school":
        return "🏫";
      default:
        return "👤";
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Avatar */}
      <div className="relative">
        {creatorInfo.avatar ? (
          <img
            src={creatorInfo.avatar}
            alt={displayName}
            className="w-6 h-6 rounded-full object-cover"
            onError={(e) => {
              // Fallback to initials on image error
              const target = e.target as HTMLElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<div class="w-6 h-6 rounded-full ${getAvatarColor(
                  creatorInfo.username
                )} flex items-center justify-center text-white text-xs font-medium">${creatorInfo.name.charAt(
                  0
                )}</div>`;
              }
            }}
          />
        ) : (
          <div
            className={`w-6 h-6 rounded-full ${getAvatarColor(
              creatorInfo.username
            )} flex items-center justify-center text-white text-xs font-medium`}
          >
            {creatorInfo.name.charAt(0)}
          </div>
        )}
        {/* User type indicator */}
        <div className="absolute -bottom-1 -right-1 text-xs">
          {getUserTypeIcon(creatorInfo.userType)}
        </div>
      </div>

      {/* Name */}
      <span className="text-xs text-gray-600 font-medium">{displayName}</span>
    </div>
  );
}

export default function FileExplorerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExplorerItem | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("large-icons");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Load items from current path
  const fetchItems = async () => {
    if (!user?.schoolCode) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/fileexplorer/list?path=${encodeURIComponent(currentPath)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const data = await response.json();
      setItems(data.items);

      // Calculate total size of files
      const files = data.items.filter(
        (item: ExplorerItem) => item.type === "file"
      ) as FileItem[];
      const total = files.reduce(
        (sum: number, file: FileItem) => sum + (file.size || 0),
        0
      );
      setTotalSize(total);
    } catch (error) {
      console.error("Error fetching file explorer items:", error);
      toast.error("خطا در بارگیری فایل‌ها و پوشه‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Create a new folder
  const createFolder = async (folderName: string, password?: string) => {
    if (!user?.schoolCode || !folderName.trim()) return;

    try {
      const response = await fetch("/api/fileexplorer/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName.trim(),
          path: currentPath,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      toast.success(`پوشه "${folderName}" با موفقیت ایجاد شد`);
      fetchItems(); // Refresh the file list
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("خطا در ایجاد پوشه");
    }
  };

  // Delete file or folder
  const deleteItem = async () => {
    if (!selectedItem) return;

    try {
      const endpoint =
        selectedItem.type === "folder"
          ? "/api/fileexplorer/folder"
          : "/api/fileexplorer/file";

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem._id,
          path: selectedItem.path,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete ${selectedItem.type}`);
      }

      toast.success(
        `${selectedItem.type === "folder" ? "پوشه" : "فایل"} با موفقیت حذف شد`
      );
      fetchItems(); // Refresh the file list
    } catch (error) {
      console.error(`Error deleting ${selectedItem.type}:`, error);
      toast.error(
        `خطا در حذف ${selectedItem.type === "folder" ? "پوشه" : "فایل"}`
      );
    }
  };

  // Rename file or folder
  const renameItem = async (newName: string) => {
    if (!selectedItem || !newName.trim()) return;

    try {
      const endpoint =
        selectedItem.type === "folder"
          ? "/api/fileexplorer/folder/rename"
          : "/api/fileexplorer/file/rename";

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem._id,
          newName: newName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to rename ${selectedItem.type}`);
      }

      toast.success(
        `نام ${
          selectedItem.type === "folder" ? "پوشه" : "فایل"
        } با موفقیت تغییر کرد`
      );
      fetchItems(); // Refresh the file list
    } catch (error) {
      console.error(`Error renaming ${selectedItem.type}:`, error);
      toast.error(
        `خطا در تغییر نام ${selectedItem.type === "folder" ? "پوشه" : "فایل"}`
      );
    }
  };

  // Handle folder navigation
  const navigateToFolder = (folder: FolderItem) => {
    // Check if folder has a password
    if (folder.password) {
      setSelectedItem(folder);
      setShowPasswordModal(true);
      return;
    }

    // No password, proceed with navigation
    enterFolder(folder);
  };

  // Enter a folder after password validation if needed
  const enterFolder = (folder: FolderItem) => {
    setPathHistory([...pathHistory, currentPath]);
    const newPath = folder.path ? `${folder.path}/${folder.name}` : folder.name;
    setCurrentPath(newPath);
  };

  // Verify folder password
  const verifyFolderPassword = (password: string) => {
    if (!selectedItem || selectedItem.type !== "folder") return;

    const folder = selectedItem as FolderItem;

    // Simple comparison - password is stored as plain text
    if (password === folder.password) {
      // Password is correct, enter the folder
      enterFolder(folder);
      setShowPasswordModal(false);
    } else {
      // Wrong password, show error via the password modal's state
      toast.error("رمز عبور اشتباه است");
    }
  };

  // Handle navigation back
  const navigateBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user?.schoolCode)
      return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("path", currentPath);

      // Append all files
      Array.from(e.target.files).forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          toast.success("فایل‌ها با موفقیت آپلود شدند");
          fetchItems(); // Refresh list after upload
        } else {
          toast.error("خطا در آپلود فایل‌ها");
        }
        setUploading(false);
        setUploadProgress(0);
      });

      // Handle error
      xhr.addEventListener("error", () => {
        toast.error("خطا در ارتباط با سرور");
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.open("POST", "/api/fileexplorer/upload");
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("خطا در آپلود فایل‌ها");
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Download a file
  const downloadFile = (file: FileItem) => {
    // Check if publicUrl is available
    if (file.publicUrl) {
      window.open(file.publicUrl, "_blank");
    } else {
      // Create a download URL based on the file path
      const downloadUrl = `/api/fileexplorer/download?id=${file._id}`;
      window.open(downloadUrl, "_blank");
    }
  };

  // Show delete confirmation
  const confirmDelete = (item: ExplorerItem) => {
    // Only school users can delete all files
    // Teachers and students can only delete their own files
    if (
      !user ||
      (user.userType !== "school" && item.username !== user.username)
    ) {
      toast.error("شما فقط مجاز به حذف فایل‌های خود هستید");
      return;
    }

    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  // Handle permission changes
  const handlePermissionChange = async (permissions: Permission[]) => {
    if (!selectedItem) return;

    try {
      const endpoint =
        selectedItem.type === "folder"
          ? "/api/fileexplorer/folder/permissions"
          : "/api/fileexplorer/file/permissions";

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedItem._id,
          permissions: permissions,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update permissions for ${selectedItem.type}`
        );
      }

      toast.success("دسترسی‌ها با موفقیت به‌روزرسانی شد");
      fetchItems(); // Refresh the file list
    } catch (error) {
      console.error(
        `Error updating permissions for ${selectedItem?.type}:`,
        error
      );
      toast.error("خطا در به‌روزرسانی دسترسی‌ها");
    }
  };

  // Show permission modal
  const showPermissions = (item: ExplorerItem) => {
    // Only school users can manage permissions for all files
    // Teachers and students can only manage permissions for their own files
    if (user?.userType === "student" && item.username !== user.username) {
      toast.error("شما فقط مجاز به تغییر دسترسی فایل‌های خود هستید");
      return;
    }

    if (user?.userType === "teacher" && item.username !== user.username) {
      toast.error("شما فقط مجاز به تغییر دسترسی فایل‌های خود هستید");
      return;
    }

    setSelectedItem(item);
    setShowPermissionModal(true);
  };

  // Show rename modal - with ownership check
  const showRename = (item: ExplorerItem) => {
    // Only school users can rename all files
    // Teachers and students can only rename their own files
    if (user?.userType !== "school" && item.username !== user?.username) {
      toast.error("شما فقط مجاز به تغییر نام فایل‌های خود هستید");
      return;
    }

    setSelectedItem(item);
    setShowRenameModal(true);
  };

  // Helper function to check if user can modify item
  const canModifyItem = (item: ExplorerItem) => {
    if (!user) return false;
    return user.userType === "school" || item.username === user.username;
  };

  // Initial data load
  useEffect(() => {
    if (!authLoading && user) {
      fetchItems();
    }
  }, [user, authLoading, currentPath]);

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    else if (bytes < 1024 * 1024 * 1024)
      return (bytes / (1024 * 1024)).toFixed(2) + " MB";
    else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  // Helper to get file extension from a file name
  const getFileExtension = (filename: string): string => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  // Helper to get file icon based on extension
  const getFileIcon = (
    extension: string | undefined,
    size: "small" | "medium" | "large" = "small"
  ) => {
    const iconClass =
      size === "large"
        ? "h-16 w-16"
        : size === "medium"
        ? "h-12 w-12"
        : "h-6 w-6";

    // Different icons based on file type
    switch (extension?.toLowerCase()) {
      case "pdf":
        return <DocumentIcon className={`${iconClass} text-red-500`} />;
      case "doc":
      case "docx":
        return <DocumentIcon className={`${iconClass} text-blue-600`} />;
      case "xls":
      case "xlsx":
        return <DocumentIcon className={`${iconClass} text-green-600`} />;
      case "ppt":
      case "pptx":
        return <DocumentIcon className={`${iconClass} text-orange-500`} />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <DocumentIcon className={`${iconClass} text-purple-500`} />;
      default:
        return <DocumentIcon className={`${iconClass} text-blue-500`} />;
    }
  };

  const getFolderIcon = (
    size: "small" | "medium" | "large" = "small",
    hasPassword: boolean = false
  ) => {
    const iconClass =
      size === "large"
        ? "h-16 w-16"
        : size === "medium"
        ? "h-12 w-12"
        : "h-6 w-6";
    const iconElement = (
      <FolderIcon className={`${iconClass} text-yellow-500`} />
    );

    if (hasPassword && size === "large") {
      return (
        <div className="relative">
          {iconElement}
          <LockClosedIcon className="absolute -bottom-1 -right-1 h-6 w-6 text-gray-600 bg-white rounded-full p-1" />
        </div>
      );
    }

    return iconElement;
  };

  const handleItemClick = (item: ExplorerItem, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      setSelectedItems((prev) =>
        prev.includes(item._id)
          ? prev.filter((id) => id !== item._id)
          : [...prev, item._id]
      );
    } else {
      // Single select
      setSelectedItems([item._id]);
    }
  };

  const handleItemDoubleClick = (item: ExplorerItem) => {
    if (item.type === "folder") {
      navigateToFolder(item as FolderItem);
    } else {
      downloadFile(item as FileItem);
    }
  };

  const renderViewModeSelector = () => (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => setViewMode("large-icons")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "large-icons"
            ? "bg-blue-100 text-blue-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
        title="آیکون‌های بزرگ"
      >
        <Squares2X2Icon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode("medium-icons")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "medium-icons"
            ? "bg-blue-100 text-blue-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
        title="آیکون‌های متوسط"
      >
        <ViewColumnsIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "list"
            ? "bg-blue-100 text-blue-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
        title="لیست"
      >
        <ListBulletIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode("details")}
        className={`p-2 rounded-md transition-colors ${
          viewMode === "details"
            ? "bg-blue-100 text-blue-600"
            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        }`}
        title="جزئیات"
      >
        <TableCellsIcon className="h-5 w-5" />
      </button>
    </div>
  );

  if (authLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-lg text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Breadcrumb navigation
  const renderBreadcrumbs = () => {
    if (!currentPath) return <span className="font-medium">فایل‌های من</span>;

    const segments = currentPath.split("/").filter(Boolean);
    return (
      <div className="flex items-center flex-wrap">
        <button
          onClick={() => {
            setPathHistory([]);
            setCurrentPath("");
          }}
          className="font-medium text-blue-600 hover:text-blue-800"
        >
          فایل‌های من
        </button>

        {segments.map((segment, i) => {
          const path = segments.slice(0, i + 1).join("/");
          return (
            <div key={i} className="flex items-center">
              <ChevronLeftIcon className="h-4 w-4 mx-1 text-gray-400" />
              <button
                onClick={() => {
                  setPathHistory(
                    segments
                      .slice(0, i)
                      .map((_, idx) => segments.slice(0, idx).join("/"))
                  );
                  setCurrentPath(path);
                }}
                className={`font-medium ${
                  i === segments.length - 1
                    ? "text-gray-800"
                    : "text-blue-600 hover:text-blue-800"
                }`}
              >
                {segment}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4" dir="rtl">
      <div className="mb-6">
        {/* <h1 className="text-2xl font-bold text-gray-900 mb-2">
          مدیریت فایل‌ها و پوشه‌ها
        </h1> */}

        <PageHeader
          title="  مدیریت فایل‌ها و پوشه‌ها"
          subtitle="  مدیریت فایل‌ها و پوشه‌ها"
          icon={<AcademicCapIcon className="w-6 h-6" />}
          gradient={true}
        />

        {/* Add user-specific message */}
        {user && user.userType === "student" && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
            <p className="text-sm text-amber-700">
              <span className="font-bold ml-1">توجه:</span>
              شما به عنوان دانش‌آموز فقط مجاز به مشاهده و دانلود فایل‌ها هستید.
              امکان آپلود فایل یا ایجاد پوشه برای شما وجود ندارد.
            </p>
          </div>
        )}

        {/* {user &&
          (user.userType === "school" || user.userType === "teacher") && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                <span className="font-bold ml-1">توجه:</span>
                در این صفحه فقط فایل‌ها و پوشه‌هایی که توسط شما آپلود شده‌اند
                قابل مشاهده هستند.
              </p>
            </div>
          )} */}

        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-gray-500 mb-4 overflow-x-auto">
          {renderBreadcrumbs()}
        </div>

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Only show create folder and upload buttons for teachers and school users */}
          {user &&
            (user.userType === "teacher" || user.userType === "school") && (
              <>
                <button
                  onClick={() => setShowCreateFolder(true)}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <FolderPlusIcon className="h-5 w-5 ml-2 text-gray-500" />
                  ایجاد پوشه جدید
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  disabled={uploading}
                >
                  {uploading ? (
                    <ArrowPathIcon className="h-5 w-5 ml-2 text-gray-500 animate-spin" />
                  ) : (
                    <ArrowUpTrayIcon className="h-5 w-5 ml-2 text-gray-500" />
                  )}
                  آپلود فایل
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  multiple
                />
              </>
            )}

          {currentPath && (
            <button
              onClick={navigateBack}
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-5 w-5 ml-2 text-gray-500" />
              بازگشت
            </button>
          )}

          {/* View mode selector */}
          <div className="mr-auto">{renderViewModeSelector()}</div>

          {/* File info */}
          <div className="flex items-center">
            <span className="text-sm text-gray-500">مجموع:</span>
            <span className="mr-1 text-sm font-medium text-blue-600">
              {formatFileSize(totalSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              در حال آپلود فایل‌ها{" "}
              {currentPath
                ? `به پوشه "${currentPath.split("/").pop()}"`
                : "به پوشه اصلی"}
              ...
            </span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* File explorer content */}
      <div className="bg-white rounded-b-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <span className="ml-3 text-gray-500">در حال بارگذاری...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {currentPath
                ? `پوشه "${currentPath.split("/").pop()}" خالی است`
                : "پوشه اصلی خالی است"}
            </h3>
            {user?.userType === "student" ? (
              <p className="mt-1 text-sm text-gray-500">
                هیچ فایل یا پوشه‌ای در این قسمت موجود نیست.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-gray-500">
                  برای شروع، یک پوشه ایجاد کنید یا فایلی را آپلود نمایید.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setShowCreateFolder(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <FolderPlusIcon className="h-5 w-5 ml-1.5" />
                    ایجاد پوشه
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5 ml-1.5" />
                    آپلود فایل {currentPath ? `در اینجا` : ""}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : viewMode === "details" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    نام
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    نوع
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    اندازه
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    تاریخ ایجاد
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Folders first */}
                {items
                  .filter((item) => item.type === "folder")
                  .map((folder) => (
                    <tr key={folder._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-blue-50"
                        onClick={() => navigateToFolder(folder as FolderItem)}
                        title="باز کردن پوشه"
                      >
                        <div className="flex items-center">
                          <FolderIcon className="flex-shrink-0 h-6 w-6 text-yellow-500" />
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900 hover:text-blue-600 flex items-center">
                              {folder.name}
                              {(folder as FolderItem).password && (
                                <LockClosedIcon
                                  className="h-4 w-4 text-gray-600 ml-1"
                                  title="پوشه محافظت شده با رمز عبور"
                                />
                              )}
                              <ChevronRightIcon className="inline-block h-4 w-4 text-gray-400 transform rotate-180 mr-1" />
                            </div>
                            {/* Creator label */}
                            <div className="text-xs text-gray-500 mt-1">
                              ایجادکننده:{" "}
                              <CreatorDisplay
                                creatorInfo={folder.creatorInfo}
                                currentUsername={user?.username}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">پوشه</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">-</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(folder.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex gap-3 justify-end">
                          {/* Permission button - only for school users or file owners */}
                          {(user?.userType === "school" ||
                            (user?.userType === "teacher" &&
                              canModifyItem(folder))) && (
                            <button
                              onClick={() => showPermissions(folder)}
                              className="text-purple-600 hover:text-purple-900"
                              title="مدیریت دسترسی"
                            >
                              <UserGroupIcon className="h-5 w-5" />
                            </button>
                          )}
                          {/* Rename button - only for owners or school admin */}
                          {canModifyItem(folder) && (
                            <button
                              onClick={() => showRename(folder)}
                              className="text-blue-600 hover:text-blue-900"
                              title="تغییر نام"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                          {/* Delete button - only for owners or school admin */}
                          {canModifyItem(folder) && (
                            <button
                              onClick={() => confirmDelete(folder)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Then files */}
                {items
                  .filter((item) => item.type === "file")
                  .map((file) => (
                    <tr key={file._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(
                            getFileExtension((file as FileItem).name)
                          )}
                          <div className="mr-3">
                            <div className="text-sm font-medium text-gray-900">
                              {file.name}
                            </div>
                            {/* Creator label */}
                            <div className="text-xs text-gray-500 mt-1">
                              ایجادکننده:{" "}
                              <CreatorDisplay
                                creatorInfo={file.creatorInfo}
                                currentUsername={user?.username}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {getFileExtension(file.name)?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatFileSize((file as FileItem).size)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.createdAt).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <div className="flex gap-3 justify-end">
                          {/* Permission button - only for school users or file owners */}
                          {(user?.userType === "school" ||
                            (user?.userType === "teacher" &&
                              canModifyItem(file))) && (
                            <button
                              onClick={() => showPermissions(file)}
                              className="text-purple-600 hover:text-purple-900"
                              title="مدیریت دسترسی"
                            >
                              <UserGroupIcon className="h-5 w-5" />
                            </button>
                          )}
                          {/* Download button - available for all */}
                          <button
                            onClick={() => downloadFile(file as FileItem)}
                            className="text-blue-600 hover:text-blue-900"
                            title="دانلود"
                          >
                            <FolderArrowDownIcon className="h-5 w-5" />
                          </button>
                          {/* Share button - only for owners or school admin */}
                          {canModifyItem(file) && (
                            <button
                              onClick={() => {
                                setSelectedItem(file);
                                setShowShareModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="اشتراک‌گذاری"
                            >
                              <ShareIcon className="h-5 w-5" />
                            </button>
                          )}
                          {/* Delete button - only for owners or school admin */}
                          {canModifyItem(file) && (
                            <button
                              onClick={() => confirmDelete(file)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            {/* Windows-style grid layout */}
            <div
              className={`grid gap-4 ${
                viewMode === "large-icons"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8"
                  : viewMode === "medium-icons"
                  ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
                  : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16"
              }`}
            >
              {/* Folders first */}
              {items
                .filter((item) => item.type === "folder")
                .map((folder) => (
                  <div
                    key={folder._id}
                    className={`group relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedItems.includes(folder._id)
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : "hover:bg-gray-50"
                    } rounded-lg p-3 flex flex-col items-center text-center ${
                      viewMode === "large-icons"
                        ? "min-h-[120px]"
                        : viewMode === "medium-icons"
                        ? "min-h-[100px]"
                        : "min-h-[80px]"
                    }`}
                    onClick={(e) => handleItemClick(folder, e)}
                    onDoubleClick={() => handleItemDoubleClick(folder)}
                    title={folder.name}
                  >
                    {/* Folder Icon */}
                    <div className="mb-2 relative">
                      {getFolderIcon(
                        viewMode === "large-icons"
                          ? "large"
                          : viewMode === "medium-icons"
                          ? "medium"
                          : "small",
                        !!(folder as FolderItem).password
                      )}
                    </div>

                    {/* Folder Name */}
                    <div
                      className={`${
                        viewMode === "large-icons"
                          ? "text-sm"
                          : viewMode === "medium-icons"
                          ? "text-xs"
                          : "text-xs"
                      } font-medium text-gray-900 break-words w-full`}
                    >
                      {folder.name.length >
                      (viewMode === "large-icons" ? 15 : 12)
                        ? `${folder.name.substring(
                            0,
                            viewMode === "large-icons" ? 15 : 12
                          )}...`
                        : folder.name}
                    </div>

                    {/* Creator info - only for large icons */}
                    {viewMode === "large-icons" && (
                      <div className="text-xs text-gray-500 mt-1 truncate w-full">
                        <CreatorDisplay
                          creatorInfo={folder.creatorInfo}
                          currentUsername={user?.username}
                        />
                      </div>
                    )}

                    {/* Context menu button */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {/* Permission button */}
                        {(user?.userType === "school" ||
                          (user?.userType === "teacher" &&
                            canModifyItem(folder))) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showPermissions(folder);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="مدیریت دسترسی"
                          >
                            <UserGroupIcon className="h-4 w-4 text-purple-600" />
                          </button>
                        )}

                        {/* Rename button */}
                        {canModifyItem(folder) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showRename(folder);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="تغییر نام"
                          >
                            <PencilIcon className="h-4 w-4 text-blue-600" />
                          </button>
                        )}

                        {/* Delete button */}
                        {canModifyItem(folder) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(folder);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="حذف"
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Then files */}
              {items
                .filter((item) => item.type === "file")
                .map((file) => (
                  <div
                    key={file._id}
                    className={`group relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedItems.includes(file._id)
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : "hover:bg-gray-50"
                    } rounded-lg p-3 flex flex-col items-center text-center ${
                      viewMode === "large-icons"
                        ? "min-h-[120px]"
                        : viewMode === "medium-icons"
                        ? "min-h-[100px]"
                        : "min-h-[80px]"
                    }`}
                    onClick={(e) => handleItemClick(file, e)}
                    onDoubleClick={() => handleItemDoubleClick(file)}
                    title={file.name}
                  >
                    {/* File Icon */}
                    <div className="mb-2">
                      {getFileIcon(
                        getFileExtension((file as FileItem).name),
                        viewMode === "large-icons"
                          ? "large"
                          : viewMode === "medium-icons"
                          ? "medium"
                          : "small"
                      )}
                    </div>

                    {/* File Name */}
                    <div
                      className={`${
                        viewMode === "large-icons"
                          ? "text-sm"
                          : viewMode === "medium-icons"
                          ? "text-xs"
                          : "text-xs"
                      } font-medium text-gray-900 break-words w-full`}
                    >
                      {file.name.length > (viewMode === "large-icons" ? 15 : 12)
                        ? `${file.name.substring(
                            0,
                            viewMode === "large-icons" ? 15 : 12
                          )}...`
                        : file.name}
                    </div>

                    {/* File size - only for large icons */}
                    {viewMode === "large-icons" && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize((file as FileItem).size)}
                      </div>
                    )}

                    {/* Creator info - only for large icons */}
                    {viewMode === "large-icons" && (
                      <div className="text-xs text-gray-500 mt-1 truncate w-full">
                        <CreatorDisplay
                          creatorInfo={file.creatorInfo}
                          currentUsername={user?.username}
                        />
                      </div>
                    )}

                    {/* Context menu button */}
                    <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {/* Permission button */}
                        {(user?.userType === "school" ||
                          (user?.userType === "teacher" &&
                            canModifyItem(file))) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              showPermissions(file);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="مدیریت دسترسی"
                          >
                            <UserGroupIcon className="h-4 w-4 text-purple-600" />
                          </button>
                        )}

                        {/* Download button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(file as FileItem);
                          }}
                          className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                          title="دانلود"
                        >
                          <FolderArrowDownIcon className="h-4 w-4 text-blue-600" />
                        </button>

                        {/* Share button */}
                        {canModifyItem(file) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(file);
                              setShowShareModal(true);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="اشتراک‌گذاری"
                          >
                            <ShareIcon className="h-4 w-4 text-green-600" />
                          </button>
                        )}

                        {/* Delete button */}
                        {canModifyItem(file) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(file);
                            }}
                            className="p-1 bg-white rounded shadow-md hover:bg-gray-50"
                            title="حذف"
                          >
                            <TrashIcon className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Create folder modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={createFolder}
        currentPath={currentPath}
      />

      {/* Delete  confirmation modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteItem}
        item={selectedItem}
      />

      {/* Rename modal */}
      <RenameModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onConfirm={renameItem}
        item={selectedItem}
      />

      {/* Password modal */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={verifyFolderPassword}
        folderName={selectedItem?.name || ""}
      />

      {/* Share modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        file={selectedItem?.type === "file" ? (selectedItem as FileItem) : null}
      />

      {/* Permission modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onConfirm={handlePermissionChange}
        item={selectedItem}
        userType={user?.userType || ""}
        currentUser={
          user
            ? {
                schoolCode: user.schoolCode,
                username: user.username,
                userType: user.userType,
              }
            : null
        }
      />
    </div>
  );
}

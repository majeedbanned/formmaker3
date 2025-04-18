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
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

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
}

interface FolderItem {
  _id: string;
  type: "folder";
  name: string;
  path: string;
  createdAt: string;
}

type ExplorerItem = FileItem | FolderItem;

// Create modal component
function CreateFolderModal({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  currentPath: string;
}) {
  const [folderName, setFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    setFolderName("");
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
                onConfirm(folderName);
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

export default function FileExplorerPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExplorerItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    } catch (error) {
      console.error("Error fetching file explorer items:", error);
      toast.error("خطا در بارگیری فایل‌ها و پوشه‌ها");
    } finally {
      setLoading(false);
    }
  };

  // Create a new folder
  const createFolder = async (folderName: string) => {
    if (!user?.schoolCode || !folderName.trim()) return;

    try {
      const response = await fetch("/api/fileexplorer/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folderName.trim(),
          path: currentPath,
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

  // Handle folder navigation
  const navigateToFolder = (folder: FolderItem) => {
    setPathHistory([...pathHistory, currentPath]);
    const newPath = folder.path ? `${folder.path}/${folder.name}` : folder.name;
    setCurrentPath(newPath);
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
    setSelectedItem(item);
    setShowDeleteConfirm(true);
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
  const getFileIcon = (extension: string | undefined) => {
    // Different icons based on file type
    switch (extension?.toLowerCase()) {
      case "pdf":
        return <DocumentIcon className="h-6 w-6 text-red-500" />;
      case "doc":
      case "docx":
        return <DocumentIcon className="h-6 w-6 text-blue-600" />;
      case "xls":
      case "xlsx":
        return <DocumentIcon className="h-6 w-6 text-green-600" />;
      case "ppt":
      case "pptx":
        return <DocumentIcon className="h-6 w-6 text-orange-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <DocumentIcon className="h-6 w-6 text-purple-500" />;
      default:
        return <DocumentIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  if (authLoading) {
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
              <ChevronRightIcon className="h-4 w-4 mx-1 text-gray-400" />
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
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">مدیریت فایل‌ها</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title={`ایجاد پوشه در: ${currentPath || "پوشه اصلی"}`}
            >
              <FolderPlusIcon className="h-5 w-5 ml-1.5" />
              ایجاد پوشه
              {currentPath ? ` در ${currentPath.split("/").pop()}` : ""}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={uploading}
              title={`آپلود فایل به: ${currentPath || "پوشه اصلی"}`}
            >
              {uploading ? (
                <ArrowPathIcon className="h-5 w-5 ml-1.5 animate-spin" />
              ) : (
                <ArrowUpTrayIcon className="h-5 w-5 ml-1.5" />
              )}
              آپلود فایل{" "}
              {currentPath ? `در ${currentPath.split("/").pop()}` : ""}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </div>
        </div>

        {/* Breadcrumb and actions */}
        <div className="bg-white rounded-t-lg shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center">
            {currentPath && (
              <button
                onClick={navigateBack}
                className="ml-2 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                title="بازگشت"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            )}
            <div className="text-gray-600">{renderBreadcrumbs()}</div>
          </div>
          <div className="flex items-center">
            <div className="ml-2 text-xs text-gray-500 hidden sm:block">
              <span title="راهنما">
                برای ورود به پوشه‌ها، روی نام پوشه کلیک کنید
              </span>
            </div>
            <button
              onClick={fetchItems}
              className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
              title="بارگذاری مجدد"
            >
              <ArrowPathIcon
                className={`h-5 w-5 text-gray-600 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
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
            </div>
          ) : (
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
                                <ChevronRightIcon className="inline-block h-4 w-4 text-gray-400 transform rotate-180 mr-1" />
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
                          {new Date(folder.createdAt).toLocaleDateString(
                            "fa-IR"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                          <button
                            onClick={() => confirmDelete(folder)}
                            className="text-red-600 hover:text-red-900"
                            title="حذف"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
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
                            <button
                              onClick={() => downloadFile(file as FileItem)}
                              className="text-blue-600 hover:text-blue-900"
                              title="دانلود"
                            >
                              <FolderArrowDownIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => confirmDelete(file)}
                              className="text-red-600 hover:text-red-900"
                              title="حذف"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create folder modal */}
      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onConfirm={createFolder}
        currentPath={currentPath}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteItem}
        item={selectedItem}
      />
    </main>
  );
}

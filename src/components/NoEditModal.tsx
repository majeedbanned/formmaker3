import React from "react";
import { ModuleEditModalProps } from "@/types/modules";

const NoEditModal: React.FC<ModuleEditModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">ویرایش در دسترس نیست</h3>
        <p className="text-gray-600 mb-4">این ماژول قابلیت ویرایش ندارد.</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          بستن
        </button>
      </div>
    </div>
  );
};

export default NoEditModal;

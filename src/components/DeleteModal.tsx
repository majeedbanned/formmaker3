import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { DeleteModalProps } from "../types/crud";

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  layout = { direction: "ltr" },
}: DeleteModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all"
                dir={layout.direction}
              >
                <Dialog.Title
                  as="h3"
                  className={`text-lg font-medium leading-6 text-gray-900 mb-4 text-${
                    layout.direction === "rtl" ? "right" : "left"
                  }`}
                >
                  Delete Confirmation
                </Dialog.Title>

                <div
                  className={`mt-2 text-${
                    layout.direction === "rtl" ? "right" : "left"
                  }`}
                >
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this item? This action
                    cannot be undone.
                  </p>
                </div>

                <div
                  className={`mt-4 flex justify-end space-x-2 ${
                    layout.direction === "rtl" ? "flex-row-reverse" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Delete"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { AdvancedSearchModalProps } from "../types/crud";

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSubmit,
  onClear,
  formStructure,
  initialValues,
  layout = { direction: "ltr" },
}: AdvancedSearchModalProps) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialValues,
  });

  // Reset form with initial values when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(initialValues);
    }
  }, [isOpen, reset, initialValues]);

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
                  Advanced Search
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {formStructure
                    .filter((field) => field.visible && field.isSearchable)
                    .map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label
                          htmlFor={field.name}
                          className={`block text-sm font-medium text-gray-700 text-${
                            layout.direction === "rtl" ? "right" : "left"
                          }`}
                        >
                          {field.title}
                        </label>

                        {field.type === "dropdown" ? (
                          <select
                            {...register(field.name)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-${
                              layout.direction === "rtl" ? "right" : "left"
                            }`}
                            dir={layout.direction}
                          >
                            <option value="">All</option>
                            {field.options?.map((option) => (
                              <option
                                key={String(option.value)}
                                value={String(option.value)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <div
                            className={`flex items-center ${
                              layout.direction === "rtl"
                                ? "flex-row-reverse justify-end"
                                : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              {...register(field.name)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                        ) : (
                          <input
                            type={field.type}
                            {...register(field.name)}
                            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-${
                              layout.direction === "rtl" ? "right" : "left"
                            }`}
                            dir={layout.direction}
                          />
                        )}
                      </div>
                    ))}

                  <div
                    className={`mt-4 flex justify-end space-x-2 ${
                      layout.direction === "rtl" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClear();
                        onClose();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Apply Filters
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

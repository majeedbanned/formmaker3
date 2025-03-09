import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormModalProps, FormField, ValidationRules } from "../types/crud";

export default function FormModal({
  isOpen,
  onClose,
  onSubmit,
  formStructure,
  editingId,
  loading,
}: FormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Reset form when modal opens/closes or when editingId changes
  useEffect(() => {
    if (!isOpen) {
      reset();
    } else if (!editingId) {
      // When adding new entry, set default values
      const defaultValues = formStructure.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.defaultValue,
        }),
        {}
      );
      reset(defaultValues);
    }
  }, [isOpen, reset, editingId, formStructure]);

  // Set initial values when editing
  useEffect(() => {
    if (editingId && isOpen && window.__EDITING_ENTITY_DATA__) {
      reset(window.__EDITING_ENTITY_DATA__);
    }
  }, [editingId, isOpen, reset]);

  const getValidationRules = (field: FormField): ValidationRules => {
    const rules: ValidationRules = {};

    if (field.required) {
      rules.required =
        field.validation?.requiredMessage || "This field is required";
    }

    if (field.validation?.regex) {
      rules.pattern = {
        value: new RegExp(field.validation.regex),
        message: field.validation.validationMessage || "Invalid format",
      };
    }

    return rules;
  };

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {editingId ? "Edit Entry" : "Add New Entry"}
                </Dialog.Title>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {formStructure.map((field) => {
                    if (!field.visible) return null;

                    const isDisabled = Boolean(
                      !field.enabled || (editingId && field.readonly)
                    );
                    const registration = register(
                      field.name,
                      getValidationRules(field)
                    );

                    return (
                      <div key={field.name} className="space-y-2">
                        <label
                          htmlFor={field.name}
                          className="block text-sm font-medium text-gray-700"
                        >
                          {field.title}
                          {field.required && (
                            <span className="text-red-500">*</span>
                          )}
                          {isDisabled && (
                            <span className="text-gray-500 text-xs ml-1">
                              (Read-only)
                            </span>
                          )}
                        </label>

                        {field.type === "dropdown" ? (
                          <select
                            {...registration}
                            disabled={isDisabled}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                          >
                            <option value="">Select an option</option>
                            {field.options?.map((option) => (
                              <option
                                key={String(option.value)}
                                value={String(option.value)}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "textarea" ? (
                          <textarea
                            {...registration}
                            disabled={isDisabled}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                            rows={4}
                          />
                        ) : field.type === "checkbox" ? (
                          <input
                            type="checkbox"
                            {...registration}
                            disabled={isDisabled}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        ) : (
                          <input
                            type={field.type}
                            {...registration}
                            disabled={isDisabled}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                          />
                        )}

                        {errors[field.name] && (
                          <p className="text-red-500 text-sm">
                            {errors[field.name]?.message as string}
                          </p>
                        )}
                      </div>
                    );
                  })}

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {loading
                        ? "Processing..."
                        : editingId
                        ? "Update"
                        : "Create"}
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

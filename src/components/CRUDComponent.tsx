import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import {
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface FieldValidation {
  regex?: string;
  requiredMessage?: string;
  validationMessage?: string;
}

interface FormField {
  name: string;
  title: string;
  type: string;
  required: boolean;
  defaultValue?: unknown;
  validation?: FieldValidation;
  enabled: boolean;
  visible: boolean;
  options?: { label: string; value: unknown }[];
}

interface Entity {
  _id: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CRUDComponentProps {
  formStructure: FormField[];
  collectionName: string;
  connectionString: string;
}

interface ValidationRules {
  required?: string;
  pattern?: {
    value: RegExp;
    message: string;
  };
}

export default function CRUDComponent({
  formStructure,
  collectionName,
  connectionString,
}: CRUDComponentProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState<Record<string, unknown>>(
    {}
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  const {
    register: registerSearch,
    handleSubmit: handleSubmitSearch,
    reset: resetSearch,
  } = useForm();

  useEffect(() => {
    fetchEntities();
  }, [searchQuery, advancedSearch]);

  const fetchEntities = async () => {
    try {
      setLoading(true);

      // Build the URL with search parameters
      const url = new URL(
        `/api/crud/${collectionName}`,
        window.location.origin
      );

      // Add search parameters
      if (searchQuery) {
        url.searchParams.set("query", searchQuery);
      }

      if (Object.keys(advancedSearch).length > 0) {
        url.searchParams.set("filters", JSON.stringify(advancedSearch));
      }

      const response = await fetch(url, {
        headers: {
          "x-mongodb-connection": connectionString,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch entities");

      const data = await response.json();
      setEntities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch entities");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedSearch = (data: Record<string, unknown>) => {
    // Remove empty values from search criteria
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);

    setAdvancedSearch(cleanedData);
    setIsSearchModalOpen(false);
  };

  const clearAdvancedSearch = () => {
    setAdvancedSearch({});
    resetSearch();
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      setLoading(true);
      const url = `/api/crud/${collectionName}`;
      const method = editingId ? "PUT" : "POST";
      const body = {
        connectionString,
        data,
        ...(editingId && { id: editingId }),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok)
        throw new Error(`Failed to ${editingId ? "update" : "create"} entity`);

      await fetchEntities();
      reset();
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/crud/${collectionName}?id=${deleteId}`,
        {
          method: "DELETE",
          headers: {
            "x-mongodb-connection": connectionString,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to delete entity");

      await fetchEntities();
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entity");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entity: Entity) => {
    setEditingId(entity._id);
    const entityData = entity.data;

    Object.entries(entityData).forEach(([key, value]) => {
      setValue(key, value);
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    reset();
    setIsModalOpen(true);
  };

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
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search all fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Advanced Search
          </button>
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Add New
          </button>
        </div>

        {Object.keys(advancedSearch).length > 0 && (
          <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Advanced search filters applied (
              {Object.keys(advancedSearch).length})
            </div>
            <button
              onClick={clearAdvancedSearch}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear filters
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {entities.map((entity) => (
          <div
            key={entity._id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div className="space-y-2">
              {Object.entries(entity.data).map(([key, value]) => (
                <div key={key}>
                  <span className="font-medium">
                    {formStructure.find((f) => f.name === key)?.title || key}:{" "}
                  </span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(entity)}
                className="text-blue-600 hover:text-blue-800"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setDeleteId(entity._id);
                  setIsDeleteModalOpen(true);
                }}
                className="text-red-600 hover:text-red-800"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}

        {!loading && entities.length === 0 && (
          <div className="text-center py-8 text-gray-500">No results found</div>
        )}
      </div>

      {/* Form Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsModalOpen(false)}
        >
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
                          </label>

                          {field.type === "dropdown" ? (
                            <select
                              {...register(
                                field.name,
                                getValidationRules(field)
                              )}
                              disabled={!field.enabled}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                              {...register(
                                field.name,
                                getValidationRules(field)
                              )}
                              disabled={!field.enabled}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              rows={4}
                            />
                          ) : (
                            <input
                              type={field.type}
                              {...register(
                                field.name,
                                getValidationRules(field)
                              )}
                              disabled={!field.enabled}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                        onClick={() => setIsModalOpen(false)}
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

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsDeleteModalOpen(false)}
        >
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
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Confirm Delete
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete this item? This action
                      cannot be undone.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Advanced Search Modal */}
      <Transition appear show={isSearchModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsSearchModalOpen(false)}
        >
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
                    Advanced Search
                  </Dialog.Title>

                  <form
                    onSubmit={handleSubmitSearch(handleAdvancedSearch)}
                    className="space-y-4"
                  >
                    {formStructure.map((field) => {
                      if (!field.visible) return null;

                      return (
                        <div key={field.name} className="space-y-2">
                          <label
                            htmlFor={field.name}
                            className="block text-sm font-medium text-gray-700"
                          >
                            {field.title}
                          </label>

                          {field.type === "dropdown" ? (
                            <select
                              {...registerSearch(field.name)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="">Any</option>
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
                            <select
                              {...registerSearch(field.name)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="">Any</option>
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              {...registerSearch(field.name)}
                              placeholder={`Search ${field.title.toLowerCase()}...`}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          )}
                        </div>
                      );
                    })}

                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          clearAdvancedSearch();
                          setIsSearchModalOpen(false);
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
    </div>
  );
}

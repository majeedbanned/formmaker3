import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

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
  defaultValue?: any;
  validation?: FieldValidation;
  enabled: boolean;
  visible: boolean;
  options?: { label: string; value: any }[];
}

interface CRUDComponentProps {
  formStructure: FormField[];
  collectionName: string;
  connectionString: string;
}

export default function CRUDComponent({
  formStructure,
  collectionName,
  connectionString,
}: CRUDComponentProps) {
  const [entities, setEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm();

  // Fetch entities on component mount
  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crud/${collectionName}`, {
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

  const onSubmit = async (data: any) => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/crud/${collectionName}?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-mongodb-connection": connectionString,
        },
      });

      if (!response.ok) throw new Error("Failed to delete entity");

      await fetchEntities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entity");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entity: any) => {
    setEditingId(entity._id);
    const entityData =
      entity.data instanceof Map
        ? Object.fromEntries(entity.data)
        : entity.data;

    Object.entries(entityData).forEach(([key, value]) => {
      setValue(key, value);
    });
  };

  const getValidationRules = (field: FormField) => {
    const rules: any = {};

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mb-8">
        {formStructure.map((field) => {
          if (!field.visible) return null;

          return (
            <div key={field.name} className="space-y-2">
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-gray-700"
              >
                {field.title}
                {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === "dropdown" ? (
                <select
                  {...register(field.name, getValidationRules(field))}
                  disabled={!field.enabled}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select an option</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  {...register(field.name, getValidationRules(field))}
                  disabled={!field.enabled}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={4}
                />
              ) : (
                <input
                  type={field.type}
                  {...register(field.name, getValidationRules(field))}
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

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Processing..." : editingId ? "Update" : "Create"}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Saved Entries</h2>
        <div className="space-y-4">
          {entities.map((entity) => (
            <div
              key={entity._id}
              className="border rounded-lg p-4 flex justify-between items-start"
            >
              <div className="space-y-2">
                {Object.entries(
                  entity.data instanceof Map
                    ? Object.fromEntries(entity.data)
                    : entity.data
                ).map(([key, value]) => (
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
                  onClick={() => handleDelete(entity._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

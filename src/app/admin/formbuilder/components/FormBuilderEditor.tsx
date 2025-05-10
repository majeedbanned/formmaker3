"use client";

import { useState } from "react";
import { FormSchema, FormField } from "./FormBuilderList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FieldItem } from "./FieldItem";
import { FieldTypeSelector } from "./FieldTypeSelector";
import { FieldEditor } from "./FieldEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Save, X } from "lucide-react";

interface FormBuilderEditorProps {
  form: FormSchema;
  onSave: (form: FormSchema) => void;
  onCancel: () => void;
}

export default function FormBuilderEditor({
  form,
  onSave,
  onCancel,
}: FormBuilderEditorProps) {
  const [formState, setFormState] = useState<FormSchema>(form);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormState((form) => {
        const oldIndex = form.fields.findIndex(
          (field) => `field-${field.name}` === active.id
        );
        const newIndex = form.fields.findIndex(
          (field) => `field-${field.name}` === over.id
        );

        return {
          ...form,
          fields: arrayMove(form.fields, oldIndex, newIndex),
        };
      });
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({
      ...formState,
      title: e.target.value,
    });
  };

  const handleAddField = (fieldType: string) => {
    const newField: FormField = {
      type: fieldType,
      label: `فیلد جدید ${
        fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
      }`,
      name: `field_${Date.now()}`,
    };

    // Add options if select, radio, or checkbox
    if (["select", "radio", "checkbox"].includes(fieldType)) {
      newField.options = [
        { label: "گزینه ۱", value: "option1" },
        { label: "گزینه ۲", value: "option2" },
      ];
    }

    // Set the field for editing
    setEditingField(newField);
    setEditingIndex(formState.fields.length);
  };

  const handleEditField = (index: number) => {
    setEditingField(formState.fields[index]);
    setEditingIndex(index);
  };

  const handleSaveField = (field: FormField) => {
    setFormState((prev) => {
      const newFields = [...prev.fields];

      if (editingIndex !== null && editingIndex < newFields.length) {
        // Editing existing field
        newFields[editingIndex] = field;
      } else {
        // Adding new field
        newFields.push(field);
      }

      return {
        ...prev,
        fields: newFields,
      };
    });

    // Reset editing state
    setEditingField(null);
    setEditingIndex(null);
  };

  const handleCancelFieldEdit = () => {
    setEditingField(null);
    setEditingIndex(null);
  };

  const handleDeleteField = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const handleDuplicateField = (index: number) => {
    const fieldToDuplicate = { ...formState.fields[index] };
    fieldToDuplicate.name = `${fieldToDuplicate.name}_copy_${Date.now()}`;

    setFormState((prev) => ({
      ...prev,
      fields: [
        ...prev.fields.slice(0, index + 1),
        fieldToDuplicate,
        ...prev.fields.slice(index + 1),
      ],
    }));
  };

  const handleSaveForm = async () => {
    try {
      const response = await fetch(
        formState._id
          ? `/api/formbuilder/${formState._id}`
          : "/api/formbuilder",
        {
          method: formState._id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formState),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save form");
      }

      const savedForm = await response.json();
      onSave(savedForm);
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
      {/* Field list and form properties */}
      <div className="lg:col-span-2">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">ویرایشگر فرم</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 ml-2" /> انصراف
              </Button>
              <Button onClick={handleSaveForm}>
                <Save className="h-4 w-4 ml-2" /> ذخیره فرم
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Input
                placeholder="عنوان فرم"
                value={formState.title}
                onChange={handleTitleChange}
                className="mb-4 text-xl font-semibold"
              />

              <div className="min-h-[200px] p-4 border rounded-md">
                {formState.fields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    از انتخاب‌کننده فیلد در سمت راست برای افزودن فیلدهای فرم
                    استفاده کنید
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={formState.fields.map(
                        (field) => `field-${field.name}`
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {formState.fields.map((field, index) => (
                          <FieldItem
                            key={`field-${field.name}`}
                            id={`field-${field.name}`}
                            field={field}
                            onEdit={() => handleEditField(index)}
                            onDelete={() => handleDeleteField(index)}
                            onDuplicate={() => handleDuplicateField(index)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Field type selector and editor */}
      <div className="space-y-6">
        {editingField ? (
          <FieldEditor
            field={editingField}
            allFields={formState.fields}
            onSave={handleSaveField}
            onCancel={handleCancelFieldEdit}
          />
        ) : (
          <FieldTypeSelector onSelectType={handleAddField} />
        )}
      </div>
    </div>
  );
}

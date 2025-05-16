"use client";

import { useState } from "react";
import { FormSchema, FormField, FormStep } from "./FormBuilderList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
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
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Save, X, PlusCircle, FileSymlink, Layers } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  const [formState, setFormState] = useState<FormSchema>({
    ...form,
    steps: form.steps || [],
    isMultiStep: form.isMultiStep || false,
  });
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(
    formState.steps && formState.steps.length > 0 ? formState.steps[0].id : null
  );
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDescription, setNewStepDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { user } = useAuth();

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

  const toggleMultiStep = (enabled: boolean) => {
    setFormState((prev) => {
      // If enabling multi-step and we don't have any steps yet, create an initial step
      let steps = prev.steps || [];
      if (enabled && steps.length === 0) {
        const initialStep = {
          id: `step_${Date.now()}`,
          title: "گام اول",
          fieldIds: prev.fields.map((field) => field.name),
        };
        steps = [initialStep];
        setActiveStep(initialStep.id);
      }

      return {
        ...prev,
        isMultiStep: enabled,
        steps,
      };
    });
  };

  const addNewStep = () => {
    if (!newStepTitle.trim()) return;

    const newStep: FormStep = {
      id: `step_${Date.now()}`,
      title: newStepTitle,
      description: newStepDescription,
      fieldIds: [],
    };

    setFormState((prev) => ({
      ...prev,
      steps: [...(prev.steps || []), newStep],
    }));

    setActiveStep(newStep.id);
    setNewStepTitle("");
    setNewStepDescription("");
  };

  const deleteStep = (stepId: string) => {
    if (!formState.steps || formState.steps.length <= 1) return;

    // Get fields that were in this step
    const fieldsInStep = formState.fields.filter(
      (field) => field.stepId === stepId
    );

    // Update form state
    setFormState((prev) => {
      const updatedSteps = prev.steps!.filter((step) => step.id !== stepId);
      const firstStepId = updatedSteps[0]?.id;

      // Reassign fields to the first step
      const updatedFields = prev.fields.map((field) => {
        if (field.stepId === stepId) {
          return { ...field, stepId: firstStepId };
        }
        return field;
      });

      // If we were on the deleted step, switch to the first step
      if (activeStep === stepId) {
        setActiveStep(firstStepId);
      }

      return {
        ...prev,
        steps: updatedSteps,
        fields: updatedFields,
      };
    });
  };

  const updateStepTitle = (stepId: string, title: string) => {
    setFormState((prev) => ({
      ...prev,
      steps: prev.steps?.map((step) =>
        step.id === stepId ? { ...step, title } : step
      ),
    }));
  };

  const handleAddField = (fieldType: string) => {
    const newField: FormField = {
      type: fieldType,
      label: `فیلد جدید ${
        fieldType.charAt(0).toUpperCase() + fieldType.slice(1)
      }`,
      name: `field_${Date.now()}`,
      stepId: formState.isMultiStep && activeStep ? activeStep : undefined,
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

      // If this is a multi-step form, ensure the field has the correct stepId
      const updatedField = {
        ...field,
        stepId: prev.isMultiStep ? field.stepId || activeStep : undefined,
      };

      if (editingIndex !== null && editingIndex < newFields.length) {
        // Editing existing field
        newFields[editingIndex] = updatedField;
      } else {
        // Adding new field
        newFields.push(updatedField);
      }

      // If this is a multi-step form, update the fieldIds in the step
      let updatedSteps = prev.steps;
      if (prev.isMultiStep && updatedSteps) {
        updatedSteps = updatedSteps.map((step) => {
          if (step.id === updatedField.stepId) {
            // Add the field to this step if it's not already there
            if (!step.fieldIds.includes(updatedField.name)) {
              return {
                ...step,
                fieldIds: [...step.fieldIds, updatedField.name],
              };
            }
          } else if (
            step.fieldIds.includes(updatedField.name) &&
            updatedField.stepId !== step.id
          ) {
            // Remove the field from other steps if it was moved
            return {
              ...step,
              fieldIds: step.fieldIds.filter((id) => id !== updatedField.name),
            };
          }
          return step;
        });
      }

      return {
        ...prev,
        fields: newFields,
        steps: updatedSteps,
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
    const fieldToDelete = formState.fields[index];

    setFormState((prev) => {
      // Remove field from the fields array
      const updatedFields = prev.fields.filter((_, i) => i !== index);

      // If this is a multi-step form, remove the field from its step's fieldIds
      let updatedSteps = prev.steps;
      if (prev.isMultiStep && updatedSteps && fieldToDelete.stepId) {
        updatedSteps = updatedSteps.map((step) => {
          if (step.id === fieldToDelete.stepId) {
            return {
              ...step,
              fieldIds: step.fieldIds.filter((id) => id !== fieldToDelete.name),
            };
          }
          return step;
        });
      }

      return {
        ...prev,
        fields: updatedFields,
        steps: updatedSteps,
      };
    });
  };

  const handleDuplicateField = (index: number) => {
    const fieldToDuplicate = { ...formState.fields[index] };
    fieldToDuplicate.name = `${fieldToDuplicate.name}_copy_${Date.now()}`;

    setFormState((prev) => {
      const updatedFields = [
        ...prev.fields.slice(0, index + 1),
        fieldToDuplicate,
        ...prev.fields.slice(index + 1),
      ];

      // If this is a multi-step form, add the field to its step's fieldIds
      let updatedSteps = prev.steps;
      if (prev.isMultiStep && updatedSteps && fieldToDuplicate.stepId) {
        updatedSteps = updatedSteps.map((step) => {
          if (step.id === fieldToDuplicate.stepId) {
            return {
              ...step,
              fieldIds: [...step.fieldIds, fieldToDuplicate.name],
            };
          }
          return step;
        });
      }

      return {
        ...prev,
        fields: updatedFields,
        steps: updatedSteps,
      };
    });
  };

  const handleMoveToStep = (fieldIndex: number, targetStepId: string) => {
    const fieldToMove = { ...formState.fields[fieldIndex] };
    const currentStepId = fieldToMove.stepId;

    // Don't do anything if it's the same step
    if (currentStepId === targetStepId) return;

    // Update the field's stepId
    fieldToMove.stepId = targetStepId;

    setFormState((prev) => {
      // Update the field in the fields array
      const updatedFields = [...prev.fields];
      updatedFields[fieldIndex] = fieldToMove;

      // Update the steps to reflect the moved field
      let updatedSteps = prev.steps;
      if (prev.isMultiStep && updatedSteps) {
        updatedSteps = updatedSteps.map((step) => {
          if (step.id === targetStepId) {
            // Add to target step if not already there
            return {
              ...step,
              fieldIds: [...step.fieldIds, fieldToMove.name],
            };
          } else if (step.id === currentStepId) {
            // Remove from current step
            return {
              ...step,
              fieldIds: step.fieldIds.filter((id) => id !== fieldToMove.name),
            };
          }
          return step;
        });
      }

      return {
        ...prev,
        fields: updatedFields,
        steps: updatedSteps,
      };
    });
  };

  const handleSaveForm = async () => {
    if (!user) {
      console.error("No user authenticated");
      return;
    }

    try {
      const response = await fetch(
        formState._id
          ? `/api/formbuilder/${formState._id}`
          : "/api/formbuilder",
        {
          method: formState._id ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user": user.username,
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

  // Get fields for the current step
  const fieldsForCurrentStep = formState.isMultiStep
    ? formState.fields.filter((field) => field.stepId === activeStep)
    : formState.fields;

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

              <div className="mb-6 flex items-center">
                <div className="flex items-center space-x-2 space-x-reverse mb-2">
                  <Switch
                    id="multi-step"
                    checked={formState.isMultiStep}
                    onCheckedChange={toggleMultiStep}
                  />
                  <Label htmlFor="multi-step" className="font-medium">
                    فرم چند مرحله‌ای
                  </Label>
                </div>
                <div className="text-sm text-gray-500 mr-2">
                  {formState.isMultiStep
                    ? "فرم در چند گام نمایش داده می‌شود"
                    : "تمام فیلدها در یک صفحه نمایش داده می‌شوند"}
                </div>
              </div>

              {formState.isMultiStep && (
                <div className="mb-6">
                  <Tabs value={activeStep || ""} onValueChange={setActiveStep}>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">گام‌های فرم</h3>
                    </div>

                    <TabsList className="mb-4 overflow-auto">
                      {formState.steps?.map((step) => (
                        <TabsTrigger
                          key={step.id}
                          value={step.id}
                          className="relative pr-8"
                        >
                          {step.title}
                          {formState.steps!.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteStep(step.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <div className="mb-4 p-4 border rounded-md">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="new-step-title">عنوان گام جدید</Label>
                          <Input
                            id="new-step-title"
                            value={newStepTitle}
                            onChange={(e) => setNewStepTitle(e.target.value)}
                            placeholder="عنوان گام"
                            className="mb-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-step-description">
                            توضیحات (اختیاری)
                          </Label>
                          <Input
                            id="new-step-description"
                            value={newStepDescription}
                            onChange={(e) =>
                              setNewStepDescription(e.target.value)
                            }
                            placeholder="توضیح کوتاه"
                            className="mb-2"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={addNewStep}
                        disabled={!newStepTitle.trim()}
                        size="sm"
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 ml-2" />
                        افزودن گام جدید
                      </Button>
                    </div>

                    {/* For each step, show a tab content */}
                    {formState.steps?.map((step) => (
                      <TabsContent
                        key={step.id}
                        value={step.id}
                        className="border-0 p-0"
                      >
                        <div className="mb-4 p-4 border rounded-md">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`step-title-${step.id}`}>
                                عنوان گام
                              </Label>
                              <Input
                                id={`step-title-${step.id}`}
                                value={step.title}
                                onChange={(e) =>
                                  updateStepTitle(step.id, e.target.value)
                                }
                                className="mb-2"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`step-desc-${step.id}`}>
                                توضیحات
                              </Label>
                              <Textarea
                                id={`step-desc-${step.id}`}
                                value={step.description || ""}
                                onChange={(e) => {
                                  setFormState((prev) => ({
                                    ...prev,
                                    steps: prev.steps?.map((s) =>
                                      s.id === step.id
                                        ? { ...s, description: e.target.value }
                                        : s
                                    ),
                                  }));
                                }}
                                placeholder="توضیحات این گام"
                                className="mb-2"
                              />
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}

              <div className="min-h-[200px] p-4 border rounded-md">
                {fieldsForCurrentStep.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {formState.isMultiStep
                      ? `برای افزودن فیلدهای این گام، از انتخاب‌کننده فیلد در سمت راست استفاده کنید`
                      : `از انتخاب‌کننده فیلد در سمت راست برای افزودن فیلدهای فرم استفاده کنید`}
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fieldsForCurrentStep.map(
                        (field) => `field-${field.name}`
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {fieldsForCurrentStep.map((field, index) => {
                          // Find the actual index in the full fields array
                          const realIndex = formState.fields.findIndex(
                            (f) => f.name === field.name
                          );
                          return (
                            <div key={`field-container-${field.name}`}>
                              <FieldItem
                                key={`field-${field.name}`}
                                id={`field-${field.name}`}
                                field={field}
                                onEdit={() => handleEditField(realIndex)}
                                onDelete={() => handleDeleteField(realIndex)}
                                onDuplicate={() =>
                                  handleDuplicateField(realIndex)
                                }
                              />
                              {formState.isMultiStep &&
                                formState.steps &&
                                formState.steps.length > 1 && (
                                  <div className="mt-1 flex justify-end">
                                    <div className="inline-flex items-center text-sm">
                                      <FileSymlink className="h-3 w-3 ml-1" />
                                      <span>انتقال به گام:</span>
                                      <div className="flex flex-wrap gap-1 mr-2">
                                        {formState.steps
                                          .filter(
                                            (step) => step.id !== field.stepId
                                          )
                                          .map((step) => (
                                            <Button
                                              key={step.id}
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-xs"
                                              onClick={() =>
                                                handleMoveToStep(
                                                  realIndex,
                                                  step.id
                                                )
                                              }
                                            >
                                              {step.title}
                                            </Button>
                                          ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                            </div>
                          );
                        })}
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
            steps={formState.isMultiStep ? formState.steps : undefined}
          />
        ) : (
          <FieldTypeSelector onSelectType={handleAddField} />
        )}
      </div>
    </div>
  );
}

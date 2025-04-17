import RichTextEditor from "./ui/rich-text-editor";

// Inside the FormField component, add another case to the switch statement
case "richtextbox":
  return (
    <div className="w-full">
      <RichTextEditor
        value={value as string || ""}
        onChange={(newValue) => setValue(name, newValue)}
        readOnly={isDisabled || field.readonly}
        dir={layout.direction}
      />
      {error && (
        <div className="text-destructive text-sm mt-1">
          {error.message}
        </div>
      )}
    </div>
  ); 
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type AutocompleteOption = {
  label: string;
  value: string;
};

interface AutocompleteTagsProps {
  options: AutocompleteOption[];
  selected: string[];
  selectedLabels?: Record<string, string>; // Map of value to label for selected items
  onChange: (
    values: string[],
    newOptionLabel?: { value: string; label: string }
  ) => void;
  placeholder?: string;
  inputPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  allowCustomValues?: boolean;
  loading?: boolean;
  onSearch?: (query: string) => void;
  loadingMessage?: string;
  minSearchLength?: number;
}

export function AutocompleteTags({
  options,
  selected,
  selectedLabels = {},
  onChange,
  placeholder = "Select items...",
  inputPlaceholder = "Search...",
  emptyMessage = "No results found",
  className,
  disabled = false,
  allowCustomValues = false,
  loading = false,
  onSearch,
  loadingMessage = "Loading...",
  minSearchLength = 2,
}: AutocompleteTagsProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [showOptions, setShowOptions] = React.useState(minSearchLength === 0);
  // Track internal selected labels to ensure they're available immediately after selection
  const [internalSelectedLabels, setInternalSelectedLabels] =
    React.useState<Record<string, string>>(selectedLabels);

  // Sync with external selectedLabels when they change
  React.useEffect(() => {
    setInternalSelectedLabels({ ...selectedLabels });
  }, [selectedLabels]);

  // console.log(
  //   "AutocompleteTags options:",
  //   options,
  //   "selected:",
  //   selected,
  //   "showOptions:",
  //   showOptions,
  //   "selectedLabels:",
  //   selectedLabels,
  //   "internalSelectedLabels:",
  //   internalSelectedLabels
  // );

  React.useEffect(() => {
    if (
      open &&
      options.length > 0 &&
      (!minSearchLength || minSearchLength === 0)
    ) {
      setShowOptions(true);
    }
  }, [open, options, minSearchLength]);

  const handleUnselect = (value: string) => {
    // Remove from internal labels too
    const newInternalLabels = { ...internalSelectedLabels };
    delete newInternalLabels[value];
    setInternalSelectedLabels(newInternalLabels);
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: string) => {
    if (!selected.includes(value)) {
      // Find the option with this value to pass its label too
      const option = options.find((opt) => opt.value === value);
      if (option) {
        // Update internal labels immediately
        setInternalSelectedLabels({
          ...internalSelectedLabels,
          [value]: option.label,
        });
      }
      onChange(
        [...selected, value],
        option ? { value, label: option.label } : undefined
      );
      setInputValue("");
      setShowOptions(minSearchLength === 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // console.log("handleKeyDown", e.key, inputValue, allowCustomValues);
    if (e.key === "Enter" && inputValue && allowCustomValues) {
      e.preventDefault();
      if (!selected.includes(inputValue)) {
        // For custom values, use the same value as both value and label
        // Add to internal labels immediately
        setInternalSelectedLabels({
          ...internalSelectedLabels,
          [inputValue]: inputValue,
        });
        onChange([...selected, inputValue], {
          value: inputValue,
          label: inputValue,
        });
        setInputValue("");
        setShowOptions(minSearchLength === 0);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const shouldShowOptions =
      minSearchLength === 0 || value.length >= minSearchLength;
    setShowOptions(shouldShowOptions);

    if (shouldShowOptions && onSearch) {
      onSearch(value);
    }
  };

  React.useEffect(() => {
    if (minSearchLength > 0 && inputValue.length < minSearchLength) {
      setShowOptions(false);
    } else {
      setShowOptions(true);
    }
  }, [inputValue, minSearchLength]);

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-1 focus-within:ring-ring",
              disabled && "opacity-50 pointer-events-none"
            )}
            onClick={() => !disabled && setOpen(true)}
          >
            {selected.length > 0 ? (
              <>
                {selected.map((value) => {
                  // Find the corresponding option to display label instead of value
                  // First check internal labels, then selectedLabels, then fall back to searching options
                  const displayText =
                    internalSelectedLabels[value] ||
                    selectedLabels[value] ||
                    options.find((opt) => opt.value === value)?.label ||
                    value;

                  return (
                    <Badge
                      key={value}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {displayText}
                      <button
                        type="button"
                        className="ml-1 rounded-full outline-none ring-offset-background hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnselect(value);
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {displayText}</span>
                      </button>
                    </Badge>
                  );
                })}
                <input
                  value={inputValue}
                  disabled={disabled}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-20"
                  placeholder={inputPlaceholder}
                />
              </>
            ) : (
              <input
                value={inputValue}
                disabled={disabled}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                placeholder={placeholder}
              />
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="w-full flex flex-col">
            <div className="p-2 border-b">
              <input
                value={inputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setInputValue(value);
                  const shouldShowOptions =
                    minSearchLength === 0 || value.length >= minSearchLength;
                  setShowOptions(shouldShowOptions);
                  if (shouldShowOptions && onSearch) {
                    onSearch(value);
                  }
                }}
                placeholder={inputPlaceholder}
                className="w-full h-9 px-3 rounded-md border-0 focus:outline-none focus:ring-0 text-sm"
              />
            </div>

            {/* Empty state handling */}
            {loading ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {loadingMessage}
                </p>
                <div className="flex justify-center mt-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              </div>
            ) : options.length === 0 || !showOptions ? (
              <div className="py-4 px-2 text-center">
                {!showOptions ? (
                  <p className="text-sm text-muted-foreground">
                    Type at least {minSearchLength} characters to search
                  </p>
                ) : allowCustomValues && inputValue ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {emptyMessage}
                    </p>
                    <button
                      className="w-full text-sm bg-accent hover:bg-accent/80 text-accent-foreground py-2 px-4 rounded-md"
                      onClick={() => {
                        if (inputValue && !selected.includes(inputValue)) {
                          handleSelect(inputValue);
                          setOpen(false);
                        }
                      }}
                    >
                      Add &quot;{inputValue}&quot;
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {emptyMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto py-1">
                {options
                  .filter((option) => !selected.includes(option.value))
                  .map((option) => (
                    <div
                      key={option.value}
                      onClick={() => {
                        handleSelect(option.value);
                        setOpen(false);
                      }}
                      className="flex items-center gap-2 py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      <span>{option.label}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

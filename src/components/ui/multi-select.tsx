import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

export type Option = {
  label: string;
  value: unknown;
};

interface MultiSelectProps {
  options: Option[];
  selected: unknown[];
  onChange: (values: unknown[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  loadingMessage?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options",
  disabled = false,
  emptyMessage = "No options found.",
  searchPlaceholder = "Search options...",
  loading = false,
  loadingMessage = "Loading options...",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleUnselect = (value: unknown) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: unknown) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
    // Keep the popover open after selection
  };

  // Find the label for a value
  const getLabel = (value: unknown) => {
    const option = options.find((option) => option.value === value);
    return option ? option.label : String(value);
  };

  return (
    <div className="relative " ref={containerRef}>
      <div className="flex flex-col gap-1.5">
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selected.length > 0 ? "h-auto min-h-10" : "h-10",
            className
          )}
          onClick={() => setOpen(!open)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 min-h-6">
            {selected.length > 0 ? (
              selected.map((value) => (
                <Badge
                  key={String(value)}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {getLabel(value)}
                  <button
                    type="button"
                    className="rounded-full outline-none ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(value);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm self-center">
                {placeholder}
              </span>
            )}
          </div>
        </Button>

        {open && (
          <div
            ref={dropdownRef}
            className="absolute top-full w-full z-50 bg-popover rounded-md border shadow-md mt-1"
          >
            <Command className="w-full">
              <CommandInput placeholder={searchPlaceholder} />
              <CommandEmpty>
                {loading ? loadingMessage : emptyMessage}
              </CommandEmpty>
              <CommandGroup className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center items-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  options.map((option) => (
                    <CommandItem
                      key={String(option.value)}
                      value={option.label}
                      onSelect={() => handleSelect(option.value)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-5 w-5 items-center justify-center rounded-sm border-2 border-primary",
                          selected.includes(option.value)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </Command>
          </div>
        )}
      </div>
    </div>
  );
}

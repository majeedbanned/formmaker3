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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

  const handleUnselect = (value: unknown) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: unknown) => {
    console.log("Selection triggered");

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
    <div className="relative z-50">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
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
            title="Click to select options"
            aria-haspopup="listbox"
          >
            <div className="flex flex-wrap gap-1 p-1">
              {selected.length > 0 ? (
                selected.map((value) => (
                  <Badge
                    key={String(value)}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1"
                  >
                    {getLabel(value)}
                    <button
                      className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            {/* <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" /> */}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0 border-4 z-[999999]"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <Command className="w-full">
            <CommandInput placeholder={searchPlaceholder} autoFocus />
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
                    value={String(option.value)}
                    onSelect={() => {
                      handleSelect(option.value);
                    }}
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

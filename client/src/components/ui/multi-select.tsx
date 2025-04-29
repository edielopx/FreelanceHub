import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  createOption?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecionar itens...",
  className,
  disabled = false,
  createOption = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      handleUnselect(value);
    } else {
      onChange([...selected, value]);
    }
  };

  const handleCreateOption = () => {
    if (inputValue && !options.some(opt => opt.value === inputValue)) {
      // Adicionar nova opção e selecioná-la
      const newValue = inputValue.toLowerCase().replace(/\s+/g, "-");
      handleSelect(newValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputValue && createOption) {
      e.preventDefault();
      handleCreateOption();
    }
  };

  // Encontrar as labels das opções selecionadas
  const selectedLabels = selected.map(value => {
    const option = options.find(opt => opt.value === value);
    return option?.label || value;
  });

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open && !disabled} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between min-h-10 h-auto",
              selected.length > 0 ? "px-3 py-2" : "",
              disabled ? "opacity-70 cursor-not-allowed" : ""
            )}
            onClick={(e) => {
              if (!disabled) {
                setOpen(!open);
              }
              e.preventDefault();
            }}
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1">
              {selected.length > 0 ? (
                selectedLabels.map((label, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleUnselect(selected[i]);
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUnselect(selected[i]);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[300px] p-0">
          <Command onKeyDown={handleKeyDown}>
            <CommandInput 
              placeholder="Pesquisar..." 
              className="h-9" 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandEmpty className="py-2 px-2 text-center text-sm">
              {createOption ? (
                <Button variant="outline" size="sm" onClick={handleCreateOption}>
                  Criar "{inputValue}"
                </Button>
              ) : (
                "Nenhum item encontrado."
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span>{option.label}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
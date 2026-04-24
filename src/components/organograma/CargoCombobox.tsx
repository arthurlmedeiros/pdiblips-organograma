import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCargos } from "@/hooks/useCargos";
import CargoFormDialog from "./CargoFormDialog";

interface Props {
  value: string | null;
  onChange: (cargoId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function CargoCombobox({
  value,
  onChange,
  placeholder = "Selecionar cargo…",
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: cargos = [] } = useCargos();

  const current = cargos.find((c) => c.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn("w-full justify-between font-normal", !current && "text-muted-foreground")}
          >
            {current ? current.nome : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar cargo…"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Nenhum cargo encontrado.</CommandEmpty>
              <CommandGroup>
                {cargos.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.nome}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                    <span>{c.nome}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{c.nivel}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setDialogOpen(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar novo cargo{query && ` "${query}"`}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CargoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultNome={query}
        onCreated={(c) => onChange(c.id)}
      />
    </>
  );
}

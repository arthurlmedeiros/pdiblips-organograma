import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useCreateCargo, type Cargo } from "@/hooks/useCargos";

const TIPOS: Cargo["tipo"][] = ["Financeiro", "FINZA", "Mkt & Vendas", "TI", "Operações", "Outros"];
const NIVEIS: Cargo["nivel"][] = ["Diretoria", "Head/Sênior", "Gerência"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultNome?: string;
  onCreated?: (cargo: Cargo) => void;
}

export default function CargoFormDialog({ open, onOpenChange, defaultNome = "", onCreated }: Props) {
  const [nome, setNome] = useState(defaultNome);
  const [tipo, setTipo] = useState<Cargo["tipo"]>("Outros");
  const [nivel, setNivel] = useState<Cargo["nivel"]>("Gerência");
  const { mutateAsync, isPending } = useCreateCargo();

  useEffect(() => {
    if (open) setNome(defaultNome);
  }, [open, defaultNome]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast({ title: "Informe o nome do cargo", variant: "destructive" });
      return;
    }
    try {
      const cargo = await mutateAsync({ nome: nome.trim(), tipo, nivel });
      toast({ title: "Cargo criado" });
      onCreated?.(cargo);
      onOpenChange(false);
      setNome("");
    } catch (err: any) {
      toast({ title: "Erro", description: err?.message ?? "Não foi possível criar o cargo", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cargo</DialogTitle>
          <DialogDescription>
            Cadastre um cargo para usar no organograma. Área e nível são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cargo-nome">Nome do cargo *</Label>
            <Input
              id="cargo-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Diretor Comercial"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Área *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Cargo["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nível *</Label>
              <Select value={nivel} onValueChange={(v) => setNivel(v as Cargo["nivel"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NIVEIS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Salvando..." : "Criar cargo"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

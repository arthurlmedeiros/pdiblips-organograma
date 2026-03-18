import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSetores } from "@organograma/hooks/useSetores";
import { useColaboradores, useCreateColaborador, useUpdateColaborador, type ColaboradorWithRelations } from "@organograma/hooks/useColaboradores";
import { useAuth } from "@core/contexts/AuthContext";
import { toast } from "@core/hooks/use-toast";

interface ColaboradorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colaborador?: ColaboradorWithRelations | null;
}

export default function ColaboradorForm({ open, onOpenChange, colaborador }: ColaboradorFormProps) {
  const isEditing = !!colaborador;
  const { hasRole } = useAuth();
  const canSeeSalary = hasRole("admin_geral") || hasRole("admin_ceo");

  const { data: setores } = useSetores();
  const { data: colaboradores } = useColaboradores();
  const createMut = useCreateColaborador();
  const updateMut = useUpdateColaborador();

  const [nome, setNome] = useState(colaborador?.nome ?? "");
  const [cargo, setCargo] = useState(colaborador?.cargo ?? "");
  const [funcao, setFuncao] = useState(colaborador?.funcao ?? "");
  const [missao, setMissao] = useState(colaborador?.missao ?? "");
  const [setorId, setSetorId] = useState(colaborador?.setor_id ?? "");
  const [gestorId, setGestorId] = useState(colaborador?.gestor_id ?? "");
  const [salario, setSalario] = useState(colaborador?.salario?.toString() ?? "");

  const saving = createMut.isPending || updateMut.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const payload = {
      nome: nome.trim(),
      cargo: cargo.trim() || null,
      funcao: funcao.trim() || null,
      missao: missao.trim() || null,
      setor_id: setorId || null,
      gestor_id: gestorId || null,
      ...(canSeeSalary && salario ? { salario: parseFloat(salario) } : {}),
    };

    try {
      if (isEditing) {
        await updateMut.mutateAsync({ id: colaborador.id, ...payload });
        toast({ title: "Colaborador atualizado" });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: "Colaborador criado" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const possibleGestores = colaboradores?.filter((c) => c.id !== colaborador?.id) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do colaborador." : "Preencha os dados do novo colaborador."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funcao">Função</Label>
              <Input id="funcao" value={funcao} onChange={(e) => setFuncao(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Setor</Label>
            <Select value={setorId} onValueChange={setSetorId}>
              <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
              <SelectContent>
                {setores?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Gestor</Label>
            <Select value={gestorId} onValueChange={setGestorId}>
              <SelectTrigger><SelectValue placeholder="Sem gestor (raiz)" /></SelectTrigger>
              <SelectContent>
                {possibleGestores.map((g) => (
                  <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="missao">Missão</Label>
            <Textarea id="missao" value={missao} onChange={(e) => setMissao(e.target.value)} rows={2} />
          </div>

          {canSeeSalary && (
            <div className="space-y-2">
              <Label htmlFor="salario">Salário</Label>
              <Input id="salario" type="number" step="0.01" value={salario} onChange={(e) => setSalario(e.target.value)} />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

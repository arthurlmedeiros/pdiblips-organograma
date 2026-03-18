import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSetores, useCreateSetor, useUpdateSetor, useDeleteSetor } from "@organograma/hooks/useSetores";
import { toast } from "@core/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Tables } from "@core/integrations/supabase/types";

type Setor = Tables<"pdi_setores">;

interface SetorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SetorForm({ open, onOpenChange }: SetorFormProps) {
  const { data: setores } = useSetores();
  const createMut = useCreateSetor();
  const updateMut = useUpdateSetor();
  const deleteMut = useDeleteSetor();

  const [editing, setEditing] = useState<Setor | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setEditing(null);
    setIsAdding(false);
  };

  const startEdit = (s: Setor) => {
    setEditing(s);
    setNome(s.nome);
    setDescricao(s.descricao ?? "");
    setIsAdding(false);
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) return;
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, nome: nome.trim(), descricao: descricao.trim() || null });
        toast({ title: "Setor atualizado" });
      } else {
        await createMut.mutateAsync({ nome: nome.trim(), descricao: descricao.trim() || null });
        toast({ title: "Setor criado" });
      }
      resetForm();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast({ title: "Setor removido" });
      if (editing?.id === id) resetForm();
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Setores</DialogTitle>
          <DialogDescription>Crie, edite ou remova setores da empresa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {setores?.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">{s.nome}</p>
                {s.descricao && <p className="text-xs text-muted-foreground">{s.descricao}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(s)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {(!setores || setores.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum setor cadastrado</p>
          )}
        </div>

        {(isAdding || editing) ? (
          <div className="space-y-3 border-t border-border pt-3">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>
                {createMut.isPending || updateMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={startAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Novo Setor
          </Button>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

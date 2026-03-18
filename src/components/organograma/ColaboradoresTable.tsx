import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, UserX, Plus, Building2, Trash2 } from "lucide-react";
import { useColaboradores, useUpdateColaborador, useDeleteColaborador, type ColaboradorWithRelations } from "@organograma/hooks/useColaboradores";
import { useSetores } from "@organograma/hooks/useSetores";
import { useAuth } from "@core/contexts/AuthContext";
import { toast } from "@core/hooks/use-toast";
import ColaboradorForm from "./ColaboradorForm";
import SetorForm from "./SetorForm";

export default function ColaboradoresTable() {
  const { isAdmin, hasRole } = useAuth();
  const canSeeSalary = hasRole("admin_geral") || hasRole("admin_ceo");
  const { data: colaboradores, isLoading } = useColaboradores(true);
  const { data: setores } = useSetores();
  const updateMut = useUpdateColaborador();
  const deleteMut = useDeleteColaborador();

  const [search, setSearch] = useState("");
  const [filterSetor, setFilterSetor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("ativo");
  const [editColab, setEditColab] = useState<ColaboradorWithRelations | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showSetores, setShowSetores] = useState(false);
  const [deletingColab, setDeletingColab] = useState<ColaboradorWithRelations | null>(null);

  const filtered = colaboradores?.filter((c) => {
    if (filterStatus === "ativo" && !c.ativo) return false;
    if (filterStatus === "inativo" && c.ativo) return false;
    if (filterSetor !== "all" && c.setor_id !== filterSetor) return false;
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }) ?? [];

  const handleToggleAtivo = async (c: ColaboradorWithRelations) => {
    try {
      await updateMut.mutateAsync({ id: c.id, ativo: !c.ativo });
      toast({ title: c.ativo ? "Colaborador desativado" : "Colaborador reativado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deletingColab) return;
    try {
      await deleteMut.mutateAsync(deletingColab.id);
      toast({ title: "Colaborador excluído com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletingColab(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-60"
        />
        <Select value={filterSetor} onValueChange={setFilterSetor}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {setores?.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setShowSetores(true)}>
                <Building2 className="h-4 w-4 mr-1" />
                Setores
              </Button>
              <Button onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Colaborador
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Gestor</TableHead>
              <TableHead>Status</TableHead>
              {canSeeSalary && <TableHead>Salário</TableHead>}
              {isAdmin && <TableHead className="w-28">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum colaborador encontrado</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>{c.cargo ?? "—"}</TableCell>
                  <TableCell>{c.pdi_setores?.nome ?? "—"}</TableCell>
                  <TableCell>{c.gestor?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={c.ativo ? "default" : "secondary"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  {canSeeSalary && (
                    <TableCell>
                      {c.salario ? `R$ ${c.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                    </TableCell>
                  )}
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditColab(c)} title="Editar">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleToggleAtivo(c)} title={c.ativo ? "Desativar" : "Reativar"}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingColab(c)} title="Excluir">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editColab && <ColaboradorForm open onOpenChange={(v) => !v && setEditColab(null)} colaborador={editColab} />}
      {showAdd && <ColaboradorForm open onOpenChange={(v) => !v && setShowAdd(false)} />}
      {showSetores && <SetorForm open onOpenChange={(v) => !v && setShowSetores(false)} />}

      <AlertDialog open={!!deletingColab} onOpenChange={(open) => !open && setDeletingColab(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deletingColab?.nome}</strong>? Esta ação é irreversível e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

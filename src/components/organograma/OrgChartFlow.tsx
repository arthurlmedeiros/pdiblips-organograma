import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Plus } from "lucide-react";
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
import ColaboradorNode from "./ColaboradorNode";
import type { ColaboradorNodeData } from "./ColaboradorNode";
import type { ColaboradorWithRelations } from "@organograma/hooks/useColaboradores";
import { useUpdateColaboradorPosition, useDeleteColaborador } from "@organograma/hooks/useColaboradores";
import { useAuth } from "@core/contexts/AuthContext";
import { toast } from "@core/hooks/use-toast";
import ColaboradorForm from "./ColaboradorForm";

const nodeTypes: NodeTypes = {
  colaborador: ColaboradorNode,
};

// Simple tree auto-layout
function autoLayout(colaboradores: ColaboradorWithRelations[]): Record<string, { x: number; y: number }> {
  const childrenMap = new Map<string | null, ColaboradorWithRelations[]>();
  colaboradores.forEach((c) => {
    const key = c.gestor_id ?? null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(c);
  });

  const positions: Record<string, { x: number; y: number }> = {};
  const HORIZONTAL_GAP = 280;
  const VERTICAL_GAP = 140;

  let globalX = 0;

  function layoutNode(id: string, depth: number): { left: number; right: number } {
    const children = childrenMap.get(id) ?? [];

    if (children.length === 0) {
      const x = globalX;
      globalX += HORIZONTAL_GAP;
      positions[id] = { x, y: depth * VERTICAL_GAP };
      return { left: x, right: x };
    }

    const bounds = children.map((child) => layoutNode(child.id, depth + 1));
    const left = bounds[0].left;
    const right = bounds[bounds.length - 1].right;
    const centerX = (left + right) / 2;

    positions[id] = { x: centerX, y: depth * VERTICAL_GAP };
    return { left, right };
  }

  const roots = childrenMap.get(null) ?? [];
  roots.forEach((root) => {
    layoutNode(root.id, 0);
    globalX += HORIZONTAL_GAP / 2;
  });

  return positions;
}

interface OrgChartFlowProps {
  colaboradores: ColaboradorWithRelations[];
}

export default function OrgChartFlow({ colaboradores }: OrgChartFlowProps) {
  const { isAdmin } = useAuth();
  const updatePosition = useUpdateColaboradorPosition();
  const deleteColaborador = useDeleteColaborador();
  const [editingColaborador, setEditingColaborador] = useState<ColaboradorWithRelations | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deletingColab = deletingId ? colaboradores.find((c) => c.id === deletingId) : null;

  const gestorIds = useMemo(() => {
    const set = new Set<string>();
    colaboradores.forEach((c) => {
      if (c.gestor_id) set.add(c.gestor_id);
    });
    return set;
  }, [colaboradores]);

  const handleEdit = useCallback((id: string) => {
    const colab = colaboradores.find((c) => c.id === id);
    if (colab) setEditingColaborador(colab);
  }, [colaboradores]);

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deletingId) return;
    try {
      await deleteColaborador.mutateAsync(deletingId);
      toast({ title: "Colaborador excluído com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, deleteColaborador]);

  const buildNodesAndEdges = useCallback(
    (useAutoLayout = false) => {
      const positions = useAutoLayout ? autoLayout(colaboradores) : null;

      const nodes: Node[] = colaboradores.map((c) => ({
        id: c.id,
        type: "colaborador",
        position: positions
          ? positions[c.id] ?? { x: 0, y: 0 }
          : { x: c.posicao_x ?? 0, y: c.posicao_y ?? 0 },
        data: {
          nome: c.nome,
          cargo: c.cargo,
          funcao: c.funcao,
          setorNome: c.pdi_setores?.nome ?? null,
          isGestor: gestorIds.has(c.id),
          isAdmin,
          nodeId: c.id,
          onEdit: handleEdit,
          onDelete: handleDelete,
        } satisfies ColaboradorNodeData,
      }));

      const edges: Edge[] = colaboradores
        .filter((c) => c.gestor_id)
        .map((c) => ({
          id: `e-${c.gestor_id}-${c.id}`,
          source: c.gestor_id!,
          target: c.id,
          type: "smoothstep",
          style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
          animated: false,
        }));

      return { nodes, edges };
    },
    [colaboradores, gestorIds, isAdmin, handleEdit, handleDelete]
  );

  const hasPositions = colaboradores.some((c) => c.posicao_x && c.posicao_y && (c.posicao_x !== 0 || c.posicao_y !== 0));
  const initial = useMemo(() => buildNodesAndEdges(!hasPositions), [buildNodesAndEdges, hasPositions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);

  // Sync when colaboradores change
  useMemo(() => {
    const updated = buildNodesAndEdges(!hasPositions);
    setNodes(updated.nodes);
    setEdges(updated.edges);
  }, [colaboradores]);

  const handleAutoLayout = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = buildNodesAndEdges(true);
    setNodes(newNodes);
    setEdges(newEdges);

    if (isAdmin) {
      const positions = autoLayout(colaboradores);
      Object.entries(positions).forEach(([id, pos]) => {
        updatePosition.mutate({ id, posicao_x: pos.x, posicao_y: pos.y });
      });
    }
  }, [buildNodesAndEdges, colaboradores, isAdmin, updatePosition, setNodes, setEdges]);

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!isAdmin) return;
      updatePosition.mutate({
        id: node.id,
        posicao_x: node.position.x,
        posicao_y: node.position.y,
      });
    },
    [isAdmin, updatePosition]
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!isAdmin) return;
      handleEdit(node.id);
    },
    [isAdmin, handleEdit]
  );

  return (
    <div className="relative h-[calc(100vh-220px)] min-h-[500px] rounded-xl border border-border bg-card overflow-hidden">
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {isAdmin && (
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Colaborador
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleAutoLayout}>
          <LayoutGrid className="h-4 w-4 mr-1" />
          Auto-layout
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        nodesDraggable={isAdmin}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!bg-background" />
        <Controls className="!bg-card !border-border !shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground" />
        <MiniMap
          className="!bg-card !border-border"
          nodeColor="hsl(37, 91%, 55%)"
          maskColor="hsl(var(--background) / 0.7)"
        />
      </ReactFlow>

      {editingColaborador && (
        <ColaboradorForm
          open
          onOpenChange={(open) => !open && setEditingColaborador(null)}
          colaborador={editingColaborador}
        />
      )}

      {showAddForm && (
        <ColaboradorForm
          open
          onOpenChange={(open) => !open && setShowAddForm(false)}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
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

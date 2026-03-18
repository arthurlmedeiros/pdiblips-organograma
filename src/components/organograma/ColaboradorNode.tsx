import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Pencil, Trash2 } from "lucide-react";

export type ColaboradorNodeData = {
  nome: string;
  cargo: string | null;
  funcao: string | null;
  setorNome: string | null;
  isGestor: boolean;
  isAdmin?: boolean;
  nodeId?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const getInitials = (nome: string) => {
  const parts = nome.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "").toUpperCase();
};

const ColaboradorNode = memo(({ data }: NodeProps) => {
  const d = data as ColaboradorNodeData;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl border border-border bg-card shadow-md px-4 py-3 min-w-[200px] max-w-[240px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />

      {d.isAdmin && hovered && (
        <div className="absolute -top-2 -right-2 flex gap-0.5 transition-opacity duration-150">
          <button
            className="h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
            onClick={(e) => { e.stopPropagation(); d.onEdit?.(d.nodeId!); }}
            title="Editar"
          >
            <Pencil className="h-3 w-3 text-foreground" />
          </button>
          <button
            className="h-6 w-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-destructive/10 transition-colors"
            onClick={(e) => { e.stopPropagation(); d.onDelete?.(d.nodeId!); }}
            title="Excluir"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
            {getInitials(d.nome)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{d.nome}</p>
          {d.cargo && <p className="text-xs text-muted-foreground truncate">{d.cargo}</p>}
        </div>

        {d.isGestor && (
          <Users className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {d.funcao && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {d.funcao}
          </Badge>
        )}
        {d.setorNome && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {d.setorNome}
          </Badge>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2.5 !h-2.5 !border-2 !border-background" />
    </div>
  );
});

ColaboradorNode.displayName = "ColaboradorNode";
export default ColaboradorNode;

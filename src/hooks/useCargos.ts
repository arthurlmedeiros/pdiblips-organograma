import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@core/integrations/supabase/client";

export interface Cargo {
  id: string;
  nome: string;
  tipo: "Financeiro" | "FINZA" | "Mkt & Vendas" | "TI" | "Operações" | "Outros";
  nivel: "Diretoria" | "Head/Sênior" | "Gerência";
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useCargos(includeInactive = false) {
  return useQuery({
    queryKey: ["pdi_cargos", includeInactive],
    queryFn: async () => {
      let q = supabase.from("pdi_cargos" as any).select("*").order("nome");
      if (!includeInactive) q = q.eq("ativo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Cargo[];
    },
  });
}

export function useCargoById(cargoId?: string | null) {
  return useQuery({
    queryKey: ["pdi_cargos", "byId", cargoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_cargos" as any)
        .select("*")
        .eq("id", cargoId!)
        .single();
      if (error) throw error;
      return data as unknown as Cargo;
    },
    enabled: !!cargoId,
  });
}

export function useCreateCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { nome: string; tipo: Cargo["tipo"]; nivel: Cargo["nivel"] }) => {
      const { data, error } = await supabase
        .from("pdi_cargos" as any)
        .insert(p as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as Cargo;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_cargos"] }),
  });
}

export function useUpdateCargo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      nome?: string;
      tipo?: Cargo["tipo"];
      nivel?: Cargo["nivel"];
      ativo?: boolean;
    }) => {
      const { id, ...updates } = p;
      const { error } = await supabase
        .from("pdi_cargos" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_cargos"] }),
  });
}

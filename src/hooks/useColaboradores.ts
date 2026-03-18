import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@core/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@core/integrations/supabase/types";

export type ColaboradorWithRelations = {
  id: string;
  nome: string;
  cargo: string | null;
  funcao: string | null;
  missao: string | null;
  salario: number | null;
  setor_id: string | null;
  gestor_id: string | null;
  user_id: string | null;
  posicao_x: number | null;
  posicao_y: number | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  pdi_setores: { id: string; nome: string } | null;
  gestor: { id: string; nome: string } | null;
};

export const useColaboradores = (includeInactive = false) => {
  return useQuery({
    queryKey: ["pdi_colaboradores", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("pdi_colaboradores")
        .select("*, pdi_setores(id, nome), gestor:pdi_colaboradores!gestor_id(id, nome)")
        .order("nome");

      if (!includeInactive) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ColaboradorWithRelations[];
    },
  });
};

export const useCreateColaborador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (colab: TablesInsert<"pdi_colaboradores">) => {
      const { data, error } = await supabase.from("pdi_colaboradores").insert(colab).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_colaboradores"] }),
  });
};

export const useUpdateColaborador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"pdi_colaboradores"> & { id: string }) => {
      const { data, error } = await supabase.from("pdi_colaboradores").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_colaboradores"] }),
  });
};

export const useUpdateColaboradorPosition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, posicao_x, posicao_y }: { id: string; posicao_x: number; posicao_y: number }) => {
      const { error } = await supabase
        .from("pdi_colaboradores")
        .update({ posicao_x, posicao_y })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_colaboradores"] }),
  });
};

export const useDeleteColaborador = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdi_colaboradores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_colaboradores"] }),
  });
};

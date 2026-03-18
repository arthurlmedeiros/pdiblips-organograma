import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@core/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@core/integrations/supabase/types";

type Setor = Tables<"pdi_setores">;

export const useSetores = () => {
  return useQuery({
    queryKey: ["pdi_setores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdi_setores")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Setor[];
    },
  });
};

export const useCreateSetor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (setor: TablesInsert<"pdi_setores">) => {
      const { data, error } = await supabase.from("pdi_setores").insert(setor).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_setores"] }),
  });
};

export const useUpdateSetor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"pdi_setores"> & { id: string }) => {
      const { data, error } = await supabase.from("pdi_setores").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_setores"] }),
  });
};

export const useDeleteSetor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pdi_setores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pdi_setores"] }),
  });
};

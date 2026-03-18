import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, Users } from "lucide-react";
import { useColaboradores } from "@organograma/hooks/useColaboradores";
import OrgChartFlow from "@organograma/components/organograma/OrgChartFlow";
import ColaboradoresTable from "@organograma/components/organograma/ColaboradoresTable";

const Organograma = () => {
  const { data: colaboradores, isLoading } = useColaboradores();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground">Organograma</h1>
        <p className="text-muted-foreground text-sm mt-1">Estrutura hierárquica da empresa</p>
      </div>

      <Tabs defaultValue="organograma">
        <TabsList>
          <TabsTrigger value="organograma" className="gap-1.5">
            <Network className="h-4 w-4" />
            Organograma
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="gap-1.5">
            <Users className="h-4 w-4" />
            Colaboradores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organograma">
          {isLoading ? (
            <div className="h-[500px] rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              Carregando organograma...
            </div>
          ) : !colaboradores?.length ? (
            <div className="h-[500px] rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground">
              Nenhum colaborador cadastrado. Adicione colaboradores na aba "Colaboradores".
            </div>
          ) : (
            <OrgChartFlow colaboradores={colaboradores} />
          )}
        </TabsContent>

        <TabsContent value="colaboradores">
          <ColaboradoresTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Organograma;

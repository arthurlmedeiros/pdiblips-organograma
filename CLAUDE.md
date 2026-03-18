# Organograma — PDI Blips

## Visão Geral

Módulo de organograma e gestão de colaboradores. Renderiza a estrutura hierárquica da organização como grafo interativo usando React Flow, além de gerenciar o cadastro de colaboradores e setores.

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Organograma.tsx` | Página principal — alterna entre visão de grafo e tabela |
| `src/components/organograma/OrgChartFlow.tsx` | Componente React Flow com layout automático de hierarquia |
| `src/components/organograma/ColaboradorNode.tsx` | Nó customizado do React Flow para exibir colaborador |
| `src/components/organograma/ColaboradoresTable.tsx` | Tabela de colaboradores com filtros e ações |
| `src/components/organograma/ColaboradorForm.tsx` | Formulário (Dialog) para criar/editar colaborador |
| `src/components/organograma/SetorForm.tsx` | Formulário (Dialog) para criar/editar setor |
| `src/hooks/useColaboradores.ts` | CRUD de `pdi_colaboradores` via React Query |
| `src/hooks/useSetores.ts` | CRUD de `pdi_setores` via React Query |

---

## Contexto Técnico

### Tabelas Envolvidas

| Tabela | Descrição |
|--------|-----------|
| `pdi_colaboradores` | Colaborador — campos: `nome`, `cargo`, `email`, `setor_id`, `gestor_id`, `user_id` |
| `pdi_setores` | Setor/departamento — campos: `nome`, `descricao`, `responsavel_id` |

### Hierarquia (Self-reference)

A tabela `pdi_colaboradores` usa **auto-referência** para hierarquia:
- `gestor_id` → FK para `pdi_colaboradores.id` (nullable — raiz da hierarquia tem `gestor_id = null`)
- Para montar o grafo: carregar todos colaboradores e construir árvore por `gestor_id`
- Colaboradores sem `gestor_id` são nós raiz

```ts
// Construção da árvore
const roots = colaboradores.filter(c => c.gestor_id === null)
const children = (id: string) => colaboradores.filter(c => c.gestor_id === id)
```

### React Flow (@xyflow/react)

- `OrgChartFlow` usa `useNodesState` e `useEdgesState` do React Flow
- Nós são do tipo customizado `ColaboradorNode`
- Layout calculado manualmente (top-down) ou via `dagre` — sem auto-layout embutido
- Edges conectam `gestor_id` → `colaborador.id`
- Interações habilitadas: zoom, pan, fit-view; seleção desabilitada por padrão

### Roles e Visibilidade

- `admin_geral` e `admin_ceo`: veem todos os colaboradores
- `admin_diretor`: veem apenas colaboradores do próprio setor (filtrado via `pdi_get_user_setor_ids()`)
- `gerente`: vê apenas a si mesmo e subordinados diretos

---

## Imports

```ts
import { useColaboradores } from '@organograma/hooks/useColaboradores'
import { useSetores } from '@organograma/hooks/useSetores'
import OrgChartFlow from '@organograma/components/organograma/OrgChartFlow'
import ColaboradoresTable from '@organograma/components/organograma/ColaboradoresTable'
```

---

## Restrições

1. **Ciclos proibidos**: nunca permitir que `gestor_id` crie ciclo (A → B → A) — validar no form
2. **React Flow versão**: usar `@xyflow/react` (v12+), não o legado `reactflow`
3. **Sem deleção de colaborador com subordinados** — verificar antes de deletar
4. **`user_id` é opcional**: colaborador pode existir sem conta de usuário no sistema

---

## Modo Standalone vs Delegado

**Standalone**: clonar para trabalhar no organograma e gestão de colaboradores de forma isolada. Útil para ajustes no layout do grafo, formulários de cadastro e filtros de tabela.

**Delegado**: o orquestrador injeta este módulo ao coordenar tarefas que relacionem colaboradores com PDI, testes ou dashboard. Os hooks `useColaboradores` e `useSetores` são consumidos por outros módulos como fonte de dados de colaboradores.

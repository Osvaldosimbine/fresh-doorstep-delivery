
Objetivo: corrigir definitivamente a invisibilidade dos pedidos no dashboard do entregador e remover o item indevido do perfil da padaria.

1. Diagnóstico confirmado
- O pedido existe na base de dados.
- O pedido mais recente está num estado inválido: `status_pedido = 'a_caminho'` e `entregador_id = null`.
- Não existe rota correspondente em `rotas_otimizadas`.
- A função `listar-pedidos-disponiveis` só devolve pedidos com `status_pedido IN ('em_preparacao','pendente')` e sem entregador.
- Resultado: o pedido fica “perdido” e não aparece para o delivery.
- No painel da padaria, a aba/item `Produtos` continua visível.

2. Correção principal do fluxo de pedidos
- Ajustar `listar-pedidos-disponiveis` para também devolver pedidos órfãos com:
  - `entregador_id IS NULL`
  - `status_pedido IN ('em_preparacao', 'pendente', 'a_caminho')`
- Incluir `horario_agendado` na resposta para mostrar ao entregador quando o pedido foi marcado.
- No `PedidosDisponiveis.tsx`, exibir esses pedidos com badge clara, por exemplo:
  - “Disponível”
  - “Agendado para …”
  - “Pendente de atribuição”

3. Fechar a origem do bug
- Remover do painel da padaria a possibilidade de colocar um pedido em `a_caminho` sem entregador atribuído.
- Limitar a padaria a estados operacionais que não quebram o fluxo.
- Criar uma migration com validação no banco para bloquear qualquer INSERT/UPDATE com:
  `status_pedido = 'a_caminho' AND entregador_id IS NULL`
- Isso impede que o sistema volte a gravar pedidos invisíveis.

4. Tornar a aceitação do entregador segura
- Substituir a aceitação direta no cliente por uma ação server-side única.
- Essa ação deve:
  1) confirmar que o pedido ainda está livre  
  2) gravar `entregador_id`  
  3) mudar `status_pedido` para `a_caminho`  
  4) falhar corretamente se outro entregador já tiver aceite
- Assim, o pedido nunca entra num estado inconsistente.

5. Robustez de autenticação e erros visíveis
- Ajustar `AuthContext` para o padrão seguro:
  - restaurar sessão com `getSession` primeiro
  - não fazer `await` dentro de `onAuthStateChange`
- Manter as queries do entregador bloqueadas até auth/sessão/perfil estarem prontos.
- Em `PedidosDisponiveis.tsx`, trocar o estado silencioso de vazio por:
  - erro visível quando a Edge Function falhar
  - botão “Tentar novamente”
  - mensagens distintas para 401/403/500
- Isso evita que falhas técnicas pareçam “não há pedidos”.

6. Perfil da padaria
- Remover a aba `Produtos` do `PadariaDashboard`.
- Remover o render/import de `ProductManagement` dessa área.
- Ajustar a grelha das tabs para o novo número de secções.
- Rever se existe mais algum ponto do perfil da padaria a mostrar itens de catálogo indevidos.

7. Validação final
- Criar um pedido novo e confirmar que ele aparece no dashboard do entregador.
- Confirmar que um pedido agendado aparece com o horário correto.
- Aceitar o pedido e validar que:
  - `entregador_id` deixa de ser `null`
  - `status_pedido` passa para `a_caminho`
  - o pedido sai da lista de disponíveis
- Tentar forçar `a_caminho` sem entregador e confirmar que o banco rejeita.
- Confirmar que a padaria já não vê a aba/item `Produtos`.

Detalhes técnicos
- Ficheiros principais:
  - `supabase/functions/listar-pedidos-disponiveis/index.ts`
  - `src/components/entregador/PedidosDisponiveis.tsx`
  - `src/contexts/AuthContext.tsx`
  - `src/components/padaria/OrdersManagement.tsx`
  - `src/pages/PadariaDashboard.tsx`
  - nova migration Supabase para proteger o estado dos pedidos
- Causa-raiz confirmada:
  - há pedido na BD
  - não há rota criada
  - o pedido está como `a_caminho` sem entregador
  - a listagem atual ignora exatamente esse caso

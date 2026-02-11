

# Plano: Integrar Relacao Cliente-Padaria-Entregador

## Estado Actual

O sistema ja tem muita logica implementada (notificacoes realtime, reports financeiros, gestao de clientes). Os problemas principais sao:

1. **Pedidos ficam "pendente" a espera de confirmacao da padaria** - o utilizador quer que sejam aceites automaticamente
2. **Quando o entregador aceita a rota, o `entregador_id` nao e actualizado nos pedidos** - a padaria nao ve quem vai entregar
3. **DashboardMetrics so tem dia/semana/mes** - falta opcao anual
4. **Notificacao na padaria quando entregador aceita** - falta realtime na tabela `rotas_otimizadas`

## Alteracoes

### 1. Auto-aceitar pedidos (Edge Function `process-order`)
- Mudar o status inicial do pedido de `'pendente'` para `'em_preparacao'`
- O pedido entra directamente em preparacao, sem necessidade de confirmacao manual
- A padaria recebe notificacao via Realtime (ja implementado) mas apenas como alerta informativo
- O stock ja e descontado automaticamente nesta Edge Function

### 2. Entregador actualiza pedidos ao aceitar rota (`PedidosDisponiveis.tsx`)
- Quando o entregador aceita uma rota, alem de actualizar `rotas_otimizadas`, deve tambem actualizar o campo `entregador_id` e `status_pedido` para `'a_caminho'` em todos os pedidos da rota
- Isto garante que a padaria ve imediatamente quem e o entregador no seu dashboard

### 3. Padaria recebe alerta de entregador atribuido (`OrdersManagement.tsx`)
- Adicionar subscription Realtime na tabela `rotas_otimizadas` filtrada por `padaria_id`
- Quando uma rota e aceite, mostrar toast informando o nome do entregador
- O componente ja mostra dados do entregador - so precisa do realtime trigger

### 4. Reports anuais (`DashboardMetrics.tsx`)
- Adicionar opcao "Ultimo Ano" ao selector de periodo
- Ja existe no `FinancialReports.tsx` - basta replicar a logica

## Detalhes Tecnicos

### Ficheiro 1: `supabase/functions/process-order/index.ts`
- Linha onde define `const status = 'pendente'` -> mudar para `const status = 'em_preparacao'`
- Uma unica linha de alteracao

### Ficheiro 2: `src/components/entregador/PedidosDisponiveis.tsx`
- Na funcao `handleAceitarRota`, apos actualizar `rotas_otimizadas`, adicionar:
  - Buscar os `pedidos_ids` da rota
  - Actualizar cada pedido com `entregador_id` e `status_pedido = 'a_caminho'`

### Ficheiro 3: `src/components/padaria/OrdersManagement.tsx`
- Adicionar channel Realtime na tabela `rotas_otimizadas` para detectar quando `status` muda para `'aceita'`
- Ao detectar, mostrar toast com info do entregador e refrescar lista de pedidos

### Ficheiro 4: `src/components/padaria/DashboardMetrics.tsx`
- Adicionar `<SelectItem value="year">Ultimo Ano</SelectItem>` ao selector
- Adicionar logica `if (period === "year") startDate.setFullYear(now.getFullYear() - 1)` no calculo de datas

### Fluxo Integrado Final
```text
Cliente faz pedido
    |
    v
process-order: cria pedido com status 'em_preparacao' + desconta stock
    |
    v
Padaria recebe notificacao Realtime (som + toast "Novo Pedido!")
Dashboard actualiza metricas e lista de pedidos automaticamente
    |
    v
processar-pedidos-prontos (cron): detecta pedidos prontos -> cria rota
    |
    v
Entregador ve rota disponivel com lucro estimado
    |
    v
Entregador aceita rota -> actualiza pedidos com entregador_id + status 'a_caminho'
    |
    v
Padaria recebe notificacao "Entregador X vai levar a encomenda"
Cliente ve tracking actualizado com info do entregador
```



# Plano: Pedidos por Distancia + Correccao de Erros

## 1. Pedidos Disponiveis com Filtro por Distancia

### Problema Actual
O componente `PedidosDisponiveis.tsx` mostra todas as rotas pendentes sem considerar a distancia entre o entregador e a padaria. O entregador nao tem forma de distinguir rotas proximas de rotas distantes.

### Solucao
Adicionar duas sub-abas dentro da aba "Disponiveis":
- **"Proximos"** (default) - mostra apenas rotas dentro de um raio configuravel (ex: 10km) da posicao actual do entregador
- **"Todos"** - mostra todas as rotas disponiveis, incluindo as que estao fora do alcance

Para cada rota, mostrar a distancia entre o entregador e a padaria de recolha, usando as coordenadas do `entregador_status` e da tabela `padarias` (`coordenadas_lat`, `coordenadas_lng`).

### Alteracoes em `PedidosDisponiveis.tsx`:
- Buscar a posicao actual do entregador da tabela `entregador_status`
- Buscar `coordenadas_lat` e `coordenadas_lng` das padarias junto com as rotas
- Calcular distancia (Haversine) entre entregador e cada padaria
- Adicionar `Tabs` internas: "Proximos" (filtrado por raio) e "Todos"
- Mostrar badge de distancia em cada card de rota
- Ordenar por distancia (mais proximos primeiro)
- Rotas fora do alcance mostram badge "Fora do alcance" a vermelho na aba "Todos"

## 2. Erros e Problemas Identificados no Sistema

### Bug 1: `ListaParagens.tsx` - Logica de "todos entregues" incorrecta (Linha 74)
```
const todosEntregues = rota.pedidos_ids.every((id: string) => id === pedidoParaComprovar);
```
Isto verifica se TODOS os IDs sao iguais ao pedido actual, nao se todos foram entregues. So funciona se houver 1 pedido. Deve verificar no banco de dados quantos pedidos dessa rota ja tem status `entregue`.

**Correccao**: Apos marcar o pedido como entregue, buscar todos os pedidos da rota e verificar se todos tem `status_pedido = 'entregue'`.

### Bug 2: `PedidosDisponiveis.tsx` - Filtro duplo redundante (Linhas 72-73)
```
.or('entregador_id.is.null,status.eq.aguardando_entregador,status.eq.pendente')
.in('status', ['pendente', 'aguardando_entregador'])
```
O `.or()` e o `.in()` conflituam. O `.or()` ja filtra por status, e o `.in()` sobrepoe-se. Isto pode causar resultados inesperados.

**Correccao**: Remover o `.or()` e usar apenas `.is('entregador_id', null).in('status', ['pendente', 'aguardando_entregador'])`.

### Bug 3: `GanhosSection.tsx` - RLS policy referencia tabela `usuarios` em vez de `profiles`
A tabela `pagamentos_comissoes` tem uma RLS policy que referencia `usuarios` em vez de `profiles`:
```sql
entregador_id IN (SELECT usuarios.id FROM usuarios WHERE usuarios.user_id = auth.uid())
```
Mas o sistema usa `profiles` como tabela principal de perfis. Se o entregador nao tiver registo em `usuarios`, os ganhos nunca aparecem.

**Correccao**: Migrar a RLS policy de `pagamentos_comissoes` para referenciar `profiles` em vez de `usuarios`.

### Bug 4: `NotificacaoRota.tsx` - `handleRecusar` chamado no cleanup do useEffect
Na linha 37, quando o temporizador chega a 0, chama `handleRecusar()` que faz uma chamada assinccrona. Mas se o componente desmontar durante essa chamada, pode causar erros.

**Correccao**: Adicionar verificacao de componente montado.

### Bug 5: `ComprovativoEntrega.tsx` - PIN nao e validado contra nenhum valor
O PIN de 4 digitos e aceite sem verificacao. Qualquer PIN funciona. Nao ha PIN real gerado e enviado ao cliente.

**Correccao**: Para a versao actual, documentar como limitacao. No futuro, gerar PIN no momento do pedido e validar.

### Bug 6: `HistoricoViagens.tsx` - Sem filtros por periodo
O historico mostra apenas as ultimas 50 viagens sem opcao de filtrar por dia, semana, mes ou ano (conforme pedido do utilizador).

**Correccao**: Adicionar filtros de periodo.

## 3. Ficheiros a Alterar

### `src/components/entregador/PedidosDisponiveis.tsx` (reescrever)
- Importar `Tabs` para sub-abas "Proximos" / "Todos"
- Buscar coordenadas do entregador via `entregador_status`
- Buscar coordenadas das padarias na query (ja faz join com `padarias`)
- Adicionar funcao `calculateDistance` (Haversine)
- Filtrar e ordenar rotas por distancia
- Mostrar distancia ate a padaria em cada card
- Badge visual para "Dentro do alcance" vs "Fora do alcance"

### `src/components/entregador/ListaParagens.tsx` (corrigir bug)
- Substituir logica de verificacao `todosEntregues` por query ao banco de dados

### `src/components/entregador/HistoricoViagens.tsx` (adicionar filtros)
- Adicionar filtros: Hoje, Esta Semana, Este Mes, Este Ano, Todos
- Usar `date-fns` para calcular ranges de datas

### `supabase/migrations/` (nova migracao)
- Corrigir RLS policy de `pagamentos_comissoes` para referenciar `profiles` em vez de `usuarios`

## 4. Resumo das Mudancas

| Ficheiro | Tipo | Descricao |
|----------|------|-----------|
| `PedidosDisponiveis.tsx` | Funcionalidade | Sub-abas Proximos/Todos com filtro por distancia |
| `ListaParagens.tsx` | Bug fix | Corrigir logica de "todos entregues" |
| `HistoricoViagens.tsx` | Funcionalidade | Filtros por periodo (dia/semana/mes/ano) |
| Migracao SQL | Bug fix | Corrigir RLS de `pagamentos_comissoes` |

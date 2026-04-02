

## Plano: Correcoes Criticas do Sistema

### Problemas Identificados e Solucoes

---

### 1. Rate Limit de 60 segundos no registo do entregador

**Problema:** O Supabase impoe um rate limit de emails (1 por 60s). O sistema ja trata isso, mas a mensagem nao e suficientemente clara e o cooldown aparece mesmo quando o registo foi bem-sucedido.

**Solucao:** Melhorar a mensagem em `Register.tsx` para explicar que e um limite do servidor de emails, nao um erro do utilizador. Adicionar contexto: "O servidor de verificacao limita envios a 1 email por minuto. O seu registo pode ja ter sido criado -- verifique a sua caixa de entrada."

---

### 2. GPS nao puxa a localizacao certa

**Problema:** O GPS funciona, mas mapeia para a localizacao fixa mais proxima de uma lista de apenas 6 locais (`MAPUTO_LOCATIONS`). Se o utilizador estiver a 5km de qualquer um deles, o resultado e impreciso.

**Solucao (Problema 2 + 3 combinados):** Substituir o sistema de localizacoes fixas por **Mapbox Geocoding API** (reverse geocoding). Quando o GPS detecta as coordenadas, o sistema faz reverse geocoding para obter o endereco real. O campo de localizacao passa a ser um **input de texto com autocomplete** usando a Mapbox Search/Geocoding API, em vez de um dropdown limitado.

---

### 3. Sistema de localizacao super limitado

**Problema:** `MAPUTO_LOCATIONS` tem apenas 6 entradas (Central, Polana, Coop, Sommerschield, Matola, Cidade de Maputo). Impossivel cobrir toda a area metropolitana.

**Solucao:** Criar um novo componente `MapboxAddressInput` que:
- Usa a **Mapbox Geocoding API** para autocomplete de enderecos
- Filtra resultados para Mocambique (`country=mz`)
- Retorna coordenadas exactas + endereco formatado
- Substitui o `LocationSelect` no registo e o dropdown no checkout
- GPS + reverse geocoding preenche automaticamente o campo

**Ficheiros afectados:**
- Novo: `src/components/MapboxAddressInput.tsx`
- Alterar: `src/components/CheckoutCart.tsx` -- substituir dropdown por `MapboxAddressInput`
- Alterar: `src/pages/Register.tsx` -- substituir `LocationSelect` por `MapboxAddressInput`
- Alterar: `src/components/LocationFilter.tsx` -- substituir dropdown por autocomplete
- Alterar: `src/pages/CompletarCadastroPadaria.tsx` -- usar autocomplete para endereco da padaria
- O ficheiro `constants/locations.ts` permanece como fallback mas deixa de ser a fonte principal

---

### 4. Pedidos nao aparecem para o entregador

**Problema critico:** Ha uma cadeia de dependencias que impede os pedidos de chegarem ao entregador:

1. O pedido e criado com `status_pedido = 'em_preparacao'`
2. A funcao `processar-pedidos-prontos` converte pedidos em rotas, **mas so cria rotas se houver pelo menos 2 pedidos por padaria**
3. O `PedidosDisponiveis` so mostra **rotas**, nao pedidos individuais
4. O raio de filtragem e de apenas 10km (aba "Proximos")

**Resultado:** Com 1 unico pedido de teste, nenhuma rota e criada, logo nada aparece.

**Solucao multi-parte:**

**A) Mostrar pedidos individuais alem de rotas:**
- Alterar `PedidosDisponiveis.tsx` para buscar tambem pedidos `em_preparacao` sem `entregador_id` e sem rota atribuida
- Mostrar esses pedidos como cards individuais que o entregador pode aceitar directamente
- Quando aceite, o pedido passa para `a_caminho` e o `entregador_id` e preenchido

**B) Aumentar raio para 30km:**
- Alterar `DEFAULT_RANGE_KM` de 10 para 30 em `src/lib/distance.ts`

**C) Remover requisito minimo de 2 pedidos:**
- Alterar `processar-pedidos-prontos` para criar rotas mesmo com 1 pedido (ou simplesmente permitir que o entregador aceite pedidos individuais sem rota)

---

### 5. Problemas adicionais identificados

**A) Pedido usa `distancia_km: 5.0` hardcoded:**
Em `process-order/index.ts` (linha 228), a distancia e sempre 5km. Com o novo sistema de geocoding, podemos calcular a distancia real entre padaria e cliente.

**B) Sem notificacao real-time para entregadores sobre novos pedidos:**
O sistema tem subscription para `rotas_otimizadas` mas nao para `pedidos` directamente. Adicionar subscription para pedidos `em_preparacao`.

**C) Padaria sem coordenadas bloqueia todo o fluxo:**
Se a padaria nao tiver `coordenadas_lat/lng`, a funcao `processar-pedidos-prontos` ignora o pedido silenciosamente. No completar cadastro da padaria, devemos obrigar o preenchimento de coordenadas via o novo `MapboxAddressInput`.

---

### Resumo de alteracoes

| Ficheiro | Alteracao |
|----------|-----------|
| `src/components/MapboxAddressInput.tsx` | **Novo** -- autocomplete de enderecos via Mapbox Geocoding |
| `src/components/CheckoutCart.tsx` | Substituir dropdown fixo por `MapboxAddressInput` |
| `src/pages/Register.tsx` | Substituir `LocationSelect` por `MapboxAddressInput`; melhorar mensagem de rate limit |
| `src/components/entregador/PedidosDisponiveis.tsx` | Buscar e mostrar pedidos individuais (sem rota); aumentar visibilidade |
| `src/lib/distance.ts` | `DEFAULT_RANGE_KM` de 10 para 30 |
| `supabase/functions/processar-pedidos-prontos/index.ts` | Permitir rotas com 1 pedido |
| `src/pages/CompletarCadastroPadaria.tsx` | Usar `MapboxAddressInput` para coordenadas |
| `src/components/LocationFilter.tsx` | Adaptar para autocomplete |


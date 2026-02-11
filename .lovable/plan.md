
# Plano: Corrigir Erros de Finalização e Unificar Fluxos

## Problemas Raiz Identificados

### 1. Erro na finalização (Problemas 1 e 4)
O erro vem da Edge Function `process-order`. Nos logs aparece:
```
Could not find the 'padaria_id' column of 'itens_pedido' in the schema cache
```
A tabela `itens_pedido` nao tem coluna `padaria_id`, mas o codigo da Edge Function inclui `padaria_id` nos items ao fazer insert. Apos corrigir isto, o pedido sera criado com sucesso, o pagamento confirmado e o utilizador redirecionado para a pagina de recibo.

### 2. Fluxo "Ver Detalhes" diferente (Problema 2)
O `ProductDetail.tsx` (pagina de detalhes do produto) tem o seu proprio fluxo isolado - navega directamente para `/order-confirmation` com dados incompativeis (envia `produto` e `quantity` em vez de items do carrinho). Deve ser alterado para adicionar o produto ao carrinho e levar o utilizador ao checkout unificado (`/fazer-pedido`).

### 3. GPS no telemovel (Problema 3)
A mensagem de erro no `CheckoutCart.tsx` quando a permissao e negada e generica. No telemovel, o utilizador precisa de instrucoes especificas para Android e iOS sobre como activar a localizacao nas configuracoes do dispositivo.

## Solucao Tecnica

### Ficheiro 1: `supabase/functions/process-order/index.ts`
- Remover `padaria_id` do objecto `orderItems` antes do insert na tabela `itens_pedido`
- A tabela `itens_pedido` so tem: `pedido_id`, `produto_id`, `quantidade`, `preco_unitario`, `subtotal`
- O `padaria_id` ja esta guardado na tabela `pedidos`, nao precisa estar nos items

### Ficheiro 2: `src/pages/ProductDetail.tsx`
- Remover o fluxo proprio de checkout (location selector, delivery area checker, botao "Encomendar")
- Substituir por: botao "Adicionar ao Carrinho" que usa `useCart().addItem()` para adicionar o produto ao carrinho
- Apos adicionar, mostrar opcao de "Ir para Checkout" que navega para `/fazer-pedido`
- Manter a exibicao de detalhes do produto, preco, padaria, e selector de quantidade

### Ficheiro 3: `src/components/CheckoutCart.tsx`
- Melhorar a mensagem de erro de GPS para telemovel com instrucoes especificas:
  - Android: "Configuracoes > Localizacao > Activar GPS" e "Configuracoes do navegador > Permissoes do site > Localizacao"
  - iOS: "Definicoes > Privacidade > Servicos de localizacao > Safari > Permitir"
- Detectar se o utilizador esta no telemovel via `navigator.userAgent` para mostrar instrucoes adequadas

### Fluxo Corrigido
```text
ProductDetail -> Adicionar ao Carrinho -> /fazer-pedido -> CheckoutCart
Cart           -> Ir para Checkout     -> /fazer-pedido -> CheckoutCart
                                                            |
                                                    Localização (GPS/manual)
                                                    Data + Horário
                                                    Pagamento (PIN/dinheiro)
                                                    process-order (Edge Function)
                                                            |
                                                    /order-confirmation (recibo)
```

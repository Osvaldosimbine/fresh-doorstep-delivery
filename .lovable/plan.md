

# Plano: Fluxo Unificado de Pedido (Do Inicio ao Fim)

## Problemas Identificados

1. **Localização automatica falha**: O sistema mostra erro de autorização sem guiar o utilizador para habilitar a localização no navegador.
2. **Dois fluxos de checkout diferentes**: A pagina `/cart` (Cart.tsx) tem um fluxo simplificado (simula pedido, sem pagamento real), enquanto o `CheckoutCart.tsx` usado no `/fazer-pedido` tem o fluxo completo com pagamento. Devem ser identicos.
3. **Agendamento limitado**: Os horarios mostrados sao fixos e nao incluem datas futuras. O cliente precisa poder agendar para dias futuros.
4. **Sem recibo apos finalizar**: Apos processar o pedido, o sistema redireciona para o tracking mas nao mostra recibo nem detalhes do pagamento efectuado.

## Solucao

### 1. Corrigir Localização Automatica
- No `CheckoutCart.tsx`, adicionar um botao "Usar localização atual" junto ao selector de localização manual
- Quando o utilizador clicar, pedir permissão de geolocalização (chamada directa no click handler)
- Se a permissão for negada, mostrar instrucoes claras de como habilitar no navegador
- Manter o select manual como fallback

### 2. Unificar o Fluxo de Checkout
- Modificar `Cart.tsx` para redirecionar ao `CheckoutCart.tsx` em vez de ter o seu proprio fluxo
- Quando o utilizador clicar "Finalizar Pedido" no `/cart`, deve ser levado para o mesmo fluxo do `CheckoutCart` (com localização, pagamento, agendamento)
- Remover o fluxo duplicado de finalização do `Cart.tsx`

### 3. Melhorar Agendamento com Datas Futuras
- Adicionar selecção de data (hoje/amanha/data especifica) ao `CheckoutCart.tsx`
- Combinar data + horario no campo `horario_agendado`
- Quando fora do horario de expediente, pre-seleccionar automaticamente o proximo slot disponivel
- Mostrar claramente ao cliente que o pedido sera processado no horario seleccionado

### 4. Pagina de Confirmação Pos-Pedido com Recibo
- Apos o pagamento ser processado com sucesso no `CheckoutCart`, redirecionar para uma pagina de confirmação que mostre:
  - Resumo completo do pedido (itens, quantidades, precos)
  - Metodo de pagamento utilizado
  - Valor total pago
  - Horario agendado (se aplicavel)
  - Recibo descarregavel (PDF via `ReceiptGenerator`)
  - Botao para acompanhar entrega (link para `/order-tracking/:id`)

---

## Detalhes Tecnicos

### Cart.tsx (modificacoes)
- Remover todo o fluxo de checkout interno (handleCheckout, selecção de horario)
- Manter apenas a listagem de itens com +/- e botao "Ir para Checkout"
- Botao "Ir para Checkout" navega para `/fazer-pedido` que usa o `CheckoutCart`

### CheckoutCart.tsx (modificacoes)
- Adicionar botao de geolocalização com `navigator.geolocation.getCurrentPosition` chamado directamente no click handler
- Mostrar instrucoes se a permissão for negada (com link para configuracoes do navegador)
- Adicionar selector de data (calendario simples: Hoje, Amanha, ou data futura com date picker)
- Combinar data + time slot no campo `horario_agendado` enviado ao `process-order`
- Garantir que o dialog de pagamento aparece correctamente para TODOS os metodos (incluindo "dinheiro")
- Corrigir bug: `handleCheckout` chama `setShowPaymentDialog(true)` sem validar campos, e `handleFinalizePedido` tambem chama - unificar num unico fluxo

### Fluxo corrigido no CheckoutCart:
```text
1. Utilizador revisa itens no carrinho
2. Selecciona localização (manual ou GPS)
3. Selecciona data + horario de entrega
4. Selecciona metodo de pagamento
5. Clica "Finalizar Pedido"
6. Validação de campos obrigatorios
7. Dialog de pagamento aparece (PIN para mobile money, info para dinheiro)
8. Confirma pagamento
9. process-order Edge Function e chamada
10. Redireciona para pagina de confirmação com recibo
```

### Nova pagina de confirmação pos-pedido
- Reutilizar `OrderConfirmation.tsx` mas alimentado com dados reais do pedido (via route state ou fetch do pedido pelo ID)
- Incluir `ReceiptGenerator` com dados completos
- Incluir detalhes do pagamento (metodo, valor)
- Botoes: "Ver Recibo (PDF)", "Acompanhar Entrega", "Fazer Novo Pedido"

### Ficheiros a modificar:
1. `src/pages/Cart.tsx` - Simplificar para apenas listagem + botao de checkout
2. `src/components/CheckoutCart.tsx` - Adicionar GPS, melhorar agendamento, corrigir fluxo de pagamento
3. `src/pages/OrderConfirmation.tsx` - Receber dados reais do pedido e mostrar recibo completo
4. `src/pages/FazerPedido.tsx` - Ajustar para ser o ponto unico de checkout
5. `src/lib/timeUtils.ts` - Adicionar funcoes para slots com datas futuras


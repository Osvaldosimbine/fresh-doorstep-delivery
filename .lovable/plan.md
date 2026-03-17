

## Plano: Limpeza da Base de Dados + Correções Técnicas + Melhoria do Checkout

### 1. Limpar dados de teste da base de dados

Existem 8 perfis na tabela `profiles` e 8 entradas em `user_roles`, além de 12 pedidos e 16 itens de pedido. Todos precisam ser eliminados para começar do zero.

**Ação (via SQL insert tool):** Eliminar dados nas seguintes tabelas, nesta ordem (respeitando dependências):
- `itens_pedido` (depende de pedidos)
- `pedidos`
- `pagamentos_comissoes`
- `entregas`
- `avaliacoes_entregador`
- `comprovativo_entrega`
- `problemas_rota`
- `pedidos_saque`
- `carteira_entregador`
- `entregador_status`
- `rotas_otimizadas`
- `user_roles`
- `profiles`

**Nota:** Os utilizadores em `auth.users` só podem ser eliminados manualmente no [dashboard do Supabase](https://supabase.com/dashboard/project/tbrmfcglxwwvjgulskfj/auth/users). Será necessário que elimine os utilizadores por lá após a limpeza das tabelas públicas.

### 2. Defeitos técnicos identificados

**A) Trigger `handle_new_user` — padaria mapeada incorrectamente**
O enum `tipo_usuario` só aceita `'cliente'` e `'entregador'`. Quando alguém se regista como padaria, o trigger atribui `tipo_usuario = 'cliente'` no perfil. Isto causa confusão nos dados. A role em `user_roles` é correctamente atribuída como `'padaria'`, mas o campo `tipo_usuario` na tabela `profiles` fica errado.

**Solução:** Adicionar `'padaria'` ao enum `tipo_usuario` via migração:
```sql
ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'padaria';
```
E actualizar o trigger para mapear correctamente.

**B) `nome_completo` vazio para o utilizador Osvaldo Simbine**
O perfil `osvaldosimbine.3@gmail.com` tem `nome_completo` vazio. Isto indica que o campo não foi enviado correctamente durante o registo. Será corrigido com a limpeza e novo registo.

### 3. Melhoria do fluxo de checkout

**Problema actual:** Nas páginas `FazerPedido.tsx` e `Pedidos.tsx`, quando o utilizador clica "Finalizar Pedido", o `CheckoutCart` aparece na mesma página com um botão "Voltar ao carrinho" / "Voltar às padarias" que mostra novamente a listagem de padarias. O utilizador quer:
- No checkout, **não mostrar dados de padarias**
- Se quiser voltar aos produtos, ter um caminho claro

**Solução:** Modificar `FazerPedido.tsx` e `Pedidos.tsx`:
- Quando `showCheckout = true`, o botão de volta deve dizer **"Voltar aos Produtos"** e redirecionar para `/fazer-pedido` (lista de padarias/produtos), não mostrar a lista de padarias na mesma página
- No `CheckoutCart.tsx`, quando o carrinho está vazio, o botão "Ver Produtos" já navega para `/products` — alterar para `/fazer-pedido` que é o fluxo principal de pedidos
- Adicionar um link/botão claro **"Continuar Comprando"** no topo do checkout para voltar à selecção de produtos

### Resumo de alterações

| Item | Tipo |
|------|------|
| Eliminar todos os dados das tabelas (profiles, user_roles, pedidos, etc.) | SQL (insert tool) |
| Eliminar utilizadores de `auth.users` | Manual (dashboard) |
| Adicionar 'padaria' ao enum `tipo_usuario` | Migração SQL |
| Actualizar trigger `handle_new_user` | Migração SQL |
| Corrigir botão de volta no checkout (`FazerPedido.tsx`, `Pedidos.tsx`) | Código |
| Corrigir link "Ver Produtos" no `CheckoutCart.tsx` | Código |


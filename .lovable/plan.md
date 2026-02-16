

# Plano: Navegacao Dedicada para o Entregador

## Problema

O Header e o MobileNavigation tratam o entregador como um utilizador normal, mostrando links irrelevantes: "Pagina Principal", "Como Funciona", "Produtos", "Registro" e carrinho de compras. O entregador so precisa de ver o seu dashboard e informacoes de entregas.

## Alteracoes

### 1. Header.tsx - Navegacao por Role

Actualmente so distingue `padaria` dos restantes. Adicionar condicao para `entregador`:

- **Role `entregador`**: Mostrar apenas "Meu Dashboard" (link para `/entregador/dashboard`)
- **Role `padaria`**: Manter "Meu Painel" (como esta)
- **Outros**: Manter navegacao actual (Pagina Principal, Como Funciona, Produtos, etc.)
- **Esconder carrinho** para entregadores (ja esconde para padaria, adicionar entregador)

### 2. MobileNavigation.tsx - Menu Mobile por Role

O menu mobile mostra sempre os mesmos items. Alterar para verificar o role:

- **Role `entregador`**: Mostrar apenas "Dashboard" com link para `/entregador/dashboard`
- **Esconder carrinho** no menu mobile para entregadores
- **Outros roles**: Manter menu actual

### 3. Redireccionamento na Raiz

Actualmente quando o entregador acede a `/`, ve a pagina principal com produtos. O `RoleBasedRedirect.tsx` ja existe mas nao esta a ser usado na rota `/`. Verificar se o entregador logado deve ser redireccionado automaticamente para `/entregador/dashboard` ao aceder a `/`.

## Detalhes Tecnicos

### Header.tsx
- Linha 59-83: Onde esta o `if (role === 'padaria')`, adicionar `else if (role === 'entregador')` com link "Meu Dashboard"
- Linha 89: Onde esconde o carrinho para padaria, adicionar `&& role !== 'entregador'`

### MobileNavigation.tsx
- Linha 54-60: Condicionar `navItems` baseado no `userProfile?.role`
- Se `entregador`, usar array reduzido com apenas o dashboard
- Esconder carrinho badge para entregador

### Index.tsx ou ProtectedRoute
- Adicionar verificacao: se o utilizador logado e `entregador`, redirecionar de `/` para `/entregador/dashboard`

## Resultado

Entregador logado vera:
- Header com logo + "Meu Dashboard" + botao Sair
- Sem carrinho, sem produtos, sem "Como Funciona", sem "Registro"
- Redireccionado automaticamente para o dashboard ao aceder a `/`


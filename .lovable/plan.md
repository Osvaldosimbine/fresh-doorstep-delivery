

# Plano: Ambiente Profissional do Entregador

## Resumo

Transformar o dashboard do entregador num ambiente profissional completo com perfil detalhado, carteira digital, comprovativo de entrega, reporte de problemas e optimizacoes para Mocambique.

## Alteracoes Necessarias

### 1. Base de Dados - Novas Tabelas e Colunas

**Tabela `profiles` - novos campos:**
- `foto_url` (text) - URL da foto de perfil
- `tipo_veiculo` (text) - Bicicleta, Motorizada, etc.
- `matricula_veiculo` (text) - Matricula para identificacao
- `rating_medio` (numeric, default 5.0) - Avaliacao media
- `total_entregas` (integer, default 0) - Contador total
- `km_acumulados` (numeric, default 0) - Quilometragem total

**Nova tabela `carteira_entregador`:**
- `id`, `entregador_id`, `saldo_disponivel` (numeric, default 0), `saldo_pendente` (numeric, default 0), `created_at`, `updated_at`

**Nova tabela `pedidos_saque`:**
- `id`, `entregador_id`, `valor`, `metodo_pagamento` (mpesa/emola), `numero_conta`, `status` (pendente/processado/rejeitado), `created_at`, `processado_em`

**Nova tabela `comprovativo_entrega`:**
- `id`, `pedido_id`, `entregador_id`, `tipo` (foto/pin), `foto_url`, `pin_confirmado` (boolean), `created_at`

**Nova tabela `problemas_rota`:**
- `id`, `rota_id`, `entregador_id`, `tipo_problema` (pneu_furado/endereco_nao_encontrado/padaria_sem_stock/outro), `descricao`, `status` (aberto/resolvido), `created_at`

**Nova tabela `avaliacoes_entregador`:**
- `id`, `entregador_id`, `pedido_id`, `cliente_id`, `nota` (1-5), `comentario`, `created_at`

**Storage bucket `entregador-fotos`** - para fotos de perfil e comprovativos de entrega.

### 2. Perfil do Entregador (Novo Componente)

Novo componente `src/components/entregador/PerfilEntregador.tsx` exibido na aba "Inicio" junto ao toggle de status:

- Foto de perfil com opcao de upload
- Nome completo, rating com estrelas
- Tipo de veiculo e matricula (editavel)
- Estatisticas: total entregas, km acumulados, taxa de pontualidade
- Indicador visual de nivel (Iniciante / Experiente / Veterano baseado no total de entregas)

### 3. Pedidos e Rotas Melhorados

Melhorar `PedidosDisponiveis.tsx`:
- Exibir rotas como "bundles" com titulo claro: "Rota Padaria X - 5 Entregas"
- Lucro estimado em destaque (ja existe, melhorar visual)
- Mini-mapa placeholder com indicacao de distancia e tempo
- Informacao resumida dos destinos (ja existe, melhorar layout)

### 4. Carteira Digital (Nova Aba)

Novo componente `src/components/entregador/CarteiraDigital.tsx`:

- Saldo disponivel em destaque grande
- Saldo pendente (entregas ainda nao confirmadas)
- Botao "Solicitar Pagamento" que abre dialog para escolher M-Pesa ou e-Mola
- Inserir numero de conta e valor
- Historico de saques com status
- Limite minimo para saque (ex: 100 MT)

### 5. Comprovativo de Entrega Digital

Modificar `ListaParagens.tsx` - ao marcar como entregue:
- Dialog com duas opcoes: "Tirar Foto" ou "PIN do Cliente"
- Opcao foto: usa `input type="file" capture="environment"` para camera
- Opcao PIN: campo de 4 digitos que o cliente recebe (gerado e guardado no pedido)
- So marca como entregue apos comprovativo

### 6. Botao "Problemas na Rota"

Novo componente `src/components/entregador/ReportarProblema.tsx`:
- Exibido nas Rotas Ativas
- Opcoes rapidas: "Pneu furado", "Endereco nao encontrado", "Padaria sem stock", "Outro"
- Campo de descricao opcional
- Alerta o sistema (insere na tabela `problemas_rota`)
- Toast de confirmacao

### 7. Reorganizar Dashboard

Reorganizar `EntregadorDashboard.tsx` com 6 abas:
1. **Inicio** - Perfil + Status Toggle
2. **Disponiveis** - Pedidos/Rotas marketplace
3. **Rotas Ativas** - Rota actual + lista paragens + reportar problema
4. **Carteira** - Saldo + solicitar pagamento
5. **Ganhos** - Metricas e graficos
6. **Historico** - Viagens concluidas

## Detalhes Tecnicos

### Migracao SQL
```text
- ALTER TABLE profiles ADD COLUMN foto_url, tipo_veiculo, matricula_veiculo, rating_medio, total_entregas, km_acumulados
- CREATE TABLE carteira_entregador com RLS (entregador ve so a sua)
- CREATE TABLE pedidos_saque com RLS (entregador ve/cria os seus)
- CREATE TABLE comprovativo_entrega com RLS (entregador cria, cliente/padaria ve)
- CREATE TABLE problemas_rota com RLS (entregador cria/ve os seus, admin ve todos)
- CREATE TABLE avaliacoes_entregador com RLS (cliente cria, entregador ve as suas)
- CREATE storage bucket entregador-fotos (public)
```

### Ficheiros Novos
- `src/components/entregador/PerfilEntregador.tsx`
- `src/components/entregador/CarteiraDigital.tsx`
- `src/components/entregador/ReportarProblema.tsx`
- `src/components/entregador/ComprovativoEntrega.tsx`

### Ficheiros Modificados
- `src/pages/EntregadorDashboard.tsx` - nova aba Carteira + perfil no inicio
- `src/components/entregador/ListaParagens.tsx` - integrar comprovativo antes de marcar entregue
- `src/components/entregador/PedidosDisponiveis.tsx` - melhorar visual dos bundles
- `src/components/entregador/StatusToggle.tsx` - integrar com perfil

### Nota sobre Localizacao Live e Geofencing
A localizacao em tempo real (partilha com admin/cliente) e o auto-check-in por geofencing requerem um servico de background tracking que funciona melhor com Capacitor (app nativa). No browser, podemos implementar:
- Actualizacao periodica da posicao enquanto o turno esta activo (via `setInterval` + `watchPosition`)
- Deteccao de proximidade ao endereco (calcular distancia entre coordenadas)
- Mas o geofencing automatico real so funciona fiavel numa app nativa

### Nota sobre Modo Economia de Dados
O mapa actual usa Google Maps via link externo (nao carrega mapa inline). Manter esta abordagem e leve. Para futuro, considerar Leaflet com tiles offline via service worker.


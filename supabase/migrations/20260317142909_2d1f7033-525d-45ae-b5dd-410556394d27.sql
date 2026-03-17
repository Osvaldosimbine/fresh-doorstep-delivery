
-- Clean all test data from tables (respecting foreign key dependencies)
DELETE FROM itens_pedido;
DELETE FROM entregas;
DELETE FROM pagamentos_comissoes;
DELETE FROM avaliacoes_entregador;
DELETE FROM comprovativo_entrega;
DELETE FROM problemas_rota;
DELETE FROM pedidos_saque;
DELETE FROM pedidos;
DELETE FROM carteira_entregador;
DELETE FROM entregador_status;
DELETE FROM rotas_otimizadas;
DELETE FROM produtos;
DELETE FROM padarias;
DELETE FROM user_roles;
DELETE FROM profiles;
DELETE FROM usuarios;
DELETE FROM audit_logs;

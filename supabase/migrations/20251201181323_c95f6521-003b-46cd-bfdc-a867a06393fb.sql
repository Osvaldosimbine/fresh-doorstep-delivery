-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para processar pedidos prontos a cada 5 minutos
SELECT cron.schedule(
  'processar-pedidos-prontos-auto',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT
    net.http_post(
        url:='https://tbrmfcglxwwvjgulskfj.supabase.co/functions/v1/processar-pedidos-prontos',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicm1mY2dseHd3dmpndWxza2ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNDEwMjIsImV4cCI6MjA2OTgxNzAyMn0.vJ9H2q8tHfTdVj7ttgHvRuMumBjg4KR20HUmqgRLDbw"}'::jsonb,
        body:='{"timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);

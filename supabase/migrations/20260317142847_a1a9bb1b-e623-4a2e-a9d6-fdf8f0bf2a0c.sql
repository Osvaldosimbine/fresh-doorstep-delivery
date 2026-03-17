
-- Add 'padaria' to tipo_usuario enum
ALTER TYPE tipo_usuario ADD VALUE IF NOT EXISTS 'padaria';

-- Update trigger to correctly map padaria
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tipo_usuario tipo_usuario;
  v_role app_role;
  v_raw_tipo text;
BEGIN
  v_raw_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cliente');
  
  -- Map to tipo_usuario enum (now supports 'cliente', 'entregador', 'padaria')
  BEGIN
    v_tipo_usuario := v_raw_tipo::tipo_usuario;
  EXCEPTION WHEN invalid_text_representation THEN
    v_tipo_usuario := 'cliente';
  END;
  
  -- Map to app_role enum (includes 'padaria', 'admin', 'cliente', 'entregador')
  BEGIN
    v_role := v_raw_tipo::app_role;
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'cliente';
  END;

  -- Insert into profiles table
  INSERT INTO public.profiles (
    user_id,
    nome_completo,
    email,
    telefone,
    tipo_usuario,
    role,
    localizacao,
    endereco,
    numero_documento
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    v_tipo_usuario,
    v_raw_tipo,
    NEW.raw_user_meta_data->>'localizacao',
    NEW.raw_user_meta_data->>'endereco',
    NEW.raw_user_meta_data->>'numero_documento'
  );
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

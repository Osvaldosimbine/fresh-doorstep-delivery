
-- Fix handle_new_user trigger to handle 'padaria' tipo_usuario gracefully
-- The tipo_usuario enum only has 'cliente' and 'entregador', but app_role has 'padaria'
-- So we need to map 'padaria' to 'cliente' for tipo_usuario column, while keeping the role correct

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tipo_usuario tipo_usuario;
  v_role app_role;
  v_raw_tipo text;
BEGIN
  v_raw_tipo := COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'cliente');
  
  -- Map to tipo_usuario enum (only 'cliente' and 'entregador' are valid)
  IF v_raw_tipo = 'entregador' THEN
    v_tipo_usuario := 'entregador';
  ELSE
    v_tipo_usuario := 'cliente';
  END IF;
  
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
$$;

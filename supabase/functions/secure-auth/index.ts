import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Secure password generation using Web Crypto API
function generateSecurePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"']/g, '');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (flexible Mozambique format)
function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  // Accept formats: 823456789, +258823456789, 258823456789, 8234-56789, etc.
  const phoneRegex = /^(\+?258)?[8][0-9]{8}$/;
  return phoneRegex.test(cleanPhone);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, userData } = await req.json();

    if (action === 'create_temporary_user') {
      // Validate input data
      if (!userData.email || !isValidEmail(userData.email)) {
        return new Response(
          JSON.stringify({ error: 'Valid email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!userData.telefone || !isValidPhone(userData.telefone)) {
        return new Response(
          JSON.stringify({ error: 'Valid phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize inputs
      const sanitizedData = {
        nome_completo: sanitizeInput(userData.nome_completo || ''),
        email: sanitizeInput(userData.email.toLowerCase()),
        telefone: sanitizeInput(userData.telefone),
        tipo_usuario: userData.tipo_usuario,
        localizacao: sanitizeInput(userData.localizacao || ''),
        endereco: sanitizeInput(userData.endereco || ''),
        numero_documento: sanitizeInput(userData.numero_documento || '')
      };

      // Generate secure temporary password
      const temporaryPassword = generateSecurePassword(16);

      // Create user with email verification disabled temporarily
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: sanitizedData.email,
        password: temporaryPassword,
        email_confirm: false, // Skip email verification for temporary users
        user_metadata: sanitizedData
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create profile record
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: authUser.user.id,
          nome_completo: sanitizedData.nome_completo,
          email: sanitizedData.email,
          telefone: sanitizedData.telefone,
          tipo_usuario: sanitizedData.tipo_usuario,
          localizacao: sanitizedData.localizacao,
          endereco: sanitizedData.endereco,
          numero_documento: sanitizedData.numero_documento,
          role: sanitizedData.tipo_usuario // Map tipo_usuario to role
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Cleanup: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the creation in audit log
      await supabaseAdmin.from('audit_logs').insert({
        user_id: authUser.user.id,
        action: 'CREATE_TEMPORARY_USER',
        table_name: 'profiles',
        record_id: authUser.user.id,
        new_values: sanitizedData
      });

      console.log(`Temporary user created: ${authUser.user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          user_id: authUser.user.id,
          temporary_password: temporaryPassword,
          message: 'Temporary user created successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'validate_user_data') {
      const errors = [];

      if (!userData.email || !isValidEmail(userData.email)) {
        errors.push('Valid email is required');
      }

      if (!userData.telefone || !isValidPhone(userData.telefone)) {
        errors.push('Valid phone number is required');
      }

      if (!userData.nome_completo || userData.nome_completo.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
      }

      if (!userData.tipo_usuario || !['cliente', 'padaria', 'entregador'].includes(userData.tipo_usuario)) {
        errors.push('Valid user type is required');
      }

      return new Response(
        JSON.stringify({ 
          valid: errors.length === 0,
          errors: errors
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-auth function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
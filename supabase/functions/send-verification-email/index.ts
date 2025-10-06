import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  token: string;
  type: string;
  redirectTo: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send verification email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, type, redirectTo }: VerificationEmailRequest = await req.json();
    
    console.log("Sending verification email to:", email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const confirmLink = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${redirectTo}`;

    const emailResponse = await resend.emails.send({
      from: "Padarize <onboarding@resend.dev>",
      to: [email],
      subject: "Confirme seu cadastro - Padarize",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              h1 {
                color: #1a1a1a;
                font-size: 24px;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                padding: 14px 32px;
                background-color: #F97316;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
                text-align: center;
              }
              .button:hover {
                background-color: #ea580c;
              }
              .code-box {
                background-color: #f5f5f5;
                border: 1px solid #e0e0e0;
                border-radius: 4px;
                padding: 12px;
                margin: 20px 0;
                text-align: center;
                font-family: 'Courier New', monospace;
                font-size: 18px;
                letter-spacing: 2px;
                color: #1a1a1a;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 12px;
                margin: 20px 0;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🍞 Bem-vindo ao Padarize!</h1>
                <p>Confirme seu email para começar</p>
              </div>
              
              <p>Olá!</p>
              
              <p>Obrigado por se cadastrar no Padarize. Para completar seu cadastro e começar a usar nossa plataforma, precisamos confirmar seu endereço de email.</p>
              
              <div style="text-align: center;">
                <a href="${confirmLink}" class="button">
                  Confirmar Email
                </a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">
                Ou copie e cole este código de confirmação:
              </p>
              
              <div class="code-box">
                ${token.substring(0, 6).toUpperCase()}
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas. Se não conseguir confirmar, você pode solicitar um novo email de confirmação.
              </div>
              
              <p style="font-size: 14px; color: #666;">
                Se você não se cadastrou no Padarize, pode ignorar este email com segurança.
              </p>
              
              <div class="footer">
                <p><strong>Padarize</strong> - Conectando você às melhores padarias</p>
                <p>Este é um email automático, por favor não responda.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

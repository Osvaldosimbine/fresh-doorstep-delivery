

## Diagnosis

The auth logs reveal the **root cause** clearly:

1. There is a **Send Email Auth Hook** still active in your Supabase dashboard, pointing to the `send-verification-email` Edge Function
2. This function uses **Resend** with `from: "onboarding@resend.dev"` (sandbox mode — can only send to Resend-verified emails)
3. The hook **fails** (500 error / timeout), Supabase retries, and you hit the **rate limit** (429)

You chose native Supabase email, but the hook intercepts ALL email sending before Supabase's native SMTP can act. The native email never gets a chance to send.

## Plan

### Step 1: Disable the Auth Hook (manual — required)

You must go to: **[Authentication → Hooks](https://supabase.com/dashboard/project/tbrmfcglxwwvjgulskfj/auth/hooks)**

- Find the **"Send Email"** hook pointing to `send-verification-email`
- **Delete/disable** it

This is the critical fix. Without this, no registration will work.

### Step 2: Improve Registration Form (code changes)

**Better error messages** — Map Supabase error codes to clear Portuguese messages:
- `over_email_send_rate_limit` → "Muitas tentativas. Aguarde 60 segundos."
- `user_already_exists` → "Este email já está cadastrado. Tente fazer login."
- `weak_password` → "Senha muito fraca. Use letras, números e símbolos."
- `validation_failed` → "Verifique os campos destacados em vermelho."
- Network errors → "Erro de conexão. Verifique sua internet."

**Better form UX:**
- Add a cooldown timer after submission to prevent rapid retries
- Show inline field errors immediately on blur (not just on submit)
- Disable submit button for 60 seconds after a rate limit error with countdown
- Add `mode: 'onBlur'` to react-hook-form so fields validate when user leaves them

### Step 3: Delete the broken Edge Function

Remove `supabase/functions/send-verification-email/` since native Supabase email handles everything. Also clean up `config.toml` to remove its entry.

### Summary of changes

| Item | Type |
|------|------|
| Disable Auth Hook in dashboard | Manual (user) |
| Rewrite `Register.tsx` error handling + UX | Code |
| Rewrite `EmailVerificationNotice.tsx` with cooldown | Code |
| Delete `send-verification-email` function | Code |
| Clean `config.toml` | Code |


# Podbij `rate_limit_email_sent` w Supabase Auth

## Tło

Supabase Auth ma **swój własny licznik** wysyłanych maili (`rate_limit_email_sent`), który działa **niezależnie od SMTP providera**. Domyślnie jest niski (2/godz. na default SMTP, ~30/godz. po podpięciu custom SMTP), bo zabezpiecza shared infrastructure.

Nawet po podpięciu Resend w `Authentication → SMTP Settings`, ten licznik **nie podbije się automatycznie**. Skutek: produkcyjne logi `auth` pokazują:

```
"error":"429: email rate limit exceeded"
```

a użytkownicy w rejestracji widzą "Za dużo prób rejestracji. Spróbuj ponownie za chwilę.".

## Fix (1 minuta, dwie opcje)

### Opcja A — Dashboard

1. `https://supabase.com/dashboard/project/unfcpipxraiyacyzqanh/auth/rate-limits`
2. Pole **"Rate limit for sending emails"** (per hour).
3. Ustaw `30` (lub `60` jeśli spodziewasz się większego ruchu — Resend free pozwala na 100/dzień, ~4/godz. średnio, ale Supabase liczy także resendy i reset-password, więc warto mieć zapas).
4. Save.

### Opcja B — Management API (CLI, idempotentne)

```bash
# Token: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="<twój-personal-access-token>"
export PROJECT_REF="unfcpipxraiyacyzqanh"

curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "rate_limit_email_sent": 30 }'
```

Weryfikacja:

```bash
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  | jq '{ rate_limit_email_sent, mailer_autoconfirm, external_email_enabled, smtp_host, smtp_sender_email }'
```

## Co zostało zrobione kod-side

Nawet z podbitym limitem zdarzy się, że user trafi w błąd "email już zajęty" (bo nie potwierdził konta wcześniej) albo "email not confirmed" przy logowaniu. W obu przypadkach formularze pokazują teraz przycisk **"Wyślij link potwierdzający ponownie"** (`ResendConfirmationButton` → `resendConfirmationAction` → `supabase.auth.resend({ type: 'signup' })`). To nie eskaluje na `rate_limit_email_sent` tak agresywnie, bo Supabase debouncuje per-user przez `signup_confirmation.period`.

## Diagnostyka jak znowu się posypie

```bash
# Logi Auth ostatnie 60 min
# (zastąp $PROJECT_REF jeśli zmieni się projekt)
curl -s "https://api.supabase.com/v1/projects/$PROJECT_REF/analytics/endpoints/logs.all?sql=$(printf 'SELECT event_message FROM auth_logs WHERE timestamp > now() - interval %s30 minutes%s ORDER BY timestamp DESC LIMIT 100' "'" "'" | jq -sRr @uri)" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | jq -r '.result[].event_message' | grep -i "rate\|429\|smtp"
```

Albo prościej z poziomu IDE — wywołaj MCP `user-supabase / get_logs` z `service: "auth"` i grep `email rate limit`.

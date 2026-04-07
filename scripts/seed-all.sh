#!/usr/bin/env bash
set -euo pipefail

# Uruchom wszystkie seed scripts w odpowiedniej kolejności
# Wymagane: SUPABASE_DB_URL ustawione w środowisku
# Użycie: ./scripts/seed-all.sh

DB_URL="${SUPABASE_DB_URL:?Ustaw SUPABASE_DB_URL}"

echo "▸ Applying main schema..."
psql "$DB_URL" -f supabase-schema.sql

echo "▸ Seeding content..."
psql "$DB_URL" -f scripts/seed-content.sql

echo "▸ Seeding achievements..."
psql "$DB_URL" -f scripts/seed-achievements.sql

echo "▸ Admin setup..."
psql "$DB_URL" -f scripts/admin-setup.sql

echo "▸ OSCE schemas..."
psql "$DB_URL" -f scripts/osce-simulation-schema.sql
psql "$DB_URL" -f scripts/osce-topic-session-schema.sql

echo "▸ Patches..."
psql "$DB_URL" -f scripts/patch-profiles-step8.sql
psql "$DB_URL" -f scripts/patch-session-step5.sql
psql "$DB_URL" -f scripts/osce-exam-tasks-jsonb-migrate.sql

echo "▸ Sync question counts..."
psql "$DB_URL" -f scripts/sync-topic-question-counts.sql

echo "✓ Done — all seeds applied."

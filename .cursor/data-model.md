# GripHook Data Model

Das Datenmodell von GripHook ist bewusst schlank gehalten und stellt Buckets in das Zentrum aller Auswertungen und Kollaborationslogik.[cite:2]
Es soll den MVP sauber abbilden und gleichzeitig offen für spätere Erweiterungen wie mehrere Admins, tiefere Settlements oder erweiterte Budgetperioden bleiben.[cite:2]

## Modellierungsgrundsätze

- Buckets sind das Kernobjekt der App.[cite:2]
- Einträge referenzieren optional einen Bucket.[cite:2]
- Kategorien sind wiederverwendbar und nicht für private/shared Trennung zuständig.[cite:2]
- Shared-Mitgliedschaften liegen separat in einer Join-Tabelle.[cite:2]
- Prozentanteile für Shared Buckets liegen auf den Mitgliedschaften.[cite:2]
- Sichtbarkeit und Schreibrechte werden über Supabase Auth und RLS abgesichert.[web:93]

## Kernentitäten

### `profiles`

Erweitert Supabase Auth um anwendungsbezogene Benutzerdaten.[web:93]

Empfohlene Felder:

- `id uuid primary key` – referenziert `auth.users.id`
- `email text`
- `username text unique`
- `display_name text`
- `avatar_url text null`
- `created_at timestamptz`
- `updated_at timestamptz`

### `categories`

Verwaltet wiederverwendbare Kategorien für Einnahmen und Ausgaben.[cite:2]

Empfohlene Felder:

- `id uuid primary key`
- `name text`
- `slug text`
- `created_by_user_id uuid null`
- `is_system boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### `buckets`

Definiert private oder gemeinsame Buckets.[cite:2]

Empfohlene Felder:

- `id uuid primary key`
- `name text`
- `description text null`
- `type text check (type in ('private','shared'))`
- `created_by_user_id uuid`
- `has_budget boolean default false`
- `budget_amount numeric(12,2) null`
- `budget_period text default 'none'`
- `join_code char(6) null`
- `color text null`
- `icon text null`
- `is_archived boolean default false`
- `created_at timestamptz`
- `updated_at timestamptz`

Hinweis: `join_code` ist nur für Shared Buckets relevant.[cite:2]

### `bucket_members`

Modelliert Mitgliedschaften und Anteile innerhalb gemeinsamer Buckets.[cite:2]

Empfohlene Felder:

- `id uuid primary key`
- `bucket_id uuid`
- `user_id uuid`
- `role text check (role in ('admin','member'))`
- `share_percent numeric(5,2)`
- `joined_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Empfohlene Regeln:

- `unique(bucket_id, user_id)`
- `share_percent >= 0 and share_percent <= 100`
- Summe der `share_percent` in Shared Buckets muss fachlich 100 ergeben; diese Validierung sollte in App-Logik oder DB-Funktion abgebildet werden.[cite:2]

### `entries`

Speichert Einnahmen und Ausgaben als zentrale Finanzbewegungen.[cite:2]

Empfohlene Felder:

- `id uuid primary key`
- `transaction_type text check (transaction_type in ('income','expense'))`
- `amount numeric(12,2)`
- `title text`
- `notes text null`
- `occurred_at timestamptz`
- `created_by_user_id uuid`
- `category_id uuid`
- `bucket_id uuid null`
- `currency text default 'EUR'`
- `attachment_url text null`
- `is_recurring_generated boolean default false`
- `recurring_template_id uuid null`
- `created_at timestamptz`
- `updated_at timestamptz`

### `recurring_entry_templates`

Bereitet wiederkehrende Einnahmen und Ausgaben vor.[cite:2]

Empfohlene Felder:

- `id uuid primary key`
- `created_by_user_id uuid`
- `bucket_id uuid null`
- `category_id uuid`
- `transaction_type text`
- `amount numeric(12,2)`
- `title text`
- `notes text null`
- `frequency text`
- `next_due_at timestamptz`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

## RLS-Konzept

RLS soll sicherstellen, dass Nutzer nur ihre Profile, privaten Buckets, eigenen Einträge und Shared Buckets sehen, in denen sie Mitglied sind.[web:93]
Supabase empfiehlt für tabellenbezogene Zugriffskontrolle aktivierte Row Level Security und Policies auf Basis des angemeldeten Nutzers, typischerweise mit `auth.uid()`.[web:93][web:98]

Empfohlene Zugriffsregeln:

- `profiles`: Nutzer dürfen nur ihr eigenes Profil lesen und aktualisieren.[web:93]
- `categories`: Systemkategorien dürfen alle lesen; nutzerdefinierte Kategorien nur der Ersteller.[cite:2][web:93]
- `buckets`: Private Buckets nur der Ersteller; Shared Buckets nur Mitglieder.[cite:2][web:93]
- `bucket_members`: Sichtbar für Mitglieder des Buckets; Änderungen nur durch Admin.[cite:2][web:93]
- `entries`: Sichtbar, wenn der Nutzer Ersteller ist oder Mitglied des referenzierten Shared Buckets.[cite:2][web:93]
- `recurring_entry_templates`: Analog zu Entries.[cite:2][web:93]

## Abgeleitete Views

Für das Dashboard können später SQL-Views oder RPCs ergänzt werden, um Monatswerte, Bucket-Budgetstände und Shared-Abweichungen effizient zu berechnen.[cite:2]
Im MVP reicht jedoch zunächst eine Mischung aus einfachen SQL-Abfragen und klaren Domain-Utilities in der App.[cite:2]

# GripHook App Logic

GripHook organisiert Finanzdaten rund um Einträge, Buckets, Kategorien und Mitgliedschaften.[cite:2]
Die fachliche Leitidee ist, dass Buckets die zentrale organisatorische Einheit der App sind und Budgets, Kollaboration und Auswertungen an ihnen hängen.[cite:2]

## Zentrale Logik

Ein Nutzer erstellt Einnahmen- oder Ausgabeneinträge und ordnet sie einer Kategorie zu; optional kann zusätzlich ein Bucket gewählt werden.[cite:2]
Buckets können privat oder gemeinsam sein und dienen als Sammelstelle für finanzielle Einträge über mehrere Kategorien hinweg.[cite:2]

## Einträge

Jeder Eintrag repräsentiert eine einzelne finanzielle Bewegung, also entweder Income oder Expense.[cite:2]
Einträge enthalten mindestens Betrag, Beschreibung, Kategorie, Zeitpunkt, Ersteller und optional eine Bucket-Zuordnung.[cite:2]

Empfohlene Mindestfelder:

- `id`
- `transaction_type` (`income` oder `expense`)
- `amount`
- `title` oder `description`
- `notes` optional
- `occurred_at`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `category_id`
- `bucket_id` optional
- `currency` (vorbereitet, MVP standardmäßig EUR)
- `recurring_template_id` optional
- `is_recurring_generated` optional

## Kategorien

Kategorien beantworten ausschließlich die Frage, wofür Geld ausgegeben oder eingenommen wurde.[cite:2]
Kategorien tragen nicht die Verantwortung dafür, privat und gemeinsam zu trennen, weil dieselbe Kategorie wie `Lebensmittel` in beiden Kontexten vorkommen können soll.[cite:2]

## Buckets

Buckets sind flexible Sammlungen von Einträgen und können unabhängig davon existieren, ob ein Budget gesetzt ist oder nicht.[cite:2]
Dadurch kann ein Bucket sowohl ein klassischer Budgettopf als auch ein organisatorischer Container für Haushalt, Urlaub oder Fixkosten sein.[cite:2]

Ein Bucket hat typischerweise:

- `name`
- `description` optional
- `type` (`private` oder `shared`)
- `created_by_user_id`
- `has_budget`
- `budget_amount` optional
- `budget_period` (`monthly` oder `none` für MVP)
- `join_code` nur bei Shared Buckets
- `color` optional
- `icon` optional
- `is_archived`
- `created_at`
- `updated_at`

## Budget-Logik

Ein Bucket mit aktiviertem Budget verhält sich wie ein Budgettopf, gegen den vor allem Ausgaben gerechnet werden.[cite:2]
Für den MVP wird empfohlen, Einnahmen und Bucket-Budgetbewertung getrennt zu behandeln, damit Budgetstände verständlich bleiben und nicht automatisch durch beliebige Einnahmen „aufgefüllt“ werden.[cite:2]

Empfohlene Regel:

- `remaining_budget = budget_amount - sum(expense entries in current period for this bucket)`

## Shared Buckets

Shared Buckets haben mehrere Mitglieder und besitzen eine prozentuale Verteilung der Gesamtkosten auf Bucket-Ebene.[cite:2]
Diese Verteilung beschreibt, welchen Soll-Anteil eine Person an den Gesamtkosten des Buckets tragen soll, nicht wie viel sie tatsächlich bezahlt hat.[cite:2]

### Shared-Bucket-Regeln

- Der Ersteller eines Shared Buckets ist Admin.[cite:2]
- Der Admin kann Mitglieder hinzufügen oder entfernen.[cite:2]
- Der Admin kann Budget, Namen, Join-Code und prozentuale Verteilung verwalten.[cite:2]
- Für den MVP ist ein Admin ausreichend; das Modell soll aber mehrere Admins später zulassen.[cite:2]
- Die Summe aller Mitgliederanteile in einem Shared Bucket muss 100 ergeben.[cite:2]

### Shared-Bucket-Auswertung

Shared Buckets sollen keine komplizierte Settlement-Maschine sein, sondern eine verständliche Soll-Ist-Verteilung liefern.[cite:2]
Dazu wird pro Bucket berechnet, wie hoch die Gesamtausgaben sind, wie hoch der Soll-Anteil pro Person laut Prozentverteilung wäre und wie stark der tatsächliche Beitrag davon abweicht.[cite:2]

Beispiel:

- Gesamtausgaben: 200 Euro
- Person A: 60 Prozent Sollanteil = 120 Euro
- Person B: 40 Prozent Sollanteil = 80 Euro
- Tatsächlich gezahlt: A = 150 Euro, B = 50 Euro
- Ergebnis: A liegt 30 Euro über Soll, B liegt 30 Euro unter Soll.[cite:2]

## Join-Code-Flow

Shared Buckets sollen über einen sechsstelligen numerischen Code beitretbar sein.[cite:2]
Ein eingeloggter Nutzer gibt diesen Code in der App ein und wird bei Gültigkeit Mitglied des entsprechenden Buckets.[cite:2]

Empfohlene Regeln:

- Join-Code nur für Shared Buckets
- Standardrolle beim Beitritt: `member`
- Rolle des Erstellers: `admin`
- Join-Code regenerierbar
- Join-Code optional deaktivierbar in Phase 2

## Wiederkehrende Einträge

Wiederkehrende Einnahmen und Ausgaben sollen in einer schlanken Form vorbereitet werden.[cite:2]
Für den MVP reicht es, Templates mit Frequenz und nächster Fälligkeit anzulegen und daraus später halbautomatisch oder automatisch echte Einträge zu erzeugen.[cite:2]

## Dashboard

Das Dashboard ist die zentrale Seite der App und verdichtet die Daten des aktuellen Monats in wenige, gut lesbare Antworten.[cite:2]
Im Vordergrund stehen Einnahmen, Ausgaben, aktueller Saldo, verbleibende Bucket-Budgets, relevante Shared-Bucket-Abweichungen und die letzten Einträge.[cite:2]

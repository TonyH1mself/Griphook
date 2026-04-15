# GripHook Product Vision

GripHook ist eine mobile-first Progressive Web App für persönliches Finanz-Tracking mit optionaler gemeinsamer Nutzung in sogenannten Buckets.[cite:2]
Das Produkt ist bewusst kein komplexes Buchhaltungs- oder Accounting-Tool, sondern ein schlankes Finanz-Cockpit für den Alltag mit Fokus auf Übersicht, Restbudgets und einfache gemeinsame Kostenverteilung.[cite:2]

## Kernversprechen

GripHook hilft Nutzern dabei, ihre Einnahmen und Ausgaben schnell zu erfassen, Buckets zuzuordnen und auf dem Dashboard sofort zu erkennen, wie ihr Monat finanziell läuft.[cite:2]
Der Schwerpunkt liegt auf flexiblen Buckets, die privat oder gemeinsam genutzt werden können, optional ein Budget besitzen und als zentrale organisatorische Einheit der App dienen.[cite:2]

## Zielgruppe

Die primäre Zielgruppe sind Paare, kleine Haushalte und junge Eltern, die sowohl persönliche Finanzen als auch gemeinsame Haushaltsausgaben in einer App im Blick behalten möchten.[cite:1][cite:2]
Die App richtet sich an Menschen, die keine centgenaue Buchhaltung suchen, aber dennoch nachvollziehen möchten, wie sich Ausgaben verteilen und ob gemeinsame Kosten ungefähr fair getragen werden.[cite:2]

## Produktprinzipien

- Mobile first: Die App wird zuerst für iPhone und iPad als PWA gedacht und danach für Desktop erweitert.[cite:2]
- Buckets first: Buckets sind das Herzstück des Produkts; Kategorien und Budgets ergänzen sie.[cite:2]
- Schlank statt komplex: Der MVP priorisiert Klarheit, Geschwindigkeit und gute Alltagstauglichkeit statt Vollständigkeit.[cite:2]
- Shared, aber leichtgewichtig: Gemeinsame Kosten werden verständlich verteilt, ohne eine komplexe Splitwise- oder Buchhaltungs-Engine zu bauen.[cite:2]
- Visuelles Finanz-Cockpit: Das Dashboard ist die zentrale Seite und liefert schnelle, gut erfassbare Antworten statt Tabellenlastigkeit.[cite:2]

## Kernobjekte

### Einträge

Einträge sind Einnahmen oder Ausgaben und bilden die kleinste finanzielle Einheit der App.[cite:2]
Jeder Eintrag hat mindestens Typ, Kategorie, optional einen Bucket, einen Ersteller sowie Zeitstempel und Betrag.[cite:2]

### Buckets

Buckets sind Sammelstellen für Einträge unterschiedlichster Kategorien und können privat oder gemeinsam sein.[cite:2]
Ein Bucket kann optional ein Budget besitzen, muss es aber nicht, und kann dadurch entweder reiner Organisationscontainer oder echter Budgettopf sein.[cite:2]

### Kategorien

Kategorien beschreiben, wofür Geld ausgegeben oder eingenommen wurde, etwa Lebensmittel, Miete oder Getränke außer Haus.[cite:2]
Dieselbe Kategorie kann privat oder in Shared Buckets genutzt werden; die Trennung zwischen privat und gemeinsam erfolgt nicht über die Kategorie, sondern über den Bucket-Kontext.[cite:2]

## Dashboard-Logik

Das Dashboard zeigt die wichtigsten Antworten des laufenden Monats: Einnahmen, Ausgaben, Saldo, verbleibende Budgetstände pro Bucket, relevante Shared-Bucket-Übersichten und die neuesten Einträge.[cite:2]
Die UI soll modern, ruhig und hochwertig wirken und finanzielle Informationen eher als gut lesbares Cockpit als als Verwaltungsoberfläche präsentieren.[cite:2]

## Shared Buckets

Shared Buckets ermöglichen die Zusammenarbeit mehrerer Nutzer innerhalb eines gemeinsamen Kontexts wie Haushalt, Urlaub oder Fixkosten.[cite:2]
Der Fokus liegt darauf, nachvollziehbar zu machen, wer wie viel beigetragen hat und wie sich dieser Beitrag im Verhältnis zu den zuvor definierten prozentualen Anteilen verhält.[cite:2]

## Nicht-Ziele des MVP

Der MVP soll bewusst keine vollständige Buchhaltung, keine komplexe Settlement-Engine, keine tiefe Bankanbindung und kein überautomatisiertes Regelwerk enthalten.[cite:2]
Wiederkehrende Einträge, einfache Shared-Balances und Bucket-Budgets werden vorbereitet oder schlank umgesetzt, aber nicht bis in jede Sonderlogik ausgebaut.[cite:2]

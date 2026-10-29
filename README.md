# Zusammen 🫶

Eine Mobile-App gegen Einsamkeit: Sie bringt Menschen in ihrer Stadt im echten Leben zusammen –
beim **Dinner mit Fremden**, in **Hobby-Gruppen** und bei **offenen Treffen**.

Gebaut mit [Expo](https://expo.dev) (React Native, iOS + Android + Web) und [Supabase](https://supabase.com)
(Login, Datenbank).

## Funktionen

| Bereich | Was es kann |
| --- | --- |
| **Onboarding** | Konto per E-Mail, Profil mit Avatar, Stadt, mind. 3 Interessen, Community-Regeln |
| **Entdecken** | Treffen in deiner Stadt, „Passt zu dir“ nach Interessen, Filter, eigene Treffen erstellen |
| **Dinner** | Jeden Donnerstag: bis Dienstag anmelden (Budget, Ernährung), Mittwoch werden Tische mit bis zu 6 Personen gebildet, dann erscheinen Restaurant und Tischgäste |
| **Gruppen** | Hobby-Clubs beitreten oder gründen, Gruppen-Treffen planen, Gruppenchat |
| **Sicherheit** | Treffen, Gruppen und Nachrichten melden, Sicherheitstipps, Teilnehmerlimits |

## Schnellstart (Demo-Modus, ohne Backend)

```bash
npm install
npx expo start
```

Dann den QR-Code mit der **Expo Go**-App (iOS/Android) scannen oder `w` für die Browser-Version drücken.
Ohne Supabase-Zugangsdaten läuft die App mit Beispieldaten – jede E-Mail/jedes Passwort funktioniert.

## Echtes Backend verbinden (Supabase)

1. Kostenloses Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im **SQL Editor** den Inhalt von [`supabase/schema.sql`](supabase/schema.sql) ausführen,
   optional danach [`supabase/seed.sql`](supabase/seed.sql) für Beispiel-Gruppen in Berlin.
3. `.env.example` nach `.env.local` kopieren und URL + anon key eintragen
   (Project Settings → API).
4. `npx expo start` neu starten.

### Dinner-Matching

Die Funktion `match_dinners(datum)` verteilt alle Anmeldungen einer Stadt auf Tische (ähnliches Budget
zusammen). Automatisch jeden Mittwoch per `pg_cron` (Database → Extensions → pg_cron aktivieren):

```sql
select cron.schedule('dinner-matching', '0 8 * * 3',
  $$ select public.match_dinners((current_date + 1)::date) $$);
```

Restaurant und Adresse stehen danach als „Wird noch bekannt gegeben“ in `dinner_tables` und können im
Supabase Table Editor eingetragen werden (später: Partner-Restaurants automatisch zuweisen).

## Projektstruktur

```
src/
  app/                 Screens (Expo Router, jede Datei = eine Route)
    (tabs)/            Entdecken, Dinner, Gruppen, Profil
    event/ group/      Detail- und Erstellen-Screens
    chat/[groupId]     Gruppenchat
    sign-in, onboarding, profile-edit
  components/          UI-Bausteine (Buttons, Karten, Formulare)
  data/
    api.ts             Schnittstelle – wählt Demo- oder Supabase-Implementierung
    demo-api.ts        Beispieldaten im Speicher
    supabase-api.ts    Echte Datenbankzugriffe
  providers/           Login-Status und Profil
supabase/
  schema.sql           Tabellen, Zugriffsregeln (RLS), Trigger, Matching
  seed.sql             Beispieldaten
```

## Entwicklung

```bash
npx tsc --noEmit   # Typecheck
npx expo lint      # Lint
```

## In die App Stores

Mit [EAS](https://docs.expo.dev/eas/) ohne eigenen Mac bauen und einreichen:

```bash
npx eas-cli@latest build --platform all
npx eas-cli@latest submit
```

## Nächste Schritte (Ideen)

- Push-Benachrichtigungen (Tisch steht, neue Nachricht, Erinnerung am Treffen-Tag)
- Nach dem Dinner: „Wen möchtest du wiedersehen?“ → gegenseitige Matches als Freundschaft
- Partner-Restaurants & Bezahlung (Monatsabo oder Gebühr pro Dinner) als Geschäftsmodell
- Echtzeit-Chat über Supabase Realtime statt Polling
- Moderations-Dashboard für Meldungen, Nutzer blockieren

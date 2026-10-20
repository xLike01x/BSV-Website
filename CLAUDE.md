@AGENTS.md
@ARBEITSWEISE.md

# BSV-Website – Hinweise für die Entwicklung

- **Migrationen:** Live gibt es kein automatisches „push“. Nach jeder Änderung an Feldern/Sammlungen/Globals
  `pnpm payload migrate:create <name>` ausführen und `src/migrations/*` mit committen (siehe `deploy/README.md`, Abschnitt 8).
  Mehrzeilige Standardwerte in generierten Migrationen auf Einrückungsfehler prüfen.
- **Sicherheits-Regressionstests:** `pnpm test:sicherheit` (Dev-Server muss laufen, Testkonten angelegt).
- **Konfiguration live prüfen:** `pnpm live:pruefen`.
- **Papierkorb:** Löschen für Nicht-Web-Admins läuft über eigene DELETE-Endpunkte in `src/papierkorb/plugin.ts`, nicht über Hooks.
- **IP-Adresse:** nur `clientIp()` aus `src/utilities/clientIp.ts` verwenden (liest ausschließlich `X-Real-IP`).

# Feste Wünsche von Thomas (Projektinhaber)

- Immer auf Deutsch antworten; präzise, ohne Einleitung und ohne Schluss-Zusammenfassung.
- Alles muss **ohne Code** in der Verwaltung bedienbar und **maximal selbsterklärend** sein.
- Nach jeder Funktionsänderung die **Hilfe** aktualisieren (`src/components/Admin/Hilfe/*`) und die **Funktionsübersicht** pflegen.
- Auswahlmöglichkeiten als ankreuzbare Optionen anbieten.
- Sicherheitsregeln: Repository bleibt privat; `.env` und Secrets nie committen oder in den Chat schreiben; `ENCRYPTION_KEY` nie ändern;
  keine echten Mitglieder- oder Bankdaten (Test-IBAN DE89370400440532013000); Testkonten nur lokal; Sicherungen nie per E-Mail.
- DSGVO: keine externen Einbindungen vor einem Klick, Schriften lokal, Kinderfotos nur mit Einwilligung, Profilfotos nie öffentlich
  (außer Vorstand mit Einverständnis).
- Riskante Änderungen (Live-Daten, Migrationen auf dem Server, zentrale Berechtigungen, Kosten) nur nach Freigabe.

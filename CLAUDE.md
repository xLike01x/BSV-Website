@AGENTS.md

# BSV-Website – Hinweise für die Entwicklung

- **Migrationen:** Live gibt es kein automatisches „push“. Nach jeder Änderung an Feldern/Sammlungen/Globals
  `pnpm payload migrate:create <name>` ausführen und `src/migrations/*` mit committen (siehe `deploy/README.md`, Abschnitt 8).
  Mehrzeilige Standardwerte in generierten Migrationen auf Einrückungsfehler prüfen.
- **Sicherheits-Regressionstests:** `pnpm test:sicherheit` (Dev-Server muss laufen, Testkonten angelegt).
- **Konfiguration live prüfen:** `pnpm live:pruefen`.
- **Papierkorb:** Löschen für Nicht-Web-Admins läuft über eigene DELETE-Endpunkte in `src/papierkorb/plugin.ts`, nicht über Hooks.
- **IP-Adresse:** nur `clientIp()` aus `src/utilities/clientIp.ts` verwenden (liest ausschließlich `X-Real-IP`).

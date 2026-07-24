# Michie’s GLC Organizer 6.0

## Enthaltene Änderungen
- Erklärung zur iPhone-Kurzbefehle-Einrichtung vollständig entfernt.
- Ein Masterfoto für Hero, Fahrzeugabbildung und App-Icons vorgesehen.
- Neue Mercedes-Connect-Karte mit Fahrzeugstatus, Verbrauchsdaten und automatischer Übernahme in den Kostenrechner.
- Sicheres OAuth-/Backend-Konzept, da GitHub Pages keine Client-Secrets oder Refresh-Tokens schützen kann.
- Demo-Modus, damit die Oberfläche sofort testbar ist.

## Foto einsetzen
Die vier gelieferten Originalfotos sind bereits eingebaut. `assets/hero-photo.jpg` wird im Hero-Bereich verwendet, `assets/vehicle-photo.jpg` in der Fahrzeugkarte. Die App-Icons (`icon-192.png` und `icon-512.png`) wurden ebenfalls aus dem Fahrzeugfoto erzeugt. Zusätzlich enthält die App eine Fotogalerie mit allen vier Aufnahmen.

## GitHub-Update
Alle Dateien aus diesem Ordner in das Repository hochladen und bestehende Dateien ersetzen. Commit: `Update auf Version 6.0 – Mercedes Connect`.

## Mercedes-Live-Daten
Eine direkte Datenübernahme allein aus der installierten Mercedes-Benz-App ist unter iOS nicht möglich: Apps dürfen ihre privaten Daten nicht gegenseitig auslesen. Die Live-Daten müssen über eine freigeschaltete Fahrzeugdaten-API und OAuth laufen. Mercedes-Benz beschreibt Vehicle Status als API-Produkt für Geschäftsanwendungen; Zugang, verfügbare Datenpunkte und Fahrzeugfreigabe hängen vom gebuchten/freigeschalteten Produkt ab.

1. Entwicklerzugang und geeignetes Fahrzeugdatenprodukt beantragen.
2. Backend aus `api/server-example.js` bei einem Anbieter wie Vercel/Render/Cloudflare bereitstellen.
3. OAuth-Daten ausschließlich als Backend-Umgebungsvariablen speichern.
4. In `config.js` `apiBaseUrl` setzen und `demoMode` auf `false` stellen.
5. Backend-Antwort auf das im Beispiel gezeigte neutrale JSON-Format mappen.

Hinweis: Nicht jeder API-Tarif liefert historische oder durchschnittliche Verbrauchswerte. Falls nur Kilometerstand, Tankfüllstand, Ladezustand und Reichweite verfügbar sind, bleiben die Verbrauchswerte manuell editierbar.


## Enthaltene Fotos

- `assets/hero-photo.jpg` – optimierter Hero-Zuschnitt
- `assets/vehicle-photo.jpg` – Fahrzeugkarte
- `assets/glc-photo-1.jpg` bis `glc-photo-4.jpg` – vollständige Galerie
- `assets/icon-192.png` und `assets/icon-512.png` – aktualisierte App-Icons

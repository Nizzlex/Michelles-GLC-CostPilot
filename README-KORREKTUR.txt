MICHIE'S GLC ORGANIZER – TANKERKÖNIG KORREKTUR v6.2

Fehlerbild:
Tankstellen, Entfernung und Öffnungsstatus werden geladen, der E10-Preis erscheint aber als "–".

Ursache:
Tankerkönig liefert den Preis je nach Abfrage unterschiedlich:
- type=e10: Feld "price"
- type=all: Feld "e10"

Der Fix normalisiert beide Varianten und setzt intern immer BOTH:
station.price und station.e10.

UPLOAD AUF GITHUB
1. tankerkoenig-fix.js in das Hauptverzeichnis des Repositories hochladen.
2. service-worker.js durch die beiliegende Version ersetzen.
3. In index.html DIREKT VOR der Zeile, die app.js lädt, diese Zeile ergänzen:

   <script src="./tankerkoenig-fix.js?v=6.2"></script>

   Danach muss die bestehende app.js-Zeile stehen, z. B.:
   <script src="./app.js?v=6.2"></script>

4. Commit speichern.
5. Auf dem iPhone die Web-App einmal vollständig schließen und neu öffnen.
   Bei einer als Home-Screen-App installierten PWA ggf. einmal Safari öffnen und die GitHub-Pages-Seite neu laden.

WICHTIG
- API-Key wird durch diesen Fix nicht verändert.
- Google Maps, Rechner, Fahrzeugdaten und andere Funktionen werden nicht entfernt.
- Bestehende Tankstellen-UI kann weiterhin station.e10 ODER station.price verwenden.
- Fehlende Preise bleiben sauber als "Kein E10-Preis" / "–" behandelbar.

TECHNISCH
Der Patch greift ausschließlich Antworten von Tankerkönig ab und normalisiert die Preisfelder,
bevor die bestehende App sie verarbeitet.

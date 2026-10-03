# Änderungen

## 5.3.0
- Einheitlicher Design-Standard mit Trash Card Plus, EV Charge Card und
  Status-Übersicht-Karte: gleiche Auswahlen, gleiche Bezeichnungen, gleiche
  Reihenfolge im Design-Tab (Akzentfarbe → Karte – Hintergrund & Transparenz →
  Karte – Rahmen, Form & Abstände → Text)
- Design-Schlüssel heißen jetzt wie in den anderen Karten: `card_bg_mode`,
  `card_bg_color`, `card_bg_opacity`, `card_bg_gradient`, `card_blur`,
  `card_border_mode`, `card_border_color`, `card_border_width`, `card_shadow`,
  `card_radius`. Die bisherigen Schlüssel (`bg_mode`, `blur`, `radius` …) werden
  weiter verstanden und beim Bearbeiten automatisch umbenannt
- Akzentfarbe steht immer oben im Design-Tab; Innenabstand bis 40 px

## 5.2.0
- Design-Tab an die EV Charge Card angeglichen: Gruppe „Karte – Hintergrund &
  Transparenz“ mit „Hintergrund der Karte“, „Deckkraft der Karte“, Farbverlauf
  und Glas-Effekt
- Neue Hintergründe „Theme + Farbton“ (`tinted`, Deckkraft = Stärke des
  Farbtons) und „Volle Akzentfarbe“ (`accent`), dazu `accent_color`; der
  Farbverlauf ist jetzt auch für diese beiden Modi verfügbar
- Der Akzent-Rahmen nutzt ebenfalls `accent_color`
- Die Design-Schlüssel der EV Charge Card (`card_bg_mode`, `card_bg_opacity` …)
  werden verstanden und beim Bearbeiten in die eigenen Schlüssel übernommen

## 5.1.0
- Neu: Wetteranzeige oben in der Ecke. Mit `weather_entity` erscheinen die
  aktuelle Temperatur und ein kleines Symbol für den Zustand (sonnig, klar,
  teilweise bewölkt, bewölkt, Nebel, Regen, Starkregen, Schnee, Schneeregen,
  Hagel, Gewitter, Wind, Warnung). Die Symbole sind farbig und dezent animiert,
  alternativ einfarbig als MDI-Symbol (`weather_icon_style: mono`). Nachts wird
  aus der Sonne ein Mond
- Die Seite ergibt sich automatisch aus dem Titel (gegenüber), lässt sich mit
  `weather_position: left | right` aber auch fest vorgeben
- Optional eigener Temperatursensor (`weather_temperature_entity`), Zustand als
  Text, Größe, Nachkommastellen und Tap-Aktion (Standard: Wetterdetails)
- Im Editor unter Anzeige → Wetter einstellbar

## 5.0.0
- Editor komplett neu aufgebaut, einheitlich mit der Status-Übersicht-Karte und
  der Trash Card Plus: Tab-Leiste (Knoten, Anzeige, Animation, Werte, Design),
  Einleitung je Tab und aufklappbare Gruppen mit Symbol
- Knoten-Tab als Liste mit Symbol in Knotenfarbe, Sensor, Sortieren und
  Entfernen; Antippen öffnet eine eigene Bearbeiten-Seite mit Live-Vorschau
  (aktueller Wert und Ring)
- Neuer Design-Tab: Hintergrund (Theme, eigene Farbe, transparent) mit
  Deckkraft, Farbverlauf und Glas-Effekt, Textfarbe mit automatischem Kontrast,
  Schriftgröße der Werte, Rahmen, Schatten, Eckenradius und Innenabstand
- Werte, die dem Standard entsprechen, werden nicht mehr in die YAML geschrieben;
  Farben aus YAML (z. B. Hex) bleiben beim Bearbeiten im Originalformat
- Behoben: die Schalter „Vom Hausverbrauch abziehen“ standen im Editor auf aus,
  obwohl die Funktion aktiv war
- Behoben: `center_background` aus dem Farbwähler ([r,g,b]) wurde nicht angewendet
- Behoben: ein leerer PV-/Netz-/Speicher-Knoten wird nicht mehr als `{}` gespeichert

## 4.6.1
- Ring-Variante des Ladestands (`soc_display: ring`) zeigt zusätzlich den
  Prozentwert im Kreis unter dem Icon, in der Farbe des Ladestands

## 4.6.0
- Ladestand eines Verbrauchers lässt sich an einen Lade-Sensor koppeln:
  mit `charging_entity` erscheint Batteriesymbol bzw. innerer Ring nur, solange
  dieser Sensor „lädt“ meldet. Automatisch erkannt werden `on`, `true`,
  `charging`, `laden`, `lädt`, `ladend`, `active`, `aktiv` und Zahlen über 0;
  mit `charging_state` lassen sich eigene Zustände festlegen. Beide Felder
  sind im Editor unter dem Verbraucher einstellbar

## 4.5.0
- Ladestand für Verbraucher, etwa das Auto an der Wallbox: neuer
  `state_of_charge` unter `individual` mit zwei Darstellungen über
  `soc_display` — `battery` (liegende Batterie mit stufenloser Füllung und
  Prozentwert im Knoten, Standard) oder `ring` (eigener Ring innerhalb des
  Leistungsrings, voll bei 100 %). Farbe über `soc_color`. Bei `unavailable`
  oder `unknown` wird die Anzeige ausgeblendet. Im Editor unter jedem
  Verbraucher einstellbar
- Der Leistungsring eines Verbrauchers zeigt jetzt immer die Leistung. Wer bisher
  per YAML einen `state_of_charge` an einem Verbraucher gesetzt hatte, sah dort
  den Ladestand im Hauptring; der steht jetzt in der neuen Anzeige
- Behoben: `display_zero_lines.mode: transparency` hatte keine Wirkung, die
  Linie inaktiver Knoten wird jetzt tatsächlich transparent
- Behoben: der Regler für die Ringgröße im Editor begann bei 200 statt bei 140
- Ungenutzte Reste im Code entfernt

## 4.4.0
- Grundlegend überarbeitet, wie Ring- und Knotengröße berechnet werden: bisher
  konnte die Karte `ring_radius` und `node_size` bei vielen Konfigurationen
  heimlich wieder zurückrechnen, sodass die Regler kaum noch etwas bewirkten.
  Beide Werte wirken jetzt direkt und über den gesamten Regelbereich sichtbar;
  die einzige verbleibende Grenze ist reine Geometrie (Nachbarknoten dürfen
  sich nicht berühren). Passt die Größe nicht mehr in die 1000er-Grundfläche,
  wächst die Zeichenfläche mit statt Ring oder Knoten zu verkleinern
- Beispielbilder mit dieser Geometrie neu erzeugt; der Generator misst
  Textbreiten jetzt exakt statt sie zu schätzen, damit auch lange Namen wie
  „Wärmepumpe" nicht mehr abgeschnitten werden

## 4.3.0
- Standardgeometrie überarbeitet: Speichen und Punktschweife waren bei den
  Standardwerten kaum sichtbar, bei drei oder vier Knoten überlappten sich
  Knoten und Nabe sogar rechnerisch. Ring ist jetzt größer, Knoten kleiner,
  betrifft neue Karten sofort und bestehende nach dem Zurücksetzen von
  `ring_radius`, `node_size` oder `center_size` auf die Standardwerte
- Beispielbilder mit derselben Geometrie neu erzeugt, zwei weitere ergänzt
  (zwei Knoten als engster Fall, zwölf Knoten als praktische Obergrenze)

## 4.2.0
- Schriftstärke des Titels einstellbar, von leicht bis sehr fett

## 4.1.0
- Ring wird bei 0 % vollständig ausgeblendet; vorher blieb die runde Linienkappe
  als kleiner Punkt stehen
- Mehr Beispielkonfigurationen samt Bildern, neutrale Nabe in der Dokumentation

## 4.0.0
- Titel liegt als Overlay über der Grafik und verschiebt sie nicht mehr
- Titelfarbe, Titelgröße und Ausrichtung einstellbar
- Editor in vier Gruppen mit Kurzhinweisen neu geordnet

## 3.4.0
- Tempo-Regler über alle Linien, schnellere Standardwerte
- Pause zwischen zwei Durchläufen einstellbar

## 3.3.0
- Getrennte Sensoren für Laden und Entladen sowie Bezug und Einspeisung
- Übergangsdauer des Rings einstellbar

## 3.2.0
- Punkte laufen über einen eigenen Zeitgeber statt über SMIL; Wertänderungen
  setzen die Animation nicht mehr zurück

## 3.1.0
- Ringhintergrund in Knotenfarbe, Knoten bleiben bei 0 W farbig
- Batteriesymbol mit Balken nach Ladestand und Prozentanzeige
- Füllfarbe für die Mitte, Ringübergang über stroke-dashoffset

## 3.0.0
- Teilringe nach Maximalleistung, Ladestand beim Speicher
- Ein Punkt je Linie mit Schweif
- Eigener Icon-Satz, Reihenfolge der Verbraucher änderbar
- Abzug einzelner Verbraucher vom Hausverbrauch

## 2.0.0
- Konfigurationseditor mit Entity-, Icon- und Farbwähler

## 1.0.0
- Erste Fassung: radiale Darstellung, Aktionen je Knoten

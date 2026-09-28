# Änderungen

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

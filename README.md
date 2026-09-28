# Radial Flow Card

[![hacs][hacs-badge]][hacs-url]
[![release][release-badge]][release-url]
[![license][license-badge]](https://github.com/Kohle93/radial-flow-card/blob/main/LICENSE)

Energieflusskarte für Home Assistant mit radialem Aufbau: eine Nabe in der Mitte,
alle Knoten auf einem Ring darum, animierte Punkte auf den Speichen. Eigenständige
Karte ohne Abhängigkeiten, ohne Build-Schritt, mit vollständigem Editor.

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/hero.png" width="420" alt="Radiale Energieflusskarte">

## Auf einen Blick

- Beliebig viele Verbraucher, Reihenfolge im Editor änderbar
- Teilringe zeigen den Anteil an einer definierten Maximalleistung
- Ein Punkt je Linie mit Schweif, Tempo abhängig von der Leistung
- Choreografie: erst die Erzeugung zur Mitte, dann alle übrigen Linien
- Tap, Hold und Doppeltipp je Knoten, etwa zur Navigation auf ein Unterdashboard
- Getrennte Sensoren für Bezug/Einspeisung und Laden/Entladen möglich
- Ladestand je Verbraucher, etwa das Auto an der Wallbox: als Batteriesymbol oder als innerer Ring
- Eigener Icon-Satz für Wärmepumpen und Heizung
- Vollständiger Konfigurationseditor, YAML optional

## Installation

### Über HACS

1. HACS öffnen, Dreipunktmenü, *Benutzerdefinierte Repositories*
2. Diese Repository-URL eintragen, Kategorie *Dashboard*
3. *Radial Flow Card* installieren
4. Browser-Cache leeren

### Manuell

1. `dist/radial-flow-card.js` nach `/config/www/radial-flow-card.js` kopieren
2. Einstellungen → Dashboards → Ressourcen → Ressource hinzufügen
   - URL `/local/radial-flow-card.js`
   - Typ **JavaScript-Modul**
3. Browser-Cache leeren

Danach im Dashboard *Karte hinzufügen* und nach *Radial Flow Card* suchen.

## Beispiele

Alle Bilder werden aus `tools/render_examples.py` erzeugt und geben die Karte
mit denselben Maßen wieder. Die vollständige Konfiguration steht jeweils in
`examples/`.

### Minimal

Drei Knoten, der Hausverbrauch wird als Bilanz gerechnet.
[`examples/minimal.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/minimal.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-minimal.png" width="360" alt="Minimalbeispiel mit drei Knoten">

```yaml
type: custom:radial-flow-card
title: Energie
solar:
  entity: sensor.pv_leistung
  max_power: 9000
grid:
  entity: sensor.netz_leistung
```

### Standard

Sechs Knoten mit Speicher und zwei Verbrauchern. Die Wallbox steht auf 0 W und
behält Farbe und Position, nur die Punkte auf ihrer Linie verschwinden.
[`examples/standard.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/standard.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-standard.png" width="360" alt="Standardbeispiel mit sechs Knoten">

### Kompakt

Ohne Namen und ohne Titel, größere Knoten. Passt als dichte Kachel neben andere
Karten. [`examples/compact.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/compact.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-compact.png" width="360" alt="Kompakte Darstellung ohne Namen">

### Überschuss

Die Erzeugung lädt Speicher und Wallbox, der Rest geht ins Netz. Alle Punkte außer
dem der Erzeugung laufen nach außen. [`examples/charging.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/charging.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-charging.png" width="360" alt="Überschuss lädt Speicher und Wallbox">

### Nachtbetrieb

Keine Erzeugung, der Speicher versorgt Haus und Wärmepumpe. Sein Punkt läuft als
einziger nach innen. [`examples/night.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/night.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-night.png" width="360" alt="Nachtbetrieb ohne Erzeugung">

### Heizung

Mehrere Heizkreise mit dem eigenen Icon-Satz. Der Heizstab läuft nicht und bleibt
trotzdem sichtbar. [`examples/heating.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/heating.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-heating.png" width="360" alt="Heizungsansicht mit eigenen Icons">

### Viele Verbraucher

Neun Knoten. Ring und Knotengröße passen sich automatisch an, die Beschriftung
bleibt innerhalb der Karte. [`examples/large.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/large.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-large.png" width="360" alt="Beispiel mit neun Knoten">

### Wallbox mit Ladestand

Ein Verbraucher kann zusätzlich einen Ladestandssensor bekommen, typischerweise
das Auto an der Wallbox. Der äußere Ring zeigt weiterhin die Leistung, der
Ladestand kommt als eigene Anzeige dazu — wahlweise als liegende Batterie mit
Prozentwert im Knoten (links, `soc_display: battery`) oder als innerer Ring, der
bei 100 % geschlossen ist, mit dem Prozentwert im Kreis (rechts, `soc_display: ring`). Die Farbe ist über
`soc_color` einstellbar. [`examples/wallbox-soc.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/wallbox-soc.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-soc-battery.png" width="300" alt="Ladestand als Batteriesymbol im Knoten"> <img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-soc-ring.png" width="300" alt="Ladestand als innerer Ring">

```yaml
individual:
  - entity: sensor.wallbox_leistung
    name: Wallbox
    icon: mdi:car-electric
    max_power: 11000
    state_of_charge: sensor.auto_ladestand
    soc_display: ring        # oder battery (Standard) oder none
    soc_color: "#4cb5e0"
```

Ist der Sensor `unavailable` oder `unknown` (Auto nicht verbunden), wird die
Anzeige ausgeblendet und das Icon erscheint wieder in voller Größe.

Soll der Ladestand nur während des Ladens erscheinen, kommt ein zweiter Sensor
dazu, der meldet, ob gerade geladen wird:

```yaml
    charging_entity: binary_sensor.wallbox_laedt
    # optional, wenn der Sensor Text liefert:
    # charging_state: "Charging, Laden"
```

Ohne `charging_state` gelten `on`, `true`, `charging`, `laden`, `lädt`, `ladend`,
`active`, `aktiv` sowie jede Zahl über 0 als „lädt“ — ein `binary_sensor` oder
ein Ladeleistungssensor funktionieren also direkt. Mit `charging_state` zählen
nur die dort genannten Zustände (kommagetrennt oder als Liste, Groß- und
Kleinschreibung egal). Ohne `charging_entity` ist der Ladestand immer sichtbar.

### Helles Thema

Die Karte übernimmt die Farben des aktiven Themes. Bei hellen Themes lohnen sich
kräftigere Knotenfarben. [`examples/light-theme.yaml`](https://github.com/Kohle93/radial-flow-card/blob/main/examples/light-theme.yaml)

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-light.png" width="360" alt="Karte in einem hellen Theme">

### Zwei Knoten

Der engste sinnvolle Fall: nur Erzeugung und Haus. Auch hier bleibt die Speiche
deutlich sichtbar.

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-two-nodes.png" width="360" alt="Minimalfall mit zwei Knoten">

### Zwölf Knoten

Die praktische Obergrenze. Ring und Beschriftung bleiben lesbar, aber eng — ab
hier lohnt sich eher ein zweites Dashboard als noch mehr Verbraucher.

<img src="https://raw.githubusercontent.com/Kohle93/radial-flow-card/main/docs/images/example-twelve-nodes.png" width="360" alt="Zwölf Knoten an der praktischen Obergrenze">

## Konfigurationseditor

Der Editor nutzt dieselben Komponenten wie die eingebauten Karten, also
`ha-entity-picker` für Sensoren, den Icon- und Farbwähler und den Standard-Dialog
für Aktionen. Er ist in vier Gruppen geteilt:

| Gruppe | Inhalt |
|---|---|
| Sensoren | PV, Netz, Speicher, Haus |
| Verbraucher | beliebig viele, mit Reihenfolge und Entfernen |
| Aussehen | Karte & Titel, Mitte, Knoten & Ringe |
| Bewegung & Zahlen | Punkte, Werte & Einheiten |

## Optionen

### Karte

| Option | Typ | Standard | Bedeutung |
|---|---|---|---|
| `title` | string | – | Titel, liegt über der Grafik und verschiebt sie nicht |
| `title_color` | string \| [r,g,b] | Textfarbe | Farbe des Titels |
| `title_size` | number | `16` | Schriftgröße des Titels in px |
| `title_weight` | number | `500` | Schriftstärke des Titels, 300 bis 800 |
| `title_align` | string | `left` | `left`, `center`, `right` |
| `card_width` | number | `100` | Breite der Grafik in Prozent der Karte |
| `center_image` | string | – | Bild-URL für die Nabe |
| `center_image_fit` | string | `contain` | `contain` mit Rand, `cover` randlos |
| `center_icon` | string | `mdi:flash` | Icon, falls kein Bild gesetzt ist |
| `center_background` | string \| [r,g,b] | – | Füllfarbe des Mittelkreises, dann ohne Rahmen |
| `center_size` | number | `1` | Faktor für die Größe der Mitte |
| `center_tap_action` / `center_hold_action` | action | `none` | Aktion auf der Nabe |
| `node_size` | number | `1` | Faktor für die Knotengröße, 0.5–1.8, wirkt direkt |
| `ring_radius` | number | `320` | Ringradius im 1000er-Raster, 140–400, wirkt direkt (auch im Editor) |
| `track_opacity` | number | `0.22` | Deckkraft des Ringhintergrunds |
| `ring_transition` | number | `400` | Übergangsdauer des Rings in ms |
| `show_names` | bool | `false` | Namen unter den Werten |
| `speed` | number | `1` | Tempofaktor über alle Linien |
| `min_flow_rate` | number | `0.45` | Sekunden pro Durchlauf bei maximaler Leistung |
| `max_flow_rate` | number | `3` | Sekunden pro Durchlauf bei minimaler Leistung |
| `min_expected_power` | number | `50` | W, ab hier langsamste Animation |
| `max_expected_power` | number | `8000` | W, ab hier schnellste Animation |
| `dot_size` | number | `1` | Faktor für die Punktgröße |
| `tail_length` | number | `0.08` | Länge des Schweifs als Anteil der Linie |
| `tail_segments` | number | `8` | Auflösung des Schweifs, `0` schaltet ihn ab |
| `cycle_gap` | number | `0.15` | Pause zwischen zwei Durchläufen in Sekunden |
| `kilo_threshold` | number | `1000` | Ab diesem Wert Anzeige in kW |
| `base_decimals` / `kilo_decimals` | number | `0` / `2` | Nachkommastellen |
| `display_zero_tolerance` | number | `5` | W, darunter gilt ein Knoten als inaktiv |
| `display_zero_lines.mode` | string | `show` | `show`, `grey`, `transparency`, `hide` |
| `display_zero_lines.grey_color` | string | `#4e5867` | Farbe im Grau-Modus |
| `display_zero_lines.transparency` | number | `50` | Prozent im Transparenz-Modus, wirkt auf die Linie inaktiver Knoten |

### Knoten

Gilt für `solar`, `grid`, `battery`, `home` und jeden Eintrag unter `individual`.

| Option | Typ | Bedeutung |
|---|---|---|
| `entity` | string \| object | Kombinationssensor oder ein Sensorpaar |
| `invert` | bool | Vorzeichen drehen |
| `name` | string | Anzeigename |
| `icon` | string | MDI-Icon oder `rf:`-Icon |
| `color` | string \| [r,g,b] | Farbe von Ring und Punkten |
| `unit` | string | `W`, `kW` oder frei; leer = automatische Umschaltung |
| `decimals` | number | Nachkommastellen für diesen Knoten |
| `max_power` | number | Maximalleistung für den Teilring; leer = Vollkreis |
| `ring_source` | string | nur `battery`: `soc` (Standard) oder `power` |
| `state_of_charge` | string | `battery` und `individual`: Ladestandssensor in % |
| `soc_display` | string | nur `individual`: `battery` (Standard), `ring` (mit Prozentwert im Kreis) oder `none` |
| `soc_color` | string \| [r,g,b] | nur `individual`: Farbe der Ladestandsanzeige, Standard `#5cc47a` |
| `charging_entity` | string | nur `individual`: Ladestand nur zeigen, solange dieser Sensor „lädt“ meldet |
| `charging_state` | string \| list | nur `individual`: Zustände, die als „lädt“ gelten; leer = automatisch |
| `subtract_from_home` | bool | nur `individual`: vom Hausverbrauch abziehen, Standard an |
| `subtract_individual` | bool | nur `home`: Hauptschalter für alle Verbraucher |
| `secondary_entity` | string | Zusatzsensor in der dritten Zeile |
| `secondary_unit` | string | Einheit dafür |
| `note` | string | Fester Zusatztext |
| `tap_action` | action | Standard `more-info` |
| `hold_action` | action | Standard `none`, löst nach 500 ms aus |
| `double_tap_action` | action | Standard `none` |

Unterstützte Aktionen: `more-info`, `navigate`, `url`, `toggle`, `call-service`,
`perform-action`, `assist`, `fire-dom-event`, `none`.

## Sensoren und Vorzeichen

Positiv bedeutet Fluss zur Nabe: Netzbezug, Entladen des Speichers.
Negativ bedeutet Fluss nach außen: Einspeisung, Laden. Passt der Sensor nicht,
hilft `invert: true`. Sensoren in kW oder MW werden automatisch auf Watt normiert.

Wahlweise zwei getrennte Sensoren statt eines Kombinationssensors:

```yaml
grid:
  entity:
    consumption: sensor.netz_bezug
    production: sensor.netz_einspeisung

battery:
  entity:
    discharge: sensor.speicher_entladeleistung
    charge: sensor.speicher_ladeleistung
```

`consumption` und `discharge` zählen zur Nabe hin, `production` und `charge`
davon weg. Beide Schreibweisen funktionieren für beide Knoten.

Ohne `home.entity` wird der Hausverbrauch als Bilanz gerechnet:
`PV + Netzbezug + Entladen − Einspeisung − Laden`. Davon werden alle Verbraucher
abgezogen, bei denen `subtract_from_home` aktiv ist.

## Eigener Icon-Satz

Zusätzlich zu allen MDI-Icons steht ein mitgelieferter Satz über `rf:` bereit,
vor allem für Wärmepumpen und Heizung:

| Name | Motiv |
|---|---|
| `rf:heatpump` | Außeneinheit mit Lüfter und Lamellen |
| `rf:heatpump-fan` | großer Lüfter mit geschwungenen Flügeln |
| `rf:heatpump-waves` | Außeneinheit mit abgehenden Wärmewellen |
| `rf:heatpump-house` | Haus mit Lüfter |
| `rf:heat-waves` | drei aufsteigende Wärmewellen |
| `rf:radiator` | Heizkörper |
| `rf:floor-heating` | Fußbodenheizung |
| `rf:battery` | Batterie mit Balken nach Ladestand, Standard beim Speicher |

## Wie die Animation arbeitet

Pro Linie läuft genau ein Punkt mit Schweif. Zuerst läuft der Punkt der Erzeugung
vom Knoten zur Mitte; erst wenn er angekommen ist, starten alle übrigen Punkte
gleichzeitig nach innen oder außen. Danach beginnt der Zyklus von vorn.

Bewegt wird über einen eigenen Zeitgeber, nicht über SMIL. Jede Linie führt einen
Fortschritt von 0 bis 1, der pro Bild um `dt / Dauer` wächst. Ein neuer Sensorwert
ändert nur diese Schrittweite, nie die Position — ein laufender Punkt wird also
schneller oder langsamer, statt neu zu starten. Der Zeitgeber pausiert, wenn der
Tab in den Hintergrund geht.

Die Laufzeit wird linear zwischen `min_expected_power` und `max_expected_power`
auf `max_flow_rate` bis `min_flow_rate` abgebildet und durch `speed` geteilt.

## Größe von Ring und Knoten

`ring_radius` und `node_size` wirken direkt und über den gesamten Regelbereich
sichtbar — keine verdeckte Rückrechnung verwirft die eingestellten Werte mehr.
Die einzige Grenze für die Knotengröße ist reine Geometrie: Nachbarknoten dürfen
sich nicht berühren, berechnet über den tatsächlichen Winkelabstand auf dem Ring.

Passt die gewählte Größe bei vielen Knoten oder langen Namen nicht mehr in die
1000er-Grundfläche, wächst die Zeichenfläche mit, statt Ring oder Knoten
eigenmächtig zu verkleinern. Ring und Knoten behalten dabei exakt das Verhältnis,
das eingestellt wurde — im Zweifel wird nur die ganze Grafik gemeinsam etwas
kleiner dargestellt.

## Verhalten bei 0 W

Knoten behalten Farbe und Position, es verschwinden nur die Punkte auf der Linie.
Der Ringhintergrund liegt in der Knotenfarbe mit reduzierter Deckkraft darunter,
damit ein Knoten auch ohne Leistung farbig bleibt.

## Grenzen

- Sinnvoll bis etwa zwölf Knoten, danach wird der Ring zu eng
- Ein sehr langer Titel kann mit der Beschriftung eines oben stehenden Knotens
  kollidieren, da der Titel über der Grafik liegt statt sie nach unten zu
  verdrängen — kurze, prägnante Titel vermeiden das zuverlässig
- Der Editor ist auf Deutsch, die Karte selbst sprachneutral
- Im Editor wird die Vorschau bei jeder Änderung neu aufgebaut; im Normalbetrieb
  werden ausschließlich Attribute aktualisiert

## Beispielbilder neu erzeugen

```bash
pip install cairosvg
python3 tools/render_examples.py
```

## Lizenz

MIT, siehe [LICENSE](https://github.com/Kohle93/radial-flow-card/blob/main/LICENSE).

[hacs-badge]: https://img.shields.io/badge/HACS-Custom-41BDF5.svg
[hacs-url]: https://hacs.xyz
[release-badge]: https://img.shields.io/badge/version-4.6.1-blue.svg
[release-url]: https://github.com/Kohle93/radial-flow-card/releases
[license-badge]: https://img.shields.io/badge/license-MIT-green.svg

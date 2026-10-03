# Changelog

## 5.4.0
- Editor and card texts are now bilingual: German when Home Assistant runs in
  German, English otherwise (weather conditions, default node names, all
  editor labels). The language follows Home Assistant at runtime; names you
  set yourself are never translated

## 5.3.1
- Fixed: the card looked darker than Trash Card Plus, EV Charge Card and
  Status Summary Card even though everything was set the same. The background
  was painted directly on `ha-card`, so in "Theme" mode the theme's own card
  style showed through (e.g. glass or card-mod themes), while the other cards
  paint the theme color on a separate layer. The background, including the
  glass effect, is now painted on `ha-card::before` exactly like in the other cards

## 5.3.0
- Shared design standard with Trash Card Plus, EV Charge Card and
  Status Summary Card: same options, same names, same order in the Design
  tab (accent color → card – background & transparency → card – border,
  shape & spacing → text)
- Design keys now have the same names as in the other cards: `card_bg_mode`,
  `card_bg_color`, `card_bg_opacity`, `card_bg_gradient`, `card_blur`,
  `card_border_mode`, `card_border_color`, `card_border_width`, `card_shadow`,
  `card_radius`. The previous keys (`bg_mode`, `blur`, `radius` …) are still
  understood and renamed automatically when editing
- The accent color is always at the top of the Design tab; padding up to 40 px

## 5.2.0
- Design tab aligned with the EV Charge Card: group "Card – background &
  transparency" with "Card background", "Card opacity", gradient
  and glass effect
- New backgrounds "Theme + tint" (`tinted`, opacity = strength of the
  tint) and "Full accent color" (`accent`), plus `accent_color`; the
  gradient is now also available for these two modes
- The accent border also uses `accent_color`
- The design keys of the EV Charge Card (`card_bg_mode`, `card_bg_opacity` …)
  are understood and converted to the card's own keys when editing

## 5.1.0
- New: weather display in the top corner. With `weather_entity` the
  current temperature and a small icon for the condition appear (sunny, clear,
  partly cloudy, cloudy, fog, rain, heavy rain, snow, sleet,
  hail, thunderstorm, wind, warning). The icons are colored and subtly animated,
  or monochrome as an MDI icon (`weather_icon_style: mono`). At night the
  sun turns into a moon
- The side is derived automatically from the title (opposite), but can also be
  fixed with `weather_position: left | right`
- Optional own temperature sensor (`weather_temperature_entity`), condition as
  text, size, decimals and tap action (default: weather details)
- Configurable in the editor under Display → Weather

## 5.0.0
- Editor completely rebuilt, consistent with the Status Summary Card and
  Trash Card Plus: tab bar (Nodes, Display, Animation, Values, Design),
  introduction per tab and collapsible groups with icons
- Nodes tab as a list with the icon in the node color, sensor, sorting and
  removing; tapping opens a separate edit page with live preview
  (current value and ring)
- New Design tab: background (theme, custom color, transparent) with
  opacity, gradient and glass effect, text color with automatic contrast,
  font size of the values, border, shadow, corner radius and padding
- Values that match the default are no longer written to the YAML;
  colors from YAML (e.g. hex) keep their original format when editing
- Fixed: the "Subtract from home consumption" switches were shown as off in the
  editor although the feature was active
- Fixed: `center_background` from the color picker ([r,g,b]) was not applied
- Fixed: an empty PV/grid/battery node is no longer saved as `{}`

## 4.6.1
- The ring variant of the state of charge (`soc_display: ring`) also shows the
  percentage inside the circle below the icon, in the state of charge color

## 4.6.0
- The state of charge of a consumer can be linked to a charging sensor:
  with `charging_entity` the battery icon or inner ring only appears while
  this sensor reports "charging". Automatically recognized are `on`, `true`,
  `charging`, `laden`, `lädt`, `ladend`, `active`, `aktiv` and numbers above 0;
  `charging_state` lets you define your own states. Both fields
  can be set in the editor under the consumer

## 4.5.0
- State of charge for consumers, e.g. the car at the wallbox: new
  `state_of_charge` under `individual` with two displays via
  `soc_display` — `battery` (horizontal battery with continuous fill and
  percentage inside the node, default) or `ring` (own ring inside the
  power ring, full at 100 %). Color via `soc_color`. For `unavailable`
  or `unknown` the indicator is hidden. Configurable in the editor under every
  consumer
- The power ring of a consumer now always shows the power. If you previously
  set a `state_of_charge` on a consumer via YAML, you saw the state of charge in the
  main ring; it is now shown in the new indicator
- Fixed: `display_zero_lines.mode: transparency` had no effect, the
  line of inactive nodes now actually becomes transparent
- Fixed: the ring size slider in the editor started at 200 instead of 140
- Removed unused leftovers from the code

## 4.4.0
- Fundamentally reworked how ring and node size are calculated: previously
  the card could silently recalculate `ring_radius` and `node_size` in many configurations,
  so the sliders barely had an effect.
  Both values are now applied directly and are visible over the whole range;
  the only remaining limit is pure geometry (neighboring nodes must
  not touch). If the size no longer fits into the 1000-unit base area,
  the drawing area grows instead of shrinking the ring or the nodes
- Example images regenerated with this geometry; the generator now measures
  text widths exactly instead of estimating them, so long names like
  "Wärmepumpe" are no longer cut off

## 4.3.0
- Reworked default geometry: spokes and dot tails were barely visible with the
  default values, with three or four nodes, nodes and hub even overlapped
  mathematically. The ring is now larger and the nodes smaller; this
  affects new cards immediately and existing ones after resetting
  `ring_radius`, `node_size` or `center_size` to the defaults
- Example images regenerated with the same geometry, two more added
  (two nodes as the tightest case, twelve nodes as the practical upper limit)

## 4.2.0
- Title font weight configurable, from light to extra bold

## 4.1.0
- The ring is hidden completely at 0 %; previously the round line cap
  remained visible as a small dot
- More example configurations including images, neutral hub in the documentation

## 4.0.0
- The title is an overlay on top of the graphic and no longer pushes it down
- Title color, title size and alignment configurable
- Editor reorganized into four groups with short hints

## 3.4.0
- Speed slider for all lines, faster defaults
- Pause between two cycles configurable

## 3.3.0
- Separate sensors for charging and discharging as well as import and export
- Ring transition duration configurable

## 3.2.0
- Dots are moved by the card's own timer instead of SMIL; value changes
  no longer reset the animation

## 3.1.0
- Ring background in the node color, nodes stay colored at 0 W
- Battery icon with bars by state of charge and percentage display
- Fill color for the center, ring transition via stroke-dashoffset

## 3.0.0
- Partial rings by maximum power, state of charge for the battery
- One dot per line with a tail
- Own icon set, order of the consumers can be changed
- Subtracting individual consumers from the home consumption

## 2.0.0
- Configuration editor with entity, icon and color pickers

## 1.0.0
- First version: radial layout, actions per node

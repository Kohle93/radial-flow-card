/**
 * Radial Flow Card
 * Eigenständige Lovelace-Karte: radiale Energieflussdarstellung mit Nabe,
 * animierten Punkten, display_zero-Ausgrauen und Actions pro Knoten.
 *
 * Kein Build-Schritt nötig — Datei als Modul-Ressource einbinden.
 */

const VERSION = "5.0.0";

/* ==================================================================
   Defaults
================================================================== */
const DEFAULTS = {
  title: null,
  title_color: null,
  title_size: 16,
  title_weight: 500,
  title_align: "left",
  center_image: null,
  center_icon: "mdi:flash",
  center_background: null,
  center_size: 1,
  center_image_fit: "contain",
  center_tap_action: { action: "none" },
  center_hold_action: { action: "none" },

  min_flow_rate: 0.45,
  max_flow_rate: 3,
  speed: 1,
  cycle_gap: 0.15,
  min_expected_power: 50,
  max_expected_power: 8000,

  kilo_threshold: 1000,
  base_decimals: 0,
  kilo_decimals: 2,

  display_zero_tolerance: 5,
  display_zero_lines: { mode: "show", grey_color: "#4e5867", transparency: 50 },

  dot_size: 1,
  track_opacity: 0.22,
  ring_transition: 400,
  tail_length: 0.08,
  tail_segments: 8,
  show_names: false,
  node_size: 1,
  ring_radius: 320,
  card_width: 100,

  // Design (gleiches System wie Status-Übersicht-Karte und Trash Card Plus)
  bg_mode: "theme",
  bg_color: null,
  bg_opacity: 100,
  bg_gradient: false,
  blur: 0,
  text_color_mode: "auto",
  text_color: null,
  font_scale: 100,
  border_mode: "theme",
  border_color: null,
  border_width: 1,
  shadow: "theme",
  radius: null,
  padding: 8,
};

const BASE_NODE_RADIUS = 92;    // Knotenradius bei node_size = 1, im 1000er-Grundraster
const OVERLAP_GAP = 0.9;        // Anteil des Abstands zum Nachbarknoten, den der Radius
                                 // höchstens einnehmen darf — reine Geometrie, kein Schätzwert

const PALETTE = {
  solar: "#f0b429",
  home: "#4cb5e0",
  battery: "#5cc47a",
  grid: "#8e98a4",
};
const DEFAULT_SOC_COLOR = "#5cc47a";
const INDIVIDUAL_PALETTE = [
  "#a97bd6", "#e8833a", "#5fb0a8", "#4c8ad9", "#d1637f", "#c9a227", "#7f9f3a", "#c76a4e",
];

const DEFAULT_ICONS = {
  solar: "mdi:solar-power-variant",
  home: "mdi:home",
  battery: "rf:battery",
  grid: "mdi:transmission-tower",
  individual: "mdi:flash-outline",
};

/* Eigener Icon-Satz, ueber icon: "rf:name" waehlbar. 24x24, nur Konturen. */
const RF_ICONS = {
  heatpump: `<rect x="2.5" y="6" width="19" height="12" rx="2.2"/><circle cx="9" cy="12" r="3.6"/>
    <path d="M9 12V8.4M9 12l3.1 1.8M9 12l-3.1 1.8"/>
    <path d="M15.8 9.6h3.6M15.8 12h3.6M15.8 14.4h3.6"/><path d="M6 18v2M18 18v2"/>`,
  "heatpump-fan": `<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="1.7"/>
    <path d="M12 10.3C12 7.1 13.7 5.3 16.2 5.6"/>
    <path d="M13.5 12.9c2.7 1.6 3.3 3.9 1.7 5.8"/>
    <path d="M10.5 12.9c-2.7 1.6-5 1-6-1.3"/>`,
  "heatpump-waves": `<rect x="2.5" y="7" width="12" height="10" rx="2"/><circle cx="8.5" cy="12" r="3"/>
    <path d="M8.5 12V9.4M8.5 12l2.4 1.3M8.5 12l-2.4 1.3"/>
    <path d="M17.6 8.8c1.4 1.1 1.4 2.1 0 3.2s-1.4 2.1 0 3.2"/>
    <path d="M20.8 8.8c1.4 1.1 1.4 2.1 0 3.2s-1.4 2.1 0 3.2"/>`,
  "heatpump-house": `<path d="M3.4 10.6 12 4l8.6 6.6"/><path d="M5.6 9.7V19.2h12.8V9.7"/>
    <circle cx="12" cy="14" r="3.2"/><path d="M12 14v-2.7M12 14l2.3 1.4M12 14l-2.3 1.4"/>`,
  "heat-waves": `<path d="M5 17.5c2-2.1 2-4.2 0-6.3s-2-4.2 0-6.3"/>
    <path d="M12 17.5c2-2.1 2-4.2 0-6.3s-2-4.2 0-6.3"/>
    <path d="M19 17.5c2-2.1 2-4.2 0-6.3s-2-4.2 0-6.3"/>`,
  radiator: `<rect x="3.8" y="5" width="16.4" height="12" rx="2"/>
    <path d="M8 5v12M12 5v12M16 5v12"/><path d="M7 20v-3M17 20v-3"/>`,
  "floor-heating": `<path d="M3 20V8.5c0-3 2-4.5 4.5-4.5S12 5.5 12 8.5 14 13 16.5 13 21 14.5 21 17.5V20"/>
    <path d="M3 20h18"/>`,
};

/** Batteriesymbol mit Balken nach Ladestand. pct als 0..1 */
function batteryIcon(pct) {
  const bars = 4;
  const filled = clamp(Math.round(pct * bars), pct > 0.02 ? 1 : 0, bars);
  let inner = "";
  for (let i = 0; i < filled; i++) {
    inner += `<rect x="${(4.4 + i * 3.55).toFixed(2)}" y="9.3" width="2.6" height="5.4" rx="0.6"
      fill="currentColor" stroke="none"/>`;
  }
  return `<rect x="2.6" y="6.9" width="17" height="10.2" rx="2.2"/>
    <rect x="20.3" y="10.2" width="1.5" height="3.6" rx="0.6" fill="currentColor" stroke="none"/>${inner}`;
}

/* Liegende Batterie für den Ladestand eines Verbrauchers (z. B. E-Auto an
   der Wallbox). Die Füllung wird stufenlos über ihre Breite gesetzt, das
   Element wird einmal gebaut und danach nur noch per Attribut aktualisiert. */
const SOC_FILL_X = 2.4;
const SOC_FILL_MAX = 17.2;
function socBatteryMarkup() {
  return `<svg class="soc-batt" viewBox="0 0 24 12" fill="none" stroke="currentColor"
    stroke-width="1.4" stroke-linejoin="round" aria-hidden="true">
    <rect x="0.7" y="0.7" width="20.2" height="10.6" rx="2.2"/>
    <rect x="21.4" y="3.8" width="1.9" height="4.4" rx="0.7" fill="currentColor" stroke="none"/>
    <rect class="soc-fill" x="${SOC_FILL_X}" y="2.4" width="0" height="7.2" rx="0.9"
      fill="currentColor" stroke="none"/>
  </svg>`;
}

const SOC_DISPLAY_MODES = ["battery", "ring", "none"];

/* Zustände, die ohne eigene Angabe als "lädt gerade" gelten (Groß-/Kleinschreibung egal).
   Zusätzlich gilt jeder Zahlenwert > 0 als aktiv, z. B. eine Ladeleistung. */
const CHARGING_STATES = ["on", "true", "charging", "laden", "lädt", "ladend", "active", "aktiv"];

/** Prüft, ob ein Sensorzustand als "lädt gerade" zählt. */
function isChargingState(state, custom) {
  if (state === undefined || state === null) return false;
  const s = String(state).trim().toLowerCase();
  if (s === "unavailable" || s === "unknown" || s === "") return false;
  if (custom !== undefined && custom !== null && custom !== "") {
    const list = (Array.isArray(custom) ? custom : String(custom).split(","))
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);
    return list.includes(s);
  }
  if (CHARGING_STATES.includes(s)) return true;
  const v = Number(s);
  return Number.isFinite(v) && v > 0;
}

function svgIcon(body) {
  return `<svg class="rf-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function iconMarkup(icon, fallback) {
  const ic = icon || fallback;
  if (typeof ic === "string" && ic.startsWith("rf:")) {
    if (ic === "rf:battery") return svgIcon(batteryIcon(1));
    return svgIcon(RF_ICONS[ic.slice(3)] || RF_ICONS.heatpump);
  }
  return `<ha-icon icon="${ic}"></ha-icon>`;
}

const NODE_LABELS = {
  solar: "PV",
  home: "Haus",
  battery: "Speicher",
  grid: "Netz",
};

/* SVG-Koordinatensystem: 1000x1000 ist die komfortable Grundgröße.
   Übersteigt Ring + Knoten + Beschriftung diesen Rahmen, wächst die
   Zeichenfläche in _render() mit, statt Ring oder Knoten eigenmächtig
   zu verkleinern — node_size und ring_radius behalten dadurch immer
   genau das Verhältnis, das eingestellt wurde. */
const BASE_VB = 1000;
const HUB_R = 44;
const GAP = 14;

/* ==================================================================
   Hilfsfunktionen
================================================================== */
const rad = (d) => (d * Math.PI) / 180;
const U = (a) => ({ x: Math.cos(rad(a)), y: Math.sin(rad(a)) });
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Farbe als Hex-String oder [r,g,b] aus dem Farbwaehler. */
function toColor(c, fallback) {
  if (c === undefined || c === null || c === "") return fallback;
  if (Array.isArray(c)) return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  return c;
}

/* ==================================================================
   Design – dasselbe System wie in der Status-Übersicht-Karte und der
   Trash Card Plus: Hintergrund mit Deckkraft, Farbverlauf und
   Glas-Effekt, Textfarbe mit automatischem Kontrast, Rahmen, Schatten,
   Eckenradius und Innenabstand.
================================================================== */
const THEME_BG = "var(--ha-card-background, var(--card-background-color, #1b2029))";
const SHADOWS = {
  none: "none",
  soft: "0 2px 8px rgba(0,0,0,.12)",
  strong: "0 6px 20px rgba(0,0,0,.28)",
};

/** [r,g,b] aus Farbwähler-Array, Hex-Code oder rgb()-String, sonst null. */
function rgbOf(c) {
  if (Array.isArray(c) && c.length >= 3) return c.slice(0, 3).map((v) => Number(v) || 0);
  if (typeof c !== "string") return null;
  const s = c.trim();
  let h = s.replace("#", "");
  if (s.startsWith("#")) {
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split("").map((x) => x + x).join("");
    if (/^[0-9a-f]{6}$/i.test(h)) return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return null;
  }
  const m = s.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

const sameRgb = (a, b) => {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return !!x && !!y && x.every((v, i) => v === y[i]);
};

function withAlpha(css, pct) {
  const p = clamp(Number(pct), 0, 100);
  if (p >= 100) return css;
  if (p <= 0) return "transparent";
  return `color-mix(in srgb, ${css} ${p}%, transparent)`;
}

function contrastText(rgb) {
  const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const lum = 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  return lum > 0.45 ? "#1c1c1c" : "#ffffff";
}

/** Liefert die CSS-Deklarationen für ha-card sowie die Textfarben. */
function cardDesign(c) {
  const css = [];
  let text = null;

  const mode = c.bg_mode || "theme";
  const op = clamp(num(c.bg_opacity ?? 100), 0, 100);
  if (mode === "none") {
    css.push("background: transparent");
  } else if (mode === "custom") {
    const col = toColor(c.bg_color, THEME_BG);
    const bg = c.bg_gradient
      ? `linear-gradient(135deg, ${withAlpha(col, op)} 0%, ${withAlpha(`color-mix(in srgb, ${col} 62%, black)`, op)} 100%)`
      : withAlpha(col, op);
    css.push(`background: ${bg}`);
    const rgb = rgbOf(c.bg_color);
    if ((c.text_color_mode || "auto") === "auto" && rgb && op >= 55) text = contrastText(rgb);
  } else if (op < 100) {
    css.push(`background: ${withAlpha(THEME_BG, op)}`);
  }

  const blur = clamp(num(c.blur), 0, 30);
  if (blur > 0) css.push(`backdrop-filter: blur(${blur}px)`, `-webkit-backdrop-filter: blur(${blur}px)`);

  // "theme" lässt den normalen Rahmen des Themes unangetastet
  const bw = clamp(num(c.border_width ?? 1), 0, 6);
  if (c.border_mode === "none") css.push("border: none");
  else if (c.border_mode === "accent") css.push(`border: ${bw}px solid var(--primary-color)`);
  else if (c.border_mode === "custom") css.push(`border: ${bw}px solid ${toColor(c.border_color, "var(--primary-color)")}`);

  if (c.shadow && c.shadow !== "theme") css.push(`box-shadow: ${SHADOWS[c.shadow] || "none"}`);
  if (c.radius !== null && c.radius !== undefined && c.radius !== "") css.push(`border-radius: ${clamp(num(c.radius), 0, 40)}px`);

  if (c.text_color_mode === "custom" && c.text_color) text = toColor(c.text_color);
  return {
    card: css.map((d) => `${d};`).join(" "),
    text,
    text2: text ? `color-mix(in srgb, ${text} 70%, transparent)` : null,
  };
}

function readSingle(hass, entityId) {
  const st = hass.states[entityId];
  if (!st || st.state === "unavailable" || st.state === "unknown") return 0;
  let v = num(st.state);
  const unit = st.attributes.unit_of_measurement;
  if (unit === "kW") v *= 1000;
  else if (unit === "MW") v *= 1000000;
  return v;
}

/** Liest eine Entity oder ein {consumption, production}-Paar als vorzeichenbehafteten Wert. */
function readEntity(hass, entity, invert) {
  if (!entity) return 0;
  let value;
  if (typeof entity === "object") {
    // consumption/discharge zaehlen zur Nabe hin, production/charge davon weg
    const plus = entity.consumption || entity.discharge;
    const minus = entity.production || entity.charge;
    const a = plus ? readSingle(hass, plus) : 0;
    const b = minus ? readSingle(hass, minus) : 0;
    value = a - b;
  } else {
    value = readSingle(hass, entity);
  }
  return invert ? -value : value;
}

/** HA-Formularkomponenten nachladen - sie existieren erst, wenn eine Karte sie gezogen hat. */
async function loadHaComponents() {
  if (customElements.get("ha-form") && customElements.get("ha-entity-picker")) return;
  if (!window.loadCardHelpers) return;
  try {
    const helpers = await window.loadCardHelpers();
    const card = await helpers.createCardElement({ type: "entities", entities: [] });
    if (card && card.constructor.getConfigElement) await card.constructor.getConfigElement();
  } catch (e) {
    /* Editor laeuft dann nur eingeschraenkt */
  }
}

function firstEntityId(entity) {
  if (!entity) return null;
  if (typeof entity === "object") {
    return entity.consumption || entity.discharge || entity.production || entity.charge || null;
  }
  return entity;
}

/* ==================================================================
   Action-Handling (ohne custom-card-helpers)
================================================================== */
function fire(node, type, detail) {
  const ev = new Event(type, { bubbles: true, composed: true, cancelable: false });
  ev.detail = detail || {};
  node.dispatchEvent(ev);
  return ev;
}

function runAction(host, hass, actionConfig, entityId) {
  const cfg = actionConfig || { action: "more-info" };
  const action = cfg.action || "more-info";

  switch (action) {
    case "none":
      return;
    case "more-info": {
      const id = cfg.entity || entityId;
      if (id) fire(host, "hass-more-info", { entityId: id });
      return;
    }
    case "navigate": {
      if (!cfg.navigation_path) return;
      history.pushState(null, "", cfg.navigation_path);
      const ev = new Event("location-changed", { bubbles: true, composed: true });
      ev.detail = { replace: false };
      window.dispatchEvent(ev);
      return;
    }
    case "url": {
      if (cfg.url_path) window.open(cfg.url_path, cfg.new_tab === false ? "_self" : "_blank");
      return;
    }
    case "toggle": {
      if (entityId) hass.callService("homeassistant", "toggle", { entity_id: entityId });
      return;
    }
    case "call-service":
    case "perform-action": {
      const target = cfg.service || cfg.perform_action || cfg.action_name;
      if (!target || !target.includes(".")) return;
      const [domain, service] = target.split(".", 2);
      hass.callService(domain, service, cfg.data || cfg.service_data || {}, cfg.target);
      return;
    }
    case "fire-dom-event": {
      fire(host, "ll-custom", cfg);
      return;
    }
    default:
      return;
  }
}

/**
 * Tap / Hold / Double-Tap auf einem Element.
 * Hold löst nach 500 ms aus, Double-Tap wird nur abgewartet, wenn auch
 * eine double_tap_action konfiguriert ist — sonst reagiert Tap sofort.
 */
function bindActions(el, getContext) {
  let holdTimer = null;
  let held = false;
  let clickTimer = null;

  const cancel = () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
  };

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    held = false;
    holdTimer = setTimeout(() => {
      held = true;
      const ctx = getContext();
      if (ctx) {
        if (navigator.vibrate) navigator.vibrate(15);
        runAction(ctx.host, ctx.hass, ctx.hold, ctx.entity);
      }
    }, 500);
  });

  const release = (e) => {
    cancel();
    if (held) { held = false; return; }
    if (e.type !== "pointerup") return;
    const ctx = getContext();
    if (!ctx) return;

    const hasDouble = ctx.double && ctx.double.action && ctx.double.action !== "none";
    if (!hasDouble) {
      runAction(ctx.host, ctx.hass, ctx.tap, ctx.entity);
      return;
    }
    if (clickTimer) {
      clearTimeout(clickTimer);
      clickTimer = null;
      runAction(ctx.host, ctx.hass, ctx.double, ctx.entity);
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        runAction(ctx.host, ctx.hass, ctx.tap, ctx.entity);
      }, 250);
    }
  };

  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);
  el.addEventListener("pointerleave", release);
  el.addEventListener("contextmenu", (e) => e.preventDefault());
  el.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    const ctx = getContext();
    if (ctx) runAction(ctx.host, ctx.hass, ctx.tap, ctx.entity);
  });
}

/* ==================================================================
   Karte
================================================================== */
class RadialFlowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._built = false;
    this._refs = {};
    this._hass = null;
  }

  /* ---------- Konfiguration ---------- */
  setConfig(config) {
    if (!config) throw new Error("Keine Konfiguration übergeben");
    const c = { ...DEFAULTS, ...config };
    c.display_zero_lines = { ...DEFAULTS.display_zero_lines, ...(config.display_zero_lines || {}) };
    this._config = c;

    // Knotenreihenfolge im Uhrzeigersinn ab oben:
    // PV → Haus → Verbraucher → Speicher → Netz.
    const nodes = [];
    if (c.solar) nodes.push(this._normalize("solar", c.solar, 0));
    nodes.push(this._normalize("home", c.home || {}, 0));
    (c.individual || []).forEach((ind, i) => nodes.push(this._normalize("individual", ind, i)));
    if (c.battery) nodes.push(this._normalize("battery", c.battery, 0));
    if (c.grid) nodes.push(this._normalize("grid", c.grid, 0));

    this._nodes = nodes;
    this._built = false;
    if (this.shadowRoot) this.shadowRoot.innerHTML = "";
    if (this._hass) this._render();
  }

  _normalize(type, cfg, index) {
    const conf = typeof cfg === "string" ? { entity: cfg } : { ...cfg };
    const fallbackColor =
      type === "individual"
        ? INDIVIDUAL_PALETTE[index % INDIVIDUAL_PALETTE.length]
        : PALETTE[type];
    return {
      key: `${type}_${index}`,
      type,
      entity: conf.entity,
      invert: !!conf.invert,
      name: conf.name,
      icon: conf.icon,
      color: toColor(conf.color, fallbackColor),
      unit: conf.unit,
      decimals: conf.decimals,
      note: conf.note,
      secondary_entity: conf.secondary_entity,
      secondary_unit: conf.secondary_unit,
      state_of_charge: conf.state_of_charge,
      // Ladestand eines Verbrauchers: eigene Anzeige, der Leistungsring bleibt Leistung
      soc_display:
        type === "individual" && conf.state_of_charge
          ? (SOC_DISPLAY_MODES.includes(conf.soc_display) ? conf.soc_display : "battery")
          : "none",
      soc_color: toColor(conf.soc_color, DEFAULT_SOC_COLOR),
      // Optional: Ladestand nur zeigen, solange dieser Sensor "lädt" meldet
      charging_entity: conf.charging_entity,
      charging_state: conf.charging_state,
      max_power: conf.max_power,
      ring_source: conf.ring_source,
      subtract_from_home: conf.subtract_from_home !== false,
      subtract: conf.subtract_individual !== false,
      tap_action: conf.tap_action || { action: "more-info" },
      hold_action: conf.hold_action || { action: "none" },
      double_tap_action: conf.double_tap_action || { action: "none" },
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._render();
    else this._update();
  }

  getCardSize() {
    return 6 + Math.ceil((this._nodes ? this._nodes.length : 6) / 3);
  }

  getGridOptions() {
    const n = this._nodes ? this._nodes.length : 6;
    return { rows: 6 + Math.ceil(n / 4), columns: 12, min_rows: 5, min_columns: 6 };
  }

  getLayoutOptions() {
    return { grid_rows: 8, grid_columns: 12, grid_min_rows: 5 };
  }

  static async getConfigElement() {
    await loadHaComponents();
    return document.createElement("radial-flow-card-editor");
  }

  static getStubConfig(hass) {
    const pick = (words) =>
      Object.keys(hass?.states || {}).find(
        (id) => id.startsWith("sensor.") && words.some((w) => id.includes(w))
      );
    return {
      solar: { entity: pick(["solar", "pv"]) || "" },
      grid: { entity: pick(["grid", "netz"]) || "" },
      individual: [],
    };
  }

  /* ---------- Aufbau (einmalig) ---------- */
  _render() {
    if (!this._hass || !this._config) return;
    const c = this._config;
    const nodes = this._nodes;
    const N = nodes.length;
    const step = 360 / N;

    // ring_radius und node_size werden direkt übernommen — keine verdeckte
    // Rückrechnung, die die eingestellten Werte wieder verwirft. Die einzige
    // Grenze für die Knotengröße ist die reine Geometrie: Nachbarknoten
    // dürfen sich nicht berühren.
    const ringR = clamp(c.ring_radius, 140, 400);
    const desiredNodeR = BASE_NODE_RADIUS * clamp(c.node_size, 0.5, 1.8);
    const noOverlapR = ringR * Math.sin(Math.PI / N) * OVERLAP_GAP;
    const nodeR = Math.min(desiredNodeR, noOverlapR);
    const hubR = HUB_R * clamp(c.center_size, 0.6, 1.8);

    // Passt das bei der eingestellten Größe nicht mehr in die 1000er-Fläche,
    // wächst die Zeichenfläche mit, statt Ring oder Knoten zu verkleinern.
    // Ring und Knoten behalten so exakt das eingestellte Verhältnis; lediglich
    // die ganze Grafik wird dann gemeinsam etwas kleiner dargestellt.
    const labelMargin = c.show_names ? 150 : 120;
    const half = Math.max(BASE_VB / 2, ringR + nodeR + labelMargin);
    const vb = half * 2;
    const cx = half;
    const cy = half;

    const strokeW = Math.max(5, nodeR * 0.08);
    const arcR = nodeR - strokeW / 2;
    const circ = 2 * Math.PI * arcR;

    // Innerer Ladestandsring: etwas schmaler, mit kleinem Abstand nach innen
    const socStrokeW = strokeW * 0.8;
    const socR = arcR - strokeW / 2 - strokeW * 0.6 - socStrokeW / 2;
    const socCirc = 2 * Math.PI * socR;
    this._geo = { ringR, nodeR, strokeW, arcR, circ, hubR, vb, socCirc };

    const tailSeg = clamp(c.tail_segments, 0, 16);
    const headR = 8 * clamp(c.dot_size, 0.4, 2.5);

    let lines = "";
    let rings = "";
    let dots = "";

    nodes.forEach((n, i) => {
      const a = -90 + i * step;
      const u = U(a);
      const x1 = (cx + (hubR + GAP) * u.x).toFixed(1);
      const y1 = (cy + (hubR + GAP) * u.y).toFixed(1);
      const x2 = (cx + (ringR - nodeR - GAP) * u.x).toFixed(1);
      const y2 = (cy + (ringR - nodeR - GAP) * u.y).toFixed(1);
      const d = `M${x1},${y1} L${x2},${y2}`;
      n._u = u;
      n._a = { x: +x1, y: +y1 };   // Nabenseite
      n._b = { x: +x2, y: +y2 };   // Knotenseite

      const px = (cx + ringR * u.x).toFixed(1);
      const py = (cy + ringR * u.y).toFixed(1);

      lines += `<path class="line" id="l-${n.key}" d="${d}"/>`;

      // Track in Knotenfarbe: der Knoten bleibt auch bei 0 W farbig
      rings += `<circle class="track" cx="${px}" cy="${py}" r="${arcR.toFixed(1)}"
          stroke="${n.color}" stroke-width="${strokeW.toFixed(1)}"/>
        <circle class="ring" id="r-${n.key}" cx="${px}" cy="${py}" r="${arcR.toFixed(1)}"
          stroke="${n.color}" stroke-width="${strokeW.toFixed(1)}" stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="0"
          transform="rotate(-90 ${px} ${py})"/>`;

      // Variante 2: Ladestand als eigener Ring innerhalb des Leistungsrings
      if (n.soc_display === "ring") {
        rings += `<circle class="soc-track" id="st-${n.key}" cx="${px}" cy="${py}" r="${socR.toFixed(1)}"
            stroke="${n.soc_color}" stroke-width="${socStrokeW.toFixed(1)}"/>
          <circle class="soc-ring" id="sr-${n.key}" cx="${px}" cy="${py}" r="${socR.toFixed(1)}"
            stroke="${n.soc_color}" stroke-width="${socStrokeW.toFixed(1)}" stroke-linecap="round"
            stroke-dasharray="${socCirc.toFixed(1)} ${socCirc.toFixed(1)}"
            stroke-dashoffset="${socCirc.toFixed(1)}" stroke-opacity="0"
            transform="rotate(-90 ${px} ${py})"/>`;
      }

      // Genau ein Punkt je Linie, dahinter der Schweif.
      // Bewegt wird per eigenem Zeitgeber, nicht per SMIL.
      n._dots = [];
      for (let t = 0; t <= tailSeg; t++) {
        const frac = tailSeg ? t / tailSeg : 0;
        const r = (headR * (1 - 0.62 * frac)).toFixed(2);
        const op = +(1 - 0.9 * frac).toFixed(3);
        const id = `${n.key}-${t}`;
        n._dots.push({ id, op, t });
        dots += `<circle class="dot" id="d-${id}" r="${r}" fill="${n.color}" opacity="0"
          cx="0" cy="0" transform="translate(${x1},${y1})"/>`;
      }
    });

    const hub = c.center_image
      ? `<img class="hub-img" src="${c.center_image}" alt="">`
      : `<ha-icon class="hub-icon" icon="${c.center_icon}"></ha-icon>`;

    this.shadowRoot.innerHTML = `
      <style>${this._styles(nodeR, hubR, vb)}</style>
      <ha-card>
        ${c.title ? `<div class="title">${String(c.title).replace(/[<>]/g, "")}</div>` : ""}
        <div class="wrap">
          <svg class="flow" id="flow" viewBox="0 0 ${vb} ${vb}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <g>${lines}</g>
            <g>${rings}</g>
            <g>${dots}</g>
          </svg>
          <div class="hub" id="hub" role="button" tabindex="0">${hub}</div>
          ${nodes.map((n) => this._nodeHtml(n, ringR, nodeR, vb)).join("")}
        </div>
      </ha-card>`;

    this._svg = this.shadowRoot.getElementById("flow");
    this._refs = {};
    nodes.forEach((n) => {
      const root = this.shadowRoot.getElementById(`n-${n.key}`);
      this._refs[n.key] = {
        root,
        line: this.shadowRoot.getElementById(`l-${n.key}`),
        ring: this.shadowRoot.getElementById(`r-${n.key}`),
        icon: root.querySelector(".node-icon"),
        soc: root.querySelector(".soc"),
        value: root.querySelector(".value"),
        unit: root.querySelector(".unit"),
        name: root.querySelector(".name"),
        extra: root.querySelector(".extra"),
        socBadge: root.querySelector(".soc-badge"),
        socFill: root.querySelector(".soc-fill"),
        socPct: root.querySelector(".soc-pct"),
        socRing: this.shadowRoot.getElementById(`sr-${n.key}`),
        socTrack: this.shadowRoot.getElementById(`st-${n.key}`),
        lastSoc: undefined,
        dots: n._dots.map((d) => ({
          el: this.shadowRoot.getElementById(`d-${d.id}`),
          op: d.op,
          t: d.t,
          shown: false,
        })),
        a: n._a,
        b: n._b,
        node: n,
        on: false,
        inward: false,
        dur: 3,
        p: 0,
        lastOffset: null,
        lastBars: null,
      };
      bindActions(root, () => ({
        host: this,
        hass: this._hass,
        entity: firstEntityId(n.entity),
        tap: n.tap_action,
        hold: n.hold_action,
        double: n.double_tap_action,
      }));
    });

    bindActions(this.shadowRoot.getElementById("hub"), () => ({
      host: this,
      hass: this._hass,
      entity: null,
      tap: c.center_tap_action,
      hold: c.center_hold_action,
      double: { action: "none" },
    }));

    this._anim = { phase: "solar", gap: 0 };
    this._built = true;
    this._update();
    this._startLoop();
  }

  _nodeHtml(n, ringR, nodeR, vb) {
    const px = ((ringR * n._u.x) / vb) * 100;
    const py = ((ringR * n._u.y) / vb) * 100;
    const size = ((2 * nodeR) / vb) * 100;
    const vertical = Math.abs(n._u.x) < 0.25;
    const side = vertical ? (n._u.y > 0 ? "below" : "above") : n._u.x > 0 ? "right" : "left";
    const showSoc = n.type === "battery" && n.state_of_charge;
    // Batterie-Variante: Symbol + Prozent; Ring-Variante: nur Prozent im Kreis
    const socBadge = n.soc_display === "battery" || n.soc_display === "ring"
      ? `<div class="soc-badge" style="color:${n.soc_color};">${
          n.soc_display === "battery" ? socBatteryMarkup() : ""}<span class="soc-pct"></span></div>`
      : "";

    return `
      <div class="node ${side}" id="n-${n.key}" role="button" tabindex="0"
           style="left:${(50 + px).toFixed(2)}%; top:${(50 + py).toFixed(2)}%; width:${size.toFixed(2)}%; color:${n.color};">
        <div class="node-inner">
          <div class="node-icon">${iconMarkup(n.icon, DEFAULT_ICONS[n.type])}</div>
          ${showSoc ? `<div class="soc"></div>` : ""}
          ${socBadge}
        </div>
        <div class="label">
          <div class="line1"><span class="value">0</span><span class="unit">W</span></div>
          <div class="name"></div>
          <div class="extra"></div>
        </div>
      </div>`;
  }

  _styles(nodeR, hubR, vb) {
    const c = this._config;
    const filled = !!c.center_background;
    const d = cardDesign(c);
    const pad = clamp(num(c.padding ?? 8), 0, 32);
    const fs = clamp(num(c.font_scale ?? 100), 60, 160) / 100;
    return `
      :host { display: block; }
      ha-card {
        overflow: hidden; padding: 0 ${pad}px ${pad + 4}px; position: relative; ${d.card}
        ${d.text ? `--rf-text: ${d.text}; --rf-text2: ${d.text2};` : ""}
      }
      .title {
        position: absolute;
        top: 12px;
        ${c.title_align === "right" ? `right: ${pad + 10}px;` : c.title_align === "center" ? "left: 0; right: 0; text-align: center;" : `left: ${pad + 10}px;`}
        z-index: 2;
        pointer-events: none;
        font-size: ${clamp(c.title_size ?? 16, 8, 48)}px;
        font-weight: ${clamp(Math.round((c.title_weight ?? 500) / 100) * 100, 100, 900)};
        line-height: 1.2;
        color: ${toColor(c.title_color, "var(--rf-text, var(--primary-text-color))")};
      }
      .wrap {
        position: relative;
        width: ${clamp(c.card_width, 40, 100)}%;
        max-width: calc(100% - 8px);
        margin: 8px auto 0;
        aspect-ratio: 1 / 1;
        container-type: inline-size;
      }
      .flow { position: absolute; inset: 0; width: 100%; height: 100%; }
      .line { fill: none; stroke: var(--rf-line, rgba(127,140,158,.3)); stroke-width: 4; transition: stroke .4s ease; }
      .line.active { stroke: var(--rf-line-active, rgba(160,175,195,.55)); }
      .track { fill: none; stroke-opacity: ${clamp(c.track_opacity ?? 0.22, 0, 1)}; }
      .ring { fill: none; transition: stroke-dashoffset ${clamp(c.ring_transition ?? 400, 0, 3000)}ms cubic-bezier(.4,0,.2,1); }
      .dot { pointer-events: none; }

      .hub {
        position: absolute; left: 50%; top: 50%;
        width: ${((2 * hubR) / vb) * 100}%; aspect-ratio: 1;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        background: ${filled ? toColor(c.center_background) : THEME_BG};
        border: ${filled ? "none" : "1.5px solid var(--divider-color, rgba(127,140,158,.4))"};
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; overflow: hidden;
      }
      .hub-img {
        width: 100%; height: 100%;
        object-fit: ${c.center_image_fit === "cover" ? "cover" : "contain"};
        ${c.center_image_fit === "cover" ? "" : "padding: 14%; box-sizing: border-box;"}
      }
      .hub-icon { --mdc-icon-size: 6cqw; color: var(--rf-text2, var(--secondary-text-color)); }

      .node {
        position: absolute; transform: translate(-50%, -50%);
        aspect-ratio: 1; cursor: pointer; outline: none;
        display: flex; align-items: center; justify-content: center;
      }
      .node:focus-visible { border-radius: 50%; box-shadow: 0 0 0 3px var(--primary-color); }
      .node-inner { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
      .node-icon { display: flex; align-items: center; justify-content: center; color: inherit; }
      .node-icon ha-icon { --mdc-icon-size: ${((nodeR * 0.9) / vb) * 100}cqw; color: inherit; }
      .node-icon .rf-icon { width: ${((nodeR * 0.96) / vb) * 100}cqw; height: ${((nodeR * 0.96) / vb) * 100}cqw; color: inherit; }
      .soc { font-size: ${((nodeR * 0.3) / vb) * 100}cqw; font-weight: 600; color: inherit; margin-top: 4%; }

      /* Ladestand eines Verbrauchers, Variante 1: liegende Batterie + Prozent */
      .soc-badge { display: none; align-items: center; justify-content: center;
                   gap: ${((nodeR * 0.06) / vb) * 100}cqw; margin-top: ${((nodeR * 0.05) / vb) * 100}cqw; }
      .node.soc-on .soc-badge { display: flex; }
      .node.soc-on .node-icon ha-icon { --mdc-icon-size: ${((nodeR * 0.74) / vb) * 100}cqw; }
      .node.soc-on .node-icon .rf-icon { width: ${((nodeR * 0.78) / vb) * 100}cqw; height: ${((nodeR * 0.78) / vb) * 100}cqw; }
      .soc-batt { width: ${((nodeR * 0.44) / vb) * 100}cqw; height: ${((nodeR * 0.22) / vb) * 100}cqw; flex: none; }
      .soc-fill { transition: width ${clamp(c.ring_transition ?? 400, 0, 3000)}ms cubic-bezier(.4,0,.2,1); }
      .soc-pct { font-size: ${((nodeR * 0.28) / vb) * 100}cqw; font-weight: 600; line-height: 1; white-space: nowrap; }

      /* Variante 2: innerer Ring */
      .soc-track { fill: none; stroke-opacity: ${clamp(c.track_opacity ?? 0.22, 0, 1)}; }
      .soc-ring { fill: none; transition: stroke-dashoffset ${clamp(c.ring_transition ?? 400, 0, 3000)}ms cubic-bezier(.4,0,.2,1); }

      .label { position: absolute; white-space: nowrap; line-height: 1.2; }
      .node.right .label { left: 106%; top: 50%; transform: translateY(-50%); text-align: left; }
      .node.left  .label { right: 106%; top: 50%; transform: translateY(-50%); text-align: right; }
      .node.above .label { bottom: 104%; left: 50%; transform: translateX(-50%); text-align: center; }
      .node.below .label { top: 104%; left: 50%; transform: translateX(-50%); text-align: center; }

      .line1 { font-size: ${(4.4 * fs).toFixed(2)}cqw; font-weight: 600; color: var(--rf-text, var(--primary-text-color)); letter-spacing: -.01em; }
      .unit { font-size: ${(2.9 * fs).toFixed(2)}cqw; font-weight: 400; color: var(--rf-text2, var(--secondary-text-color)); margin-left: 3px; }
      .name, .extra { font-size: ${(2.6 * fs).toFixed(2)}cqw; color: var(--rf-text2, var(--secondary-text-color)); }
      .name { display: ${c.show_names ? "block" : "none"}; }
      .name:empty, .extra:empty { display: none; }

      @media (prefers-reduced-motion: reduce) { .dot { display: none; } }
    `;
  }

  /* ---------- Update (nur Attribute) ---------- */
  _update() {
    if (!this._built || !this._hass) return;
    const hass = this._hass;
    const c = this._config;
    const tol = c.display_zero_tolerance;
    const { circ } = this._geo;

    const raw = {};
    this._nodes.forEach((n) => { raw[n.key] = readEntity(hass, n.entity, n.invert); });

    const solarNode = this._nodes.find((n) => n.type === "solar");
    const gridNode = this._nodes.find((n) => n.type === "grid");
    const battNode = this._nodes.find((n) => n.type === "battery");
    const homeNode = this._nodes.find((n) => n.type === "home");
    const individuals = this._nodes.filter((n) => n.type === "individual");

    const solar = solarNode ? Math.abs(raw[solarNode.key]) : 0;
    const grid = gridNode ? raw[gridNode.key] : 0;   // + = Bezug
    const batt = battNode ? raw[battNode.key] : 0;   // + = Entladen

    const masterSubtract = !homeNode || homeNode.subtract !== false;
    const subtractSum = individuals.reduce(
      (a, n) => a + (masterSubtract && n.subtract_from_home ? Math.abs(raw[n.key]) : 0),
      0
    );

    let homeTotal;
    if (homeNode && homeNode.entity) {
      homeTotal = Math.abs(raw[homeNode.key]);
    } else {
      homeTotal =
        solar + Math.max(grid, 0) + Math.max(batt, 0) -
        Math.max(-grid, 0) - Math.max(-batt, 0);
    }
    const home = Math.max(homeTotal - subtractSum, 0);

    const state = {};
    this._nodes.forEach((n) => {
      if (n.type === "solar") state[n.key] = { v: solar, inward: true };
      else if (n.type === "grid") state[n.key] = { v: Math.abs(grid), inward: grid > 0 };
      else if (n.type === "battery") state[n.key] = { v: Math.abs(batt), inward: batt > 0 };
      else if (n.type === "home") state[n.key] = { v: home, inward: false };
      else state[n.key] = { v: Math.abs(raw[n.key]), inward: false };
    });

    /* Der Zeitgeber unten liest nur noch on / dur / inward ab.
       Es wird nichts neu gestartet, ein Wechsel ändert lediglich das Tempo. */
    this._nodes.forEach((n) => {
      const s = state[n.key];
      const r = this._refs[n.key];
      const on = s.v > tol;

      const [val, unit] = this._format(s.v, n);
      if (r.value.textContent !== val) r.value.textContent = val;
      if (r.unit.textContent !== unit) r.unit.textContent = unit;

      const name = n.name || NODE_LABELS[n.type] || this._friendlyName(n) || "";
      if (r.name.textContent !== name) r.name.textContent = name;

      const extra = this._extraLine(n);
      if (r.extra.textContent !== extra) r.extra.textContent = extra;

      r.root.classList.toggle("off", !on);

      // Ring über stroke-dashoffset, damit der Übergang weich interpoliert
      const pct = this._ringPercent(n, s.v);
      const offset = +((1 - pct) * circ).toFixed(1);
      if (r.lastOffset !== offset) {
        r.ring.setAttribute("stroke-dashoffset", offset);
        // Bei 0 % wuerde die runde Linienkappe als Punkt stehen bleiben
        r.ring.setAttribute("stroke-opacity", pct < 0.004 ? "0" : "1");
        r.lastOffset = offset;
      }

      if (n.type === "battery" && (n.icon || DEFAULT_ICONS.battery) === "rf:battery") {
        const bars = clamp(Math.round(pct * 4), pct > 0.02 ? 1 : 0, 4);
        if (r.lastBars !== bars) {
          r.icon.innerHTML = svgIcon(batteryIcon(pct));
          r.lastBars = bars;
        }
      }
      if (r.soc) {
        const txt = `${Math.round(pct * 100)} %`;
        if (r.soc.textContent !== txt) r.soc.textContent = txt;
      }

      // Ladestand eines Verbrauchers (Batteriesymbol oder innerer Ring).
      // Ohne gültigen Wert (Auto nicht verbunden o. ä.) bleibt die Anzeige weg.
      if (n.soc_display !== "none") {
        // Ist ein Lade-Sensor gesetzt, erscheint der Ladestand nur während des Ladens
        const charging = !n.charging_entity ||
          isChargingState(hass.states[n.charging_entity]?.state, n.charging_state);
        const soc = charging ? this._socPercent(n) : null;
        if (r.lastSoc !== soc) {
          r.lastSoc = soc;
          const has = soc !== null;
          r.root.classList.toggle("soc-on", has);
          if (r.socBadge && has) {
            if (r.socFill) {
              const w = (SOC_FILL_MAX * soc).toFixed(2);
              // Attribut für alle Browser, CSS-Wert zusätzlich für den weichen Übergang
              r.socFill.setAttribute("width", w);
              r.socFill.style.width = `${w}px`;
            }
            r.socPct.textContent = `${Math.round(soc * 100)} %`;
          }
          if (r.socRing) {
            const sc = this._geo.socCirc;
            r.socRing.setAttribute("stroke-dashoffset", ((1 - (has ? soc : 0)) * sc).toFixed(1));
            r.socRing.setAttribute("stroke-opacity", has && soc >= 0.004 ? "1" : "0");
            r.socTrack.style.display = has ? "" : "none";
          }
        }
      }

      const mode = c.display_zero_lines.mode;
      r.line.classList.toggle("active", on);
      r.line.style.display = !on && mode === "hide" ? "none" : "";
      r.line.style.stroke = !on && mode === "grey" ? this._greyColor() : "";
      r.line.style.opacity = !on && mode === "transparency" ? this._greyOpacity() : "";

      r.on = on;
      r.inward = s.inward;
      r.dur = Math.max(0.25, this._flowDuration(s.v));
    });

    this._startLoop();
  }

  /* ------------------------------------------------------------------
     Zeitgeber für die Punkte.
     Jede Linie führt ihren eigenen Fortschritt p von 0 bis 1 + Schweiflänge.
     Ein neuer Sensorwert ändert nur die Schrittweite, nie die Position —
     dadurch läuft ein Punkt beim Aktualisieren einfach weiter.
  ------------------------------------------------------------------ */
  _startLoop() {
    if (this._raf || !this._built) return;
    if (typeof requestAnimationFrame !== "function") return;
    let last = null;
    const tick = (now) => {
      if (!this._built) { this._raf = null; return; }
      const dt = last === null ? 0 : Math.min((now - last) / 1000, 0.15);
      last = now;
      this._advance(dt);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  _advance(dt) {
    const c = this._config;
    const tail = clamp(c.tail_length, 0, 0.3);
    const refs = this._nodes.map((n) => this._refs[n.key]);
    const solarRef = refs.find((r) => r.node.type === "solar");
    const solarRuns = solarRef && solarRef.on;
    const rest = refs.filter((r) => r !== solarRef);
    const a = this._anim;
    const END = 1 + tail;

    const step = (r) => { if (r.on) r.p = Math.min(r.p + dt / r.dur, END); };

    if (dt > 0) {
      if (a.phase === "solar") {
        if (solarRuns) {
          step(solarRef);
          if (solarRef.p >= 1) a.phase = "rest";
        } else {
          a.phase = "rest";
        }
      } else if (a.phase === "rest") {
        if (solarRuns) step(solarRef);
        rest.forEach(step);
        const running = refs.filter((r) => r.on);
        if (!running.length || running.every((r) => r.p >= END)) {
          a.phase = "gap";
          a.gap = clamp(c.cycle_gap ?? 0.15, 0, 3);
        }
      } else {
        a.gap -= dt;
        if (a.gap <= 0) {
          refs.forEach((r) => { r.p = 0; });
          a.phase = "solar";
        }
      }
    }

    // Positionen schreiben
    const tailStep = refs.length && refs[0].dots.length > 1
      ? tail / (refs[0].dots.length - 1)
      : 0;

    refs.forEach((r) => {
      for (let i = 0; i < r.dots.length; i++) {
        const d = r.dots[i];
        const pj = r.p - i * tailStep;
        // pj > 0: ein wartender Punkt darf nicht am Startpunkt stehen bleiben
        const visible = r.on && pj > 0 && pj <= 1;
        if (!visible) {
          if (d.shown) { d.el.setAttribute("opacity", "0"); d.shown = false; }
          continue;
        }
        const t = r.inward ? 1 - pj : pj;
        const x = r.a.x + (r.b.x - r.a.x) * t;
        const y = r.a.y + (r.b.y - r.a.y) * t;
        d.el.setAttribute("transform", `translate(${x.toFixed(1)},${y.toFixed(1)})`);
        if (!d.shown) { d.el.setAttribute("opacity", String(d.op)); d.shown = true; }
      }
    });
  }

  connectedCallback() {
    if (this._built) this._startLoop();
    this._onVisibility = () => {
      if (document.hidden) this._stopLoop();
      else this._startLoop();
    };
    document.addEventListener("visibilitychange", this._onVisibility);
  }

  disconnectedCallback() {
    this._stopLoop();
    if (this._onVisibility) document.removeEventListener("visibilitychange", this._onVisibility);
  }

  /** Anteil des Rings: 1 = Vollkreis. Speicher bevorzugt den Ladestand. */
  _ringPercent(n, value) {
    // Nur der Speicher zeigt den Ladestand im Hauptring. Verbraucher haben
    // dafür eine eigene Anzeige (Batteriesymbol oder innerer Ring).
    if (n.type === "battery" && n.ring_source !== "power" && n.state_of_charge) {
      const st = this._hass.states[n.state_of_charge];
      if (st) return clamp(num(st.state) / 100, 0, 1);
    }
    if (n.max_power > 0) return clamp(value / n.max_power, 0, 1);
    return 1;
  }

  /** Ladestand eines Verbrauchers als 0..1, null wenn nicht verfügbar. */
  _socPercent(n) {
    const st = n.state_of_charge ? this._hass.states[n.state_of_charge] : null;
    if (!st || st.state === "unavailable" || st.state === "unknown" || st.state === "") return null;
    const v = Number(st.state);
    return Number.isFinite(v) ? clamp(v / 100, 0, 1) : null;
  }

  _extraLine(n) {
    const parts = [];
    if (n.secondary_entity) {
      const st = this._hass.states[n.secondary_entity];
      if (st) {
        const u = n.secondary_unit ?? st.attributes.unit_of_measurement ?? "";
        parts.push(`${st.state}${u ? " " + u : ""}`);
      }
    }
    if (n.note) parts.push(n.note);
    return parts.join(" \u00b7 ");
  }

  _greyColor() {
    return toColor(this._config.display_zero_lines.grey_color, "#4e5867");
  }

  _greyOpacity() {
    const dz = this._config.display_zero_lines;
    return dz.mode === "transparency" ? String(1 - clamp(dz.transparency, 0, 100) / 100) : "1";
  }

  _friendlyName(n) {
    const id = firstEntityId(n.entity);
    return id ? this._hass.states[id]?.attributes.friendly_name : null;
  }

  /** Einheit je Knoten ueberschreibbar: W, kW oder frei. */
  _format(watt, n) {
    const c = this._config;
    const u = n.unit;
    if (u === "W") return [watt.toFixed(n.decimals ?? c.base_decimals), "W"];
    if (u === "kW") return [(watt / 1000).toFixed(n.decimals ?? c.kilo_decimals), "kW"];
    if (u) return [watt.toFixed(n.decimals ?? 1), u];
    if (Math.abs(watt) >= c.kilo_threshold) {
      return [(watt / 1000).toFixed(n.decimals ?? c.kilo_decimals), "kW"];
    }
    return [watt.toFixed(n.decimals ?? c.base_decimals), "W"];
  }

  _flowDuration(watt) {
    const c = this._config;
    const factor = clamp(c.speed ?? 1, 0.1, 6);
    let d;
    if (watt >= c.max_expected_power) d = c.min_flow_rate;
    else if (watt <= c.min_expected_power) d = c.max_flow_rate;
    else {
      d =
        c.max_flow_rate -
        ((watt - c.min_expected_power) * (c.max_flow_rate - c.min_flow_rate)) /
          (c.max_expected_power - c.min_expected_power);
    }
    return d / factor;
  }
}

/* ==================================================================
   Editor
================================================================== */
/* ==================================================================
   Editor – gleicher Aufbau wie Status-Übersicht-Karte und Trash Card
   Plus: Tab-Leiste oben, Einleitung je Tab, aufklappbare Gruppen mit
   Symbol, Knotenliste mit eigener Bearbeiten-Seite und Vorschau.
================================================================== */
const T = {
  tabs: { nodes: "Knoten", display: "Anzeige", motion: "Animation", values: "Werte", design: "Design" },
  intro: {
    nodes: "Welche Sensoren liefern die Leistung? PV, Haus, Speicher und Netz sind fest, Verbraucher kannst du beliebig ergänzen und sortieren. Zum Bearbeiten einfach antippen.",
    display: "Grundlayout der Grafik: Titel, Mitte sowie Größe von Knoten und Ring.",
    motion: "Wie schnell und wie auffällig die Punkte fließen. Das Tempo wirkt auf alle Linien, die Abstufung nach Leistung bleibt erhalten.",
    values: "Zahlenformat für alle Knoten, sofern dort nichts Eigenes eingetragen ist, und wie Linien bei 0 W aussehen.",
    design: "Hintergrund, Transparenz und Rahmen der Karte – genau wie bei der Status-Übersicht und der Abfall-Karte einstellbar.",
  },
  groups: {
    title: "Titel", center: "Mitte", ring: "Knoten & Ring",
    dots: "Punkte & Schweif", timing: "Tempo nach Leistung",
    number: "Zahlenformat", zero: "Darstellung bei 0 W",
    bg: "Hintergrund & Transparenz", text: "Text", frame: "Rahmen, Form & Abstände",
    sensor: "Sensor", look: "Name, Symbol & Farbe", node_values: "Werte & Ring", soc: "Ladestand",
    behaviour: "Verhalten", extra: "Zusatzinfo", actions: "Aktionen",
  },
  fields: {
    title: "Titel (optional)", title_color: "Titelfarbe", title_size: "Schriftgröße Titel",
    title_weight: "Schriftstärke Titel", title_align: "Ausrichtung Titel",
    center_icon: "Symbol in der Mitte", center_size: "Größe der Mitte",
    center_image: "Bild statt Symbol (URL)", center_image_fit: "Bild einpassen",
    center_background: "Füllfarbe der Mitte",
    center_tap_action: "Aktion beim Antippen der Mitte", center_hold_action: "Aktion beim Halten der Mitte",
    card_width: "Breite der Grafik", node_size: "Knotengröße", ring_radius: "Ringgröße",
    track_opacity: "Deckkraft Ringhintergrund", ring_transition: "Übergang des Rings",
    show_names: "Namen unter den Werten anzeigen",
    speed: "Tempo insgesamt", dot_size: "Punktgröße", cycle_gap: "Pause zwischen Durchläufen",
    tail_length: "Schweiflänge", tail_segments: "Schweifauflösung",
    min_flow_rate: "Schnellster Durchlauf", max_flow_rate: "Langsamster Durchlauf",
    min_expected_power: "Untere Leistungsgrenze", max_expected_power: "Obere Leistungsgrenze",
    kilo_threshold: "Ab dieser Leistung in kW anzeigen", base_decimals: "Nachkommastellen W",
    kilo_decimals: "Nachkommastellen kW", display_zero_tolerance: "Toleranz für „aus“",
    display_zero_mode: "Linie bei 0 W", grey_color: "Graufarbe", transparency: "Transparenz",
    bg_mode: "Hintergrund", bg_color: "Hintergrundfarbe", bg_opacity: "Deckkraft", bg_gradient: "Farbverlauf",
    blur: "Unschärfe dahinter (Glas-Effekt)",
    text_color_mode: "Textfarbe der Werte", text_color: "Eigene Textfarbe", font_scale: "Schriftgröße der Werte",
    border_mode: "Rahmen", border_color: "Rahmenfarbe", border_width: "Rahmenstärke",
    shadow: "Schatten", radius: "Eckenradius", padding: "Innenabstand",
    entity: "Sensor (Leistung)", entity_a: "Sensor A", entity_b: "Sensor B", invert: "Vorzeichen umkehren",
    name: "Name", icon: "Symbol", color: "Farbe", unit: "Einheit (leer = automatisch)", decimals: "Nachkommastellen",
    max_power: "Maximalleistung für den Ring", ring_source: "Ring zeigt",
    state_of_charge: "Ladestandssensor (%)", soc_display: "Anzeige des Ladestands", soc_color: "Farbe des Ladestands",
    charging_entity: "Sensor „lädt gerade“ (optional)", charging_state: "Zustände für „lädt“ (leer = automatisch)",
    subtract_from_home: "Vom Hausverbrauch abziehen", subtract_individual: "Verbraucher vom Hausverbrauch abziehen",
    secondary_entity: "Zusatzsensor (dritte Zeile)", secondary_unit: "Einheit Zusatzsensor", note: "Zusatztext (fest)",
    tap_action: "Aktion beim Antippen", hold_action: "Aktion beim Halten", double_tap_action: "Aktion beim Doppeltippen",
  },
  helpers: {
    title: "Liegt über der Grafik und verschiebt sie nicht.",
    center_background: "Füllt den Kreis vollständig, dann entfällt der Rahmen.",
    center_image: "Bild nach /config/www legen und /local/dateiname.svg eintragen.",
    ring_radius: "Knoten- und Ringgröße wirken direkt. Nur wenn sich Knoten sonst berühren würden, wird die Grafik insgesamt etwas kleiner.",
    tail_segments: "0 schaltet den Schweif ab.",
    min_expected_power: "Unterhalb läuft die Animation am langsamsten, oberhalb der oberen Grenze am schnellsten.",
    display_zero_tolerance: "Unterhalb dieses Werts gilt ein Knoten als aus.",
    bg_opacity: "0 % = durchsichtig, 100 % = deckend.",
    blur: "Der Hintergrund hinter der Karte wird unscharf durchscheinend – wie Milchglas.",
    text_color_mode: "„Automatisch“ wählt auf kräftigen eigenen Hintergründen eine gut lesbare Farbe.",
    font_scale: "Skaliert Werte, Einheiten und Namen an den Knoten.",
    border_mode: "„Dezent (Theme)“ entspricht dem normalen Rahmen deines Themes.",
    entity_a: "Alternativ zum kombinierten Sensor: zwei getrennte Sensoren.",
    max_power: "Leer = Ring immer voll. Sonst zeigt der Ring den Anteil an dieser Leistung.",
    charging_state: "Mehrere Zustände mit Komma trennen. Automatisch erkannt: on, charging, lädt, Zahlen > 0 …",
    subtract_from_home: "Verhindert, dass die Leistung doppelt im Haus mitgezählt wird.",
    subtract_individual: "Hauptschalter für alle Verbraucher.",
    note: "Erscheint als feste Zeile unter dem Wert.",
  },
  node_helpers: {
    home: { entity: "Leer = Hausverbrauch wird als Bilanz aus PV, Netz und Speicher berechnet." },
    default: { entity: "Ohne Sensor zeigt der Knoten 0 W." },
  },
  opt: {
    title_weight: { 300: "Leicht", 400: "Normal", 500: "Mittel", 600: "Halbfett", 700: "Fett", 800: "Sehr fett" },
    title_align: { left: "Links", center: "Mittig", right: "Rechts" },
    center_image_fit: { contain: "Mit Rand einpassen", cover: "Füllt den Kreis" },
    display_zero_mode: { show: "Unverändert", grey: "Ausgrauen", transparency: "Transparent", hide: "Ausblenden" },
    ring_source: { soc: "Ladestand", power: "Leistung" },
    soc_display: { battery: "Batteriesymbol mit Prozent", ring: "Innerer Ring (voll = 100 %)", none: "Nicht anzeigen" },
    bg_mode: { theme: "Karten-Hintergrund (Theme)", custom: "Eigene Farbe", none: "Transparent (kein Hintergrund)" },
    text_color_mode: { auto: "Automatisch (guter Kontrast)", theme: "Theme-Textfarbe", custom: "Eigene Farbe" },
    border_mode: { none: "Kein Rahmen", accent: "Akzentfarbe (Theme)", theme: "Dezent (Theme)", custom: "Eigene Farbe" },
    shadow: { theme: "Wie Theme", none: "Kein Schatten", soft: "Weich", strong: "Kräftig" },
  },
  node_types: { solar: "PV", grid: "Netz", battery: "Speicher", home: "Haus", individual: "Verbraucher" },
  sections: { sources: "Quellen & Haus", consumers: "Verbraucher" },
  preview: "Vorschau · aktueller Wert", back: "Zurück", edit: "Bearbeiten", delete: "Entfernen",
  move_up: "Nach vorn", move_down: "Nach hinten", add_consumer: "Verbraucher hinzufügen",
  edit_node: "bearbeiten", not_set: "Nicht eingerichtet – antippen zum Einrichten",
  no_entity: "Kein Sensor gewählt", balance: "Kein Sensor – Bilanz aus PV, Netz und Speicher",
  tag_soc: "Ladestand", tag_off: "aus", no_consumers: "Noch keine Verbraucher angelegt.",
};

const NODE_LABEL_OVERRIDES = {
  grid: {
    entity: "Sensor kombiniert (+ = Bezug)",
    entity_a: "Sensor Bezug",
    entity_b: "Sensor Einspeisung",
  },
  battery: {
    entity: "Sensor kombiniert (+ = Entladen)",
    entity_a: "Sensor Entladeleistung",
    entity_b: "Sensor Ladeleistung",
  },
};

const POWER_ENTITY = {
  entity: { filter: [{ domain: ["sensor", "input_number", "counter", "number"] }] },
};

const EDITOR_TABS = [
  { id: "nodes", icon: "mdi:hub-outline" },
  { id: "display", icon: "mdi:view-dashboard-outline" },
  { id: "motion", icon: "mdi:motion-play-outline" },
  { id: "values", icon: "mdi:numeric" },
  { id: "design", icon: "mdi:palette-outline" },
];

// Merkt sich den offenen Tab, auch wenn HA den Editor neu erzeugt
const EDITOR_STATE = { tab: "nodes" };

// Anzeigewert im Formular, solange nichts eingestellt ist (Karte folgt dann dem Theme)
const UI_FALLBACK = { radius: 12 };
const COLOR_KEYS = ["title_color", "center_background", "bg_color", "text_color", "border_color"];
const FIXED_NODES = ["solar", "home", "battery", "grid"];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const deepGet = (obj, path) => path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

const EDITOR_CSS = `
  :host { display:block; }
  .tabs { display:flex; gap:4px; padding:4px; margin-bottom:16px; border-radius:14px;
    background: var(--secondary-background-color, rgba(127,127,127,.12)); overflow-x:auto; }
  .tab { flex:1 1 0; min-width:62px; display:flex; flex-direction:column; align-items:center; gap:3px;
    padding:8px 4px; border:none; border-radius:10px; background:transparent; cursor:pointer;
    color: var(--secondary-text-color); font: inherit; font-size:12px; font-weight:500; transition: background .15s, color .15s; }
  .tab ha-icon { --mdc-icon-size:20px; }
  .tab:hover { color: var(--primary-text-color); }
  .tab.active { background: var(--card-background-color, #fff); color: var(--primary-color); font-weight:600; box-shadow: 0 1px 4px rgba(0,0,0,.15); }
  .intro { font-size:13px; color: var(--secondary-text-color); margin: 0 2px 14px; line-height:1.45; }
  .section-title { font-size:14px; font-weight:600; margin: 18px 2px 8px; color: var(--primary-text-color); }
  .section-title:first-child { margin-top: 0; }
  ha-form { display:block; }

  .it-row { display:flex; align-items:center; gap:10px; padding:8px 8px 8px 10px; margin-bottom:8px; border-radius:14px;
    border:1px solid var(--divider-color, rgba(127,127,127,.25)); background: var(--card-background-color, #fff); cursor:pointer; }
  .it-row:hover { border-color: var(--primary-color); }
  .it-row.hidden { opacity:.55; }
  .it-ico { flex:0 0 auto; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; --mdc-icon-size:22px; }
  .it-ico .rf-icon { width:22px; height:22px; }
  .it-txt { flex:1; min-width:0; }
  .it-name { font-weight:600; font-size:14px; color: var(--primary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .it-sub { font-size:12px; color: var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .it-tag { font-size:10px; font-weight:600; padding:1px 6px; border-radius:6px; margin-left:6px; background: var(--secondary-background-color); color: var(--secondary-text-color); }
  .ibtn { flex:0 0 auto; width:34px; height:34px; display:flex; align-items:center; justify-content:center; border:none; border-radius:50%;
    background:transparent; color: var(--secondary-text-color); cursor:pointer; --mdc-icon-size:20px; padding:0; }
  .ibtn:hover { background: var(--secondary-background-color, rgba(127,127,127,.15)); color: var(--primary-text-color); }
  .ibtn[disabled] { opacity:.3; pointer-events:none; }
  .ibtn.del:hover { color: var(--error-color, #db4437); }
  .add { width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:11px; margin-top:4px; border-radius:14px;
    border:1.5px dashed var(--primary-color); background:transparent; color: var(--primary-color); font: inherit; font-weight:600; font-size:14px; cursor:pointer; }
  .add:hover { background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
  .muted { font-size:12px; color: var(--secondary-text-color); padding: 4px 2px 10px; }

  .ed-head { display:flex; align-items:center; gap:6px; margin-bottom:12px; }
  .ed-head .t { font-size:16px; font-weight:600; color: var(--primary-text-color); }
  .pv { padding:14px; margin-bottom:16px; border-radius:14px;
    background: repeating-conic-gradient(rgba(127,127,127,.08) 0% 25%, transparent 0% 50%) 0 0 / 16px 16px, var(--primary-background-color, #f5f5f5); }
  .pv-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color: var(--secondary-text-color); margin-bottom:10px; }
  .nd { display:flex; align-items:center; gap:16px; }
  .nd-node { position:relative; flex:0 0 auto; width:72px; height:72px; color: var(--c); }
  .nd-node svg.ring { position:absolute; inset:0; width:100%; height:100%; transform: rotate(-90deg); }
  .nd-ico { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; --mdc-icon-size:30px; }
  .nd-ico .rf-icon { width:32px; height:32px; }
  .nd-txt { min-width:0; }
  .nd-val { font-size:22px; font-weight:600; color: var(--primary-text-color); letter-spacing:-.01em; }
  .nd-val span { font-size:14px; font-weight:400; color: var(--secondary-text-color); margin-left:3px; }
  .nd-name, .nd-sub { font-size:13px; color: var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
`;

class RadialFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = EDITOR_STATE.tab;
    this._edit = null;       // { type, index } der gerade bearbeitete Knoten
    this._paneKey = null;
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    if (!Array.isArray(this._config.individual)) this._config.individual = [];
    if (this._edit && this._edit.type === "individual" && !this._config.individual[this._edit.index]) this._edit = null;
    this._refresh();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._refresh();
    else this._pushHass();
  }

  get hass() { return this._hass; }

  connectedCallback() { this._refresh(); }

  /* ---------- Hilfen ---------- */

  _t(path) {
    const v = deepGet(T, path);
    return v === undefined ? path.split(".").pop() : v;
  }

  _opts(key, values) {
    return { select: { mode: "dropdown", options: values.map((v) => ({ value: String(v), label: this._t(`opt.${key}.${v}`) })) } };
  }

  _num(min, max, step = 1, unit = "", mode = "slider") {
    return { number: { min, max, step, mode, ...(unit ? { unit_of_measurement: unit } : {}) } };
  }

  _group(key, icon, schema, expanded = false) {
    return { type: "expandable", name: "", flatten: true, title: this._t(`groups.${key}`), icon, expanded, schema };
  }

  _grid(...schema) {
    return { type: "grid", name: "", schema };
  }

  _val(key) {
    const v = this._config?.[key];
    if (v === undefined || v === null || v === "") return UI_FALLBACK[key] ?? DEFAULTS[key];
    return v;
  }

  _pushHass() {
    this.shadowRoot.querySelectorAll("ha-form").forEach((f) => { f.hass = this._hass; });
    if (this._pv) this._renderNodePreview();
  }

  /* ---------- Schemas ---------- */

  _schemaDisplay() {
    return [
      this._group("title", "mdi:format-title", [
        { name: "title", selector: { text: {} } },
        this._grid(
          { name: "title_size", selector: this._num(8, 48, 1, "px", "box") },
          { name: "title_weight", selector: this._opts("title_weight", [300, 400, 500, 600, 700, 800]) },
        ),
        this._grid(
          { name: "title_align", selector: this._opts("title_align", ["left", "center", "right"]) },
          { name: "title_color", selector: { color_rgb: {} } },
        ),
      ], true),
      this._group("center", "mdi:circle-double", [
        this._grid(
          { name: "center_icon", selector: { icon: {} } },
          { name: "center_size", selector: this._num(0.6, 1.8, 0.05, "", "box") },
        ),
        { name: "center_image", selector: { text: {} } },
        ...(this._config.center_image ? [{ name: "center_image_fit", selector: this._opts("center_image_fit", ["contain", "cover"]) }] : []),
        { name: "center_background", selector: { color_rgb: {} } },
        { name: "center_tap_action", selector: { ui_action: {} } },
        { name: "center_hold_action", selector: { ui_action: {} } },
      ]),
      this._group("ring", "mdi:vector-circle", [
        { name: "card_width", selector: this._num(40, 100, 1, "%") },
        { name: "node_size", selector: this._num(0.5, 1.8, 0.05) },
        { name: "ring_radius", selector: this._num(140, 400, 5) },
        this._grid(
          { name: "track_opacity", selector: this._num(0, 1, 0.02, "", "box") },
          { name: "ring_transition", selector: this._num(0, 2000, 50, "ms", "box") },
        ),
        { name: "show_names", selector: { boolean: {} } },
      ], true),
    ];
  }

  _schemaMotion() {
    return [
      this._group("dots", "mdi:dots-horizontal", [
        { name: "speed", selector: this._num(0.25, 4, 0.05, "×") },
        this._grid(
          { name: "dot_size", selector: this._num(0.4, 2.5, 0.1, "", "box") },
          { name: "cycle_gap", selector: this._num(0, 3, 0.05, "s", "box") },
        ),
        { name: "tail_length", selector: this._num(0, 0.3, 0.01) },
        { name: "tail_segments", selector: this._num(0, 16, 1, "", "box") },
      ], true),
      this._group("timing", "mdi:speedometer", [
        this._grid(
          { name: "min_flow_rate", selector: this._num(0.1, 5, 0.05, "s", "box") },
          { name: "max_flow_rate", selector: this._num(0.5, 20, 0.25, "s", "box") },
        ),
        this._grid(
          { name: "min_expected_power", selector: this._num(0, 5000, 10, "W", "box") },
          { name: "max_expected_power", selector: this._num(500, 60000, 100, "W", "box") },
        ),
      ], true),
    ];
  }

  _schemaValues() {
    const mode = this._formData().display_zero_mode;
    return [
      this._group("number", "mdi:numeric", [
        { name: "kilo_threshold", selector: this._num(0, 100000, 100, "W", "box") },
        this._grid(
          { name: "base_decimals", selector: this._num(0, 3, 1, "", "box") },
          { name: "kilo_decimals", selector: this._num(0, 3, 1, "", "box") },
        ),
      ], true),
      this._group("zero", "mdi:power-plug-off-outline", [
        { name: "display_zero_tolerance", selector: this._num(0, 500, 1, "W", "box") },
        { name: "display_zero_mode", selector: this._opts("display_zero_mode", ["show", "grey", "transparency", "hide"]) },
        ...(mode === "grey" ? [{ name: "grey_color", selector: { color_rgb: {} } }] : []),
        ...(mode === "transparency" ? [{ name: "transparency", selector: this._num(0, 100, 5, "%") }] : []),
      ], true),
    ];
  }

  _schemaDesign() {
    const v = (k) => this._val(k);
    return [
      this._group("bg", "mdi:format-color-fill", [
        { name: "bg_mode", selector: this._opts("bg_mode", ["theme", "custom", "none"]) },
        ...(v("bg_mode") === "custom" ? [{ name: "bg_color", selector: { color_rgb: {} } }] : []),
        ...(v("bg_mode") !== "none" ? [{ name: "bg_opacity", selector: this._num(0, 100, 1, "%") }] : []),
        ...(v("bg_mode") === "custom" ? [{ name: "bg_gradient", selector: { boolean: {} } }] : []),
        { name: "blur", selector: this._num(0, 30, 1, "px") },
      ], true),
      this._group("text", "mdi:format-text", [
        { name: "text_color_mode", selector: this._opts("text_color_mode", ["auto", "theme", "custom"]) },
        ...(v("text_color_mode") === "custom" ? [{ name: "text_color", selector: { color_rgb: {} } }] : []),
        { name: "font_scale", selector: this._num(60, 160, 5, "%") },
      ]),
      this._group("frame", "mdi:rounded-corner", [
        { name: "border_mode", selector: this._opts("border_mode", ["none", "accent", "theme", "custom"]) },
        ...(v("border_mode") === "custom" ? [{ name: "border_color", selector: { color_rgb: {} } }] : []),
        ...(["accent", "custom"].includes(v("border_mode")) ? [{ name: "border_width", selector: this._num(1, 6, 1, "px") }] : []),
        { name: "shadow", selector: this._opts("shadow", ["theme", "none", "soft", "strong"]) },
        { name: "radius", selector: this._num(0, 40, 1, "px") },
        { name: "padding", selector: this._num(0, 32, 1, "px") },
      ]),
    ];
  }

  _schemaNode(type, data) {
    const sensor = [{ name: "entity", selector: POWER_ENTITY }];
    if (type === "grid" || type === "battery") {
      sensor.push(this._grid({ name: "entity_a", selector: POWER_ENTITY }, { name: "entity_b", selector: POWER_ENTITY }));
    }
    sensor.push({ name: "invert", selector: { boolean: {} } });

    const values = [
      this._grid(
        { name: "unit", selector: { text: {} } },
        { name: "decimals", selector: this._num(0, 4, 1, "", "box") },
      ),
    ];
    if (type !== "home") values.push({ name: "max_power", selector: this._num(0, 60000, 100, "W", "box") });

    const s = [
      this._group("sensor", "mdi:flash-outline", sensor, true),
      this._group("look", "mdi:palette-swatch-outline", [
        this._grid({ name: "name", selector: { text: {} } }, { name: "icon", selector: { icon: {} } }),
        { name: "color", selector: { color_rgb: {} } },
      ], true),
      this._group("node_values", "mdi:numeric", values),
    ];

    if (type === "battery") {
      s.push(this._group("soc", "mdi:battery-charging-outline", [
        { name: "state_of_charge", selector: { entity: {} } },
        ...(data.state_of_charge ? [{ name: "ring_source", selector: this._opts("ring_source", ["soc", "power"]) }] : []),
      ]));
    }
    if (type === "individual") {
      s.push(this._group("soc", "mdi:battery-charging-outline", [
        { name: "state_of_charge", selector: { entity: {} } },
        ...(data.state_of_charge ? [
          this._grid(
            { name: "soc_display", selector: this._opts("soc_display", ["battery", "ring", "none"]) },
            { name: "soc_color", selector: { color_rgb: {} } },
          ),
          { name: "charging_entity", selector: { entity: {} } },
          { name: "charging_state", selector: { text: {} } },
        ] : []),
      ]));
      s.push(this._group("behaviour", "mdi:cog-outline", [{ name: "subtract_from_home", selector: { boolean: {} } }]));
    }
    if (type === "home") {
      s.push(this._group("behaviour", "mdi:cog-outline", [{ name: "subtract_individual", selector: { boolean: {} } }]));
    }

    s.push(this._group("extra", "mdi:information-outline", [
      { name: "secondary_entity", selector: { entity: {} } },
      ...(data.secondary_entity ? [{ name: "secondary_unit", selector: { text: {} } }] : []),
      { name: "note", selector: { text: {} } },
    ]));
    s.push(this._group("actions", "mdi:gesture-tap", [
      { name: "tap_action", selector: { ui_action: {} } },
      { name: "hold_action", selector: { ui_action: {} } },
      { name: "double_tap_action", selector: { ui_action: {} } },
    ]));
    return s;
  }

  /* ---------- Formulardaten ---------- */

  // Alle globalen Werte inkl. Standard, damit Regler/Auswahl den echten Wert zeigen
  _formData() {
    const d = {};
    Object.keys(DEFAULTS).forEach((k) => {
      if (k === "display_zero_lines") return;
      const v = this._val(k);
      if (v === null || v === undefined) return;
      d[k] = COLOR_KEYS.includes(k) ? (rgbOf(v) || v) : v;
    });
    d.title_weight = String(d.title_weight);
    const dz = { ...DEFAULTS.display_zero_lines, ...(this._config.display_zero_lines || {}) };
    d.display_zero_mode = dz.mode;
    d.grey_color = rgbOf(dz.grey_color) || dz.grey_color;
    d.transparency = dz.transparency;
    return d;
  }

  _nodeCfg(type, index) {
    return type === "individual" ? (this._config.individual || [])[index] : this._config[type];
  }

  _nodeObj(type, index) {
    const node = this._nodeCfg(type, index);
    return typeof node === "string" ? { entity: node } : { ...(node || {}) };
  }

  _nodeData(type, n) {
    const data = { ...n };
    if (n.entity && typeof n.entity === "object") {
      data.entity = "";
      data.entity_a = n.entity.consumption || n.entity.discharge || "";
      data.entity_b = n.entity.production || n.entity.charge || "";
    }
    ["color", "soc_color"].forEach((k) => { if (data[k] !== undefined) data[k] = rgbOf(data[k]) || data[k]; });
    if (type === "individual") {
      if (data.soc_display === undefined) data.soc_display = "battery";
      data.subtract_from_home = n.subtract_from_home !== false;
    }
    if (type === "home") data.subtract_individual = n.subtract_individual !== false;
    if (type === "battery" && data.ring_source === undefined) data.ring_source = "soc";
    // Liste aus YAML im Textfeld als kommagetrennte Angabe zeigen
    if (Array.isArray(data.charging_state)) data.charging_state = data.charging_state.join(", ");
    return data;
  }

  _nodeConfig(data, type, orig) {
    const out = {};
    const put = (k, v) => {
      if (v === undefined || v === null || v === "") return;
      out[k] = v;
    };
    if ((type === "grid" || type === "battery") && (data.entity_a || data.entity_b)) {
      const pair = {};
      if (data.entity_a) pair.consumption = data.entity_a;
      if (data.entity_b) pair.production = data.entity_b;
      out.entity = pair;
    } else {
      put("entity", data.entity);
    }
    ["name", "icon", "unit", "note", "secondary_entity", "secondary_unit",
     "state_of_charge"].forEach((k) => put(k, data[k]));
    // Unveränderte Farben im ursprünglichen Format (z. B. Hex) belassen
    ["color", "soc_color"].forEach((k) => {
      if (Array.isArray(data[k]) && orig[k] !== undefined && sameRgb(orig[k], data[k])) data[k] = orig[k];
    });
    put("color", data.color);
    if (type === "battery" && data.ring_source === "power") out.ring_source = "power";
    if (type === "individual") {
      // Anzeige nur speichern, wenn sie vom Standard (Batteriesymbol) abweicht
      if (data.soc_display && data.soc_display !== "battery") out.soc_display = data.soc_display;
      put("soc_color", data.soc_color);
      put("charging_entity", data.charging_entity);
      put("charging_state", data.charging_state);
      if (data.subtract_from_home === false) out.subtract_from_home = false;
    }
    if (data.max_power) out.max_power = data.max_power;
    if (data.decimals !== undefined && data.decimals !== null && data.decimals !== "") out.decimals = data.decimals;
    if (data.invert) out.invert = true;
    if (type === "home" && data.subtract_individual === false) out.subtract_individual = false;
    ["tap_action", "hold_action", "double_tap_action"].forEach((k) => {
      if (data[k] && data[k].action && data[k].action !== "none") out[k] = data[k];
    });
    if (!out.secondary_entity) delete out.secondary_unit;
    return out;
  }

  _nodeColor(type, index, n) {
    const fallback = type === "individual" ? INDIVIDUAL_PALETTE[index % INDIVIDUAL_PALETTE.length] : PALETTE[type];
    return toColor(n.color, fallback);
  }

  _nodeName(type, index, n) {
    if (n.name) return n.name;
    if (type !== "individual") return this._t(`node_types.${type}`);
    const id = firstEntityId(n.entity);
    return (id && this._hass?.states[id]?.attributes.friendly_name) || `${this._t("node_types.individual")} ${index + 1}`;
  }

  _iconHtml(icon, fallback) {
    const ic = icon || fallback;
    return typeof ic === "string" && ic.startsWith("rf:") ? iconMarkup(ic) : `<ha-icon icon="${esc(ic)}"></ha-icon>`;
  }

  /* ---------- Rendering ---------- */

  async _refresh() {
    if (!this._config || !this._hass) return;
    if (!this._built) {
      if (!customElements.get("ha-form")) {
        if (this._loading) return;
        this._loading = true;
        await loadHaComponents();
        this._loading = false;
        if (!customElements.get("ha-form")) {
          this.shadowRoot.innerHTML =
            '<p style="padding:16px">Die Formularkomponenten von Home Assistant konnten nicht geladen werden. Bitte in YAML konfigurieren.</p>';
          return;
        }
      }
      this._build();
    }
    this._tabsEl.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === this._tab));
    const key = `${this._tab}:${this._edit ? `${this._edit.type}${this._edit.index}` : ""}`;
    if (key !== this._paneKey) { this._paneKey = key; this._renderPane(); }
    this._updatePane();
  }

  _build() {
    this._built = true;
    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style><div class="tabs"></div><div class="pane"></div>`;
    this._tabsEl = this.shadowRoot.querySelector(".tabs");
    this._paneEl = this.shadowRoot.querySelector(".pane");
    EDITOR_TABS.forEach((tab) => {
      const b = document.createElement("button");
      b.className = "tab";
      b.type = "button";
      b.dataset.tab = tab.id;
      b.innerHTML = `<ha-icon icon="${tab.icon}"></ha-icon><span>${esc(this._t(`tabs.${tab.id}`))}</span>`;
      b.addEventListener("click", () => {
        this._tab = tab.id;
        EDITOR_STATE.tab = tab.id;
        this._edit = null;
        this._refresh();
      });
      this._tabsEl.appendChild(b);
    });
  }

  _makeForm(onChange, labels, helpers) {
    const f = document.createElement("ha-form");
    f.hass = this._hass;
    f.computeLabel = (s) => (s.name ? ((labels && labels[s.name]) || this._t(`fields.${s.name}`)) : "");
    f.computeHelper = (s) => (s.name && ((helpers && helpers[s.name]) || deepGet(T, `helpers.${s.name}`))) || "";
    f.addEventListener("value-changed", (ev) => { ev.stopPropagation(); onChange(ev.detail.value); });
    return f;
  }

  _renderPane() {
    const pane = this._paneEl;
    pane.innerHTML = "";
    this._form = null; this._nodeForm = null; this._list = null; this._pv = null; this._edTitle = null;

    if (this._tab === "nodes" && this._edit) { this._renderNodeEditor(pane); return; }

    const intro = document.createElement("div");
    intro.className = "intro";
    intro.textContent = this._t(`intro.${this._tab}`);
    pane.appendChild(intro);

    if (this._tab === "nodes") {
      this._list = document.createElement("div");
      pane.appendChild(this._list);
      return;
    }
    this._form = this._makeForm((value) => this._emitGlobal(value));
    pane.appendChild(this._form);
  }

  _renderNodeEditor(pane) {
    const { type } = this._edit;
    const head = document.createElement("div");
    head.className = "ed-head";
    head.innerHTML = `<button class="ibtn back" type="button" title="${esc(this._t("back"))}"><ha-icon icon="mdi:arrow-left"></ha-icon></button><span class="t"></span>`;
    head.querySelector(".back").addEventListener("click", () => { this._edit = null; this._refresh(); });
    this._edTitle = head.querySelector(".t");
    pane.appendChild(head);

    this._pv = document.createElement("div");
    this._pv.className = "pv";
    pane.appendChild(this._pv);

    const helpers = T.node_helpers[type] || T.node_helpers.default;
    this._nodeForm = this._makeForm((value) => this._nodeChanged(value), NODE_LABEL_OVERRIDES[type], helpers);
    pane.appendChild(this._nodeForm);
  }

  _updatePane() {
    if (this._form) {
      const schemas = {
        display: () => this._schemaDisplay(),
        motion: () => this._schemaMotion(),
        values: () => this._schemaValues(),
        design: () => this._schemaDesign(),
      };
      this._form.hass = this._hass;
      this._form.schema = schemas[this._tab]();
      this._form.data = this._formData();
    }
    if (this._list) this._renderNodeList();
    if (this._nodeForm) {
      const { type, index } = this._edit;
      const n = this._nodeObj(type, index);
      const data = this._nodeData(type, n);
      this._nodeForm.hass = this._hass;
      this._nodeForm.schema = this._schemaNode(type, data);
      this._nodeForm.data = data;
      this._edTitle.textContent = `${this._nodeName(type, index, n)} ${this._t("edit_node")}`;
      this._renderNodePreview();
    }
  }

  _nodeRow(type, index) {
    const raw = this._nodeCfg(type, index);
    const n = this._nodeObj(type, index);
    const configured = type === "individual" || type === "home" || !!raw;
    const color = this._nodeColor(type, index, n);

    let sub;
    if (!configured) sub = this._t("not_set");
    else if (n.entity && typeof n.entity === "object") {
      sub = [n.entity.consumption || n.entity.discharge, n.entity.production || n.entity.charge].filter(Boolean).join(" / ");
    } else if (n.entity) sub = n.entity;
    else sub = type === "home" ? this._t("balance") : this._t("no_entity");

    const tags = [];
    if (type !== "individual" && n.name) tags.push(this._t(`node_types.${type}`));
    if (n.state_of_charge && n.soc_display !== "none") tags.push(this._t("tag_soc"));
    if (!configured) tags.push(this._t("tag_off"));

    const count = (this._config.individual || []).length;
    const btn = (a, icon, title, disabled, cls = "") =>
      `<button class="ibtn ${cls}" type="button" data-a="${a}" title="${esc(title)}" ${disabled ? "disabled" : ""}><ha-icon icon="${icon}"></ha-icon></button>`;
    let buttons = "";
    if (type === "individual") {
      buttons += btn("up", "mdi:chevron-up", this._t("move_up"), index === 0);
      buttons += btn("down", "mdi:chevron-down", this._t("move_down"), index === count - 1);
    }
    buttons += btn("edit", "mdi:pencil-outline", this._t("edit"), false);
    if (type === "individual" || (type !== "home" && configured)) {
      buttons += btn("del", "mdi:delete-outline", this._t("delete"), false, "del");
    }

    const row = document.createElement("div");
    row.className = `it-row${configured ? "" : " hidden"}`;
    row.innerHTML = `
      <div class="it-ico" style="background:${withAlpha(color, 20)};color:${color}">${this._iconHtml(n.icon, DEFAULT_ICONS[type])}</div>
      <div class="it-txt">
        <div class="it-name">${esc(this._nodeName(type, index, n))}${tags.map((t) => `<span class="it-tag">${esc(t)}</span>`).join("")}</div>
        <div class="it-sub">${esc(sub)}</div>
      </div>
      ${buttons}`;
    row.addEventListener("click", (ev) => {
      const b = ev.composedPath().find((el) => el.dataset && el.dataset.a);
      ev.stopPropagation();
      this._nodeAction(b ? b.dataset.a : "edit", type, index);
    });
    return row;
  }

  _renderNodeList() {
    const list = this._list;
    list.innerHTML = "";
    const title = (txt) => {
      const d = document.createElement("div");
      d.className = "section-title";
      d.textContent = txt;
      list.appendChild(d);
    };

    title(this._t("sections.sources"));
    FIXED_NODES.forEach((type) => list.appendChild(this._nodeRow(type, 0)));

    title(this._t("sections.consumers"));
    const inds = this._config.individual || [];
    if (!inds.length) {
      const m = document.createElement("div");
      m.className = "muted";
      m.textContent = this._t("no_consumers");
      list.appendChild(m);
    }
    inds.forEach((_, i) => list.appendChild(this._nodeRow("individual", i)));

    const add = document.createElement("button");
    add.className = "add";
    add.type = "button";
    add.innerHTML = `<ha-icon icon="mdi:plus"></ha-icon>${esc(this._t("add_consumer"))}`;
    add.addEventListener("click", () => {
      const listCfg = [...inds, {}];
      this._edit = { type: "individual", index: listCfg.length - 1 };
      this._commit({ ...this._config, individual: listCfg });
    });
    list.appendChild(add);
  }

  _renderNodePreview() {
    if (!this._pv || !this._edit || !this._hass) return;
    const { type, index } = this._edit;
    const n = this._nodeObj(type, index);
    const c = { ...DEFAULTS, ...this._config };
    const color = this._nodeColor(type, index, n);

    let valTxt = "–";
    let unitTxt = "";
    let pct = 1;
    if (n.entity) {
      const w = Math.abs(readEntity(this._hass, n.entity, !!n.invert));
      const u = n.unit;
      const dec = n.decimals;
      if (u === "W") [valTxt, unitTxt] = [w.toFixed(dec ?? c.base_decimals), "W"];
      else if (u === "kW") [valTxt, unitTxt] = [(w / 1000).toFixed(dec ?? c.kilo_decimals), "kW"];
      else if (u) [valTxt, unitTxt] = [w.toFixed(dec ?? 1), u];
      else if (w >= c.kilo_threshold) [valTxt, unitTxt] = [(w / 1000).toFixed(dec ?? c.kilo_decimals), "kW"];
      else [valTxt, unitTxt] = [w.toFixed(dec ?? c.base_decimals), "W"];
      if (type === "battery" && n.ring_source !== "power" && n.state_of_charge && this._hass.states[n.state_of_charge]) {
        pct = clamp(num(this._hass.states[n.state_of_charge].state) / 100, 0, 1);
      } else if (n.max_power > 0) pct = clamp(w / n.max_power, 0, 1);
    }

    const r = 44;
    const circ = 2 * Math.PI * r;
    const sub = n.entity ? (typeof n.entity === "object" ? Object.values(n.entity).join(" / ") : n.entity)
      : (type === "home" ? this._t("balance") : this._t("no_entity"));
    this._pv.innerHTML = `
      <div class="pv-label">${esc(this._t("preview"))}</div>
      <div class="nd">
        <div class="nd-node" style="--c:${color}">
          <svg class="ring" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="${r}" stroke="${color}" stroke-opacity="${clamp(c.track_opacity, 0, 1)}" stroke-width="7"/>
            <circle cx="50" cy="50" r="${r}" stroke="${color}" stroke-width="7" stroke-linecap="round"
              stroke-dasharray="${circ.toFixed(1)} ${circ.toFixed(1)}" stroke-dashoffset="${((1 - pct) * circ).toFixed(1)}"
              stroke-opacity="${pct < 0.004 ? 0 : 1}"/>
          </svg>
          <div class="nd-ico">${this._iconHtml(n.icon, DEFAULT_ICONS[type])}</div>
        </div>
        <div class="nd-txt">
          <div class="nd-val">${esc(valTxt)}${unitTxt ? `<span>${esc(unitTxt)}</span>` : ""}</div>
          <div class="nd-name">${esc(this._nodeName(type, index, n))}</div>
          <div class="nd-sub">${esc(sub)}</div>
        </div>
      </div>`;
  }

  /* ---------- Aktionen ---------- */

  _nodeAction(action, type, index) {
    if (action === "edit") {
      this._edit = { type, index };
      this._refresh();
      return;
    }
    const cfg = { ...this._config };
    if (type === "individual") {
      const list = [...(cfg.individual || [])];
      if (action === "up" && index > 0) [list[index - 1], list[index]] = [list[index], list[index - 1]];
      else if (action === "down" && index < list.length - 1) [list[index + 1], list[index]] = [list[index], list[index + 1]];
      else if (action === "del") list.splice(index, 1);
      else return;
      cfg.individual = list;
    } else if (action === "del") {
      delete cfg[type];
    } else return;
    this._commit(cfg);
  }

  _nodeChanged(value) {
    const { type, index } = this._edit;
    const node = this._nodeConfig(value, type, this._nodeObj(type, index));
    const cfg = { ...this._config };
    if (type === "individual") {
      const list = [...(cfg.individual || [])];
      list[index] = node;
      cfg.individual = list;
    } else if (Object.keys(node).length) {
      cfg[type] = node;
    } else {
      delete cfg[type];
    }
    this._commit(cfg);
  }

  _emitGlobal(value) {
    const cfg = { ...this._config };
    Object.keys(DEFAULTS).forEach((k) => {
      if (k === "display_zero_lines") return;
      let v = value[k];
      if (v === undefined || v === null || v === "") { delete cfg[k]; return; }
      if (k === "title_weight") v = Number(v);
      const orig = this._config[k];
      // Unveränderte Farben im ursprünglichen Format (z. B. Hex) belassen
      if (COLOR_KEYS.includes(k) && Array.isArray(v) && orig !== undefined && sameRgb(orig, v)) v = orig;
      const def = UI_FALLBACK[k] ?? DEFAULTS[k];
      // Werte, die dem Standard entsprechen, nicht in die YAML schreiben
      if (orig === undefined && JSON.stringify(v) === JSON.stringify(def)) { delete cfg[k]; return; }
      cfg[k] = v;
    });

    const dzDef = DEFAULTS.display_zero_lines;
    const dzOrig = this._config.display_zero_lines || {};
    const dz = {};
    [["mode", "display_zero_mode"], ["grey_color", "grey_color"], ["transparency", "transparency"]].forEach(([key, field]) => {
      let v = value[field];
      if (v === undefined || v === null || v === "") return;
      const base = dzOrig[key] ?? dzDef[key];
      if (key === "grey_color" && Array.isArray(v) && sameRgb(base, v)) v = base;
      if (dzOrig[key] === undefined && JSON.stringify(v) === JSON.stringify(dzDef[key])) return;
      dz[key] = v;
    });
    if (Object.keys(dz).length) cfg.display_zero_lines = dz;
    else delete cfg.display_zero_lines;

    // Abhängige Werte entfernen, wenn der zugehörige Modus sie nicht nutzt
    if (cfg.bg_mode !== "custom") { delete cfg.bg_color; delete cfg.bg_gradient; }
    if (cfg.bg_mode === "none") delete cfg.bg_opacity;
    if (cfg.text_color_mode !== "custom") delete cfg.text_color;
    if (cfg.border_mode !== "custom") delete cfg.border_color;
    if (!["accent", "custom"].includes(cfg.border_mode)) delete cfg.border_width;
    if (!cfg.center_image) delete cfg.center_image_fit;
    this._commit(cfg);
  }

  _commit(config) {
    const clean = { ...config };
    Object.keys(clean).forEach((k) => { if (clean[k] === undefined) delete clean[k]; });
    this._config = clean;
    fire(this, "config-changed", { config: clean });
    this._refresh();
  }
}

customElements.define("radial-flow-card-editor", RadialFlowCardEditor);

customElements.define("radial-flow-card", RadialFlowCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "radial-flow-card",
  name: "Radial Flow Card",
  description: "Radiale Energieflusskarte mit Nabe, animierten Flüssen und Editor",
  preview: false,
});

console.info(
  `%c RADIAL-FLOW-CARD %c ${VERSION} `,
  "color:#1b2029;background:#f0b429;font-weight:700;",
  "color:#f0b429;background:#1b2029;"
);

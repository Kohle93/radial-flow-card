/**
 * Radial Flow Card
 * Eigenständige Lovelace-Karte: radiale Energieflussdarstellung mit Nabe,
 * animierten Punkten, display_zero-Ausgrauen und Actions pro Knoten.
 *
 * Kein Build-Schritt nötig — Datei als Modul-Ressource einbinden.
 */

const VERSION = "4.6.1";

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
    return `
      :host { display: block; }
      ha-card { overflow: hidden; padding: 0 8px 12px; position: relative; }
      .title {
        position: absolute;
        top: 12px;
        ${c.title_align === "right" ? "right: 18px;" : c.title_align === "center" ? "left: 0; right: 0; text-align: center;" : "left: 18px;"}
        z-index: 2;
        pointer-events: none;
        font-size: ${clamp(c.title_size ?? 16, 8, 48)}px;
        font-weight: ${clamp(Math.round((c.title_weight ?? 500) / 100) * 100, 100, 900)};
        line-height: 1.2;
        color: ${toColor(c.title_color, "var(--primary-text-color)")};
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
        background: ${filled ? c.center_background : "var(--ha-card-background, var(--card-background-color, #1b2029))"};
        border: ${filled ? "none" : "1.5px solid var(--divider-color, rgba(127,140,158,.4))"};
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; overflow: hidden;
      }
      .hub-img {
        width: 100%; height: 100%;
        object-fit: ${c.center_image_fit === "cover" ? "cover" : "contain"};
        ${c.center_image_fit === "cover" ? "" : "padding: 14%; box-sizing: border-box;"}
      }
      .hub-icon { --mdc-icon-size: 6cqw; color: var(--secondary-text-color); }

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

      .line1 { font-size: 4.4cqw; font-weight: 600; color: var(--primary-text-color); letter-spacing: -.01em; }
      .unit { font-size: 2.9cqw; font-weight: 400; color: var(--secondary-text-color); margin-left: 3px; }
      .name, .extra { font-size: 2.6cqw; color: var(--secondary-text-color); }
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
const LABELS = {
  title: "Titel",
  title_color: "Titelfarbe",
  title_size: "Titelgroesse (px)",
  title_weight: "Schriftstaerke des Titels",
  title_align: "Titelausrichtung",
  center_image: "Bild in der Mitte (z. B. /local/logo.svg)",
  center_icon: "Icon in der Mitte",
  center_background: "Farbe der Mitte (fuellt den Kreis)",
  center_size: "Groesse der Mitte",
  center_image_fit: "Bild einpassen",
  track_opacity: "Deckkraft des Ringhintergrunds",
  ring_transition: "Uebergang des Rings (ms)",
  entity_a: "Sensor A",
  entity_b: "Sensor B",
  center_tap_action: "Tippen auf die Mitte",
  center_hold_action: "Halten auf die Mitte",
  node_size: "Knotengroesse",
  card_width: "Breite der Grafik (% der Karte)",
  ring_radius: "Ringgroesse",
  dot_size: "Punktgroesse",
  show_names: "Namen anzeigen",
  tail_length: "Schweiflaenge",
  tail_segments: "Schweifaufloesung",

  kilo_threshold: "Umschaltschwelle auf kW",
  base_decimals: "Nachkommastellen W",
  kilo_decimals: "Nachkommastellen kW",
  speed: "Tempo insgesamt",
  cycle_gap: "Pause zwischen zwei Durchlaeufen (s)",
  min_flow_rate: "Schnellste Animation (s)",
  max_flow_rate: "Langsamste Animation (s)",
  min_expected_power: "Untere Leistungsgrenze (W)",
  max_expected_power: "Obere Leistungsgrenze (W)",
  display_zero_tolerance: "Toleranz fuer aus (W)",
  display_zero_mode: "Darstellung bei 0 W",
  grey_color: "Graufarbe",
  transparency: "Transparenz (%)",

  entity: "Sensor",
  invert: "Vorzeichen umkehren",
  name: "Name",
  icon: "Icon",
  color: "Farbe",
  unit: "Einheit (leer = automatisch)",
  decimals: "Nachkommastellen",
  note: "Zusatzhinweis (fester Text)",
  secondary_entity: "Zusatzsensor",
  secondary_unit: "Einheit Zusatzsensor",
  state_of_charge: "Ladestandssensor",
  soc_display: "Anzeige des Ladestands",
  soc_color: "Farbe des Ladestands",
  charging_entity: "Sensor \"lädt gerade\" (leer = Ladestand immer zeigen)",
  charging_state: "Zustand für \"lädt\" (leer = on, charging, Zahl > 0 …)",
  max_power: "Maximalleistung fuer den Ring (W)",
  ring_source: "Ringanzeige",
  subtract_from_home: "Vom Hausverbrauch abziehen",
  subtract_individual: "Einzelgeraete vom Hausverbrauch abziehen",
  tap_action: "Tippen",
  hold_action: "Halten",
  double_tap_action: "Doppeltippen",
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

function nodeSchema(type) {
  const schema = [{ name: "entity", selector: POWER_ENTITY }];
  if (type === "grid" || type === "battery") {
    schema.push({ name: "entity_a", selector: POWER_ENTITY });
    schema.push({ name: "entity_b", selector: POWER_ENTITY });
  }
  schema.push({ name: "invert", selector: { boolean: {} } });
  schema.push({
    type: "grid",
    schema: [
      { name: "name", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } },
    ],
  });
  schema.push({ name: "color", selector: { color_rgb: {} } });
  schema.push({
    type: "grid",
    schema: [
      { name: "unit", selector: { text: {} } },
      { name: "decimals", selector: { number: { min: 0, max: 4, step: 1, mode: "box" } } },
    ],
  });
  if (type === "battery") {
    schema.push({ name: "state_of_charge", selector: { entity: {} } });
    schema.push({
      name: "ring_source",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "soc", label: "Ladestand" },
            { value: "power", label: "Leistung" },
          ],
        },
      },
    });
  }
  if (type !== "home") {
    schema.push({ name: "max_power", selector: { number: { min: 0, max: 60000, step: 100, mode: "box" } } });
  }
  if (type === "individual") {
    schema.push({ name: "subtract_from_home", selector: { boolean: {} } });
    // Ladestand, z. B. des Autos an der Wallbox
    schema.push({ name: "state_of_charge", selector: { entity: {} } });
    schema.push({
      name: "soc_display",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { value: "battery", label: "Batteriesymbol mit Prozent im Knoten" },
            { value: "ring", label: "Innerer Ring (voll = 100 %)" },
            { value: "none", label: "Nicht anzeigen" },
          ],
        },
      },
    });
    schema.push({ name: "soc_color", selector: { color_rgb: {} } });
    schema.push({ name: "charging_entity", selector: { entity: {} } });
    schema.push({ name: "charging_state", selector: { text: {} } });
  }
  if (type === "home") schema.push({ name: "subtract_individual", selector: { boolean: {} } });
  schema.push({ name: "secondary_entity", selector: { entity: {} } });
  schema.push({ name: "note", selector: { text: {} } });
  schema.push({ name: "tap_action", selector: { ui_action: {} } });
  schema.push({ name: "hold_action", selector: { ui_action: {} } });
  schema.push({ name: "double_tap_action", selector: { ui_action: {} } });
  return schema;
}

const CARD_SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    type: "grid",
    schema: [
      { name: "title_color", selector: { color_rgb: {} } },
      { name: "title_size", selector: { number: { min: 8, max: 48, step: 1, mode: "box" } } },
    ],
  },
  {
    name: "title_weight",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: 300, label: "leicht" },
          { value: 400, label: "normal" },
          { value: 500, label: "mittel" },
          { value: 600, label: "halbfett" },
          { value: 700, label: "fett" },
          { value: 800, label: "sehr fett" },
        ],
      },
    },
  },
  {
    name: "title_align",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "left", label: "links" },
          { value: "center", label: "mittig" },
          { value: "right", label: "rechts" },
        ],
      },
    },
  },
  { name: "card_width", selector: { number: { min: 40, max: 100, step: 1, mode: "slider" } } },
];

const CENTER_SCHEMA = [
  { name: "center_image", selector: { text: {} } },
  {
    name: "center_image_fit",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "contain", label: "Bild mit Rand einpassen" },
          { value: "cover", label: "Bild fuellt den Kreis" },
        ],
      },
    },
  },
  {
    type: "grid",
    schema: [
      { name: "center_icon", selector: { icon: {} } },
      { name: "center_size", selector: { number: { min: 0.6, max: 1.8, step: 0.05, mode: "box" } } },
    ],
  },
  { name: "center_background", selector: { color_rgb: {} } },
  { name: "center_tap_action", selector: { ui_action: {} } },
  { name: "center_hold_action", selector: { ui_action: {} } },
];

const RING_SCHEMA = [
  { name: "node_size", selector: { number: { min: 0.5, max: 1.8, step: 0.05, mode: "slider" } } },
  { name: "ring_radius", selector: { number: { min: 140, max: 400, step: 5, mode: "slider" } } },
  {
    type: "grid",
    schema: [
      { name: "track_opacity", selector: { number: { min: 0, max: 1, step: 0.02, mode: "box" } } },
      { name: "ring_transition", selector: { number: { min: 0, max: 2000, step: 50, mode: "box" } } },
    ],
  },
  { name: "show_names", selector: { boolean: {} } },
];

const MOTION_SCHEMA = [
  { name: "speed", selector: { number: { min: 0.25, max: 4, step: 0.05, mode: "slider" } } },
  {
    type: "grid",
    schema: [
      { name: "min_flow_rate", selector: { number: { min: 0.1, max: 5, step: 0.05, mode: "box" } } },
      { name: "max_flow_rate", selector: { number: { min: 0.5, max: 20, step: 0.25, mode: "box" } } },
    ],
  },
  {
    type: "grid",
    schema: [
      { name: "min_expected_power", selector: { number: { min: 0, max: 5000, step: 10, mode: "box" } } },
      { name: "max_expected_power", selector: { number: { min: 500, max: 60000, step: 100, mode: "box" } } },
    ],
  },
  {
    type: "grid",
    schema: [
      { name: "dot_size", selector: { number: { min: 0.4, max: 2.5, step: 0.1, mode: "box" } } },
      { name: "cycle_gap", selector: { number: { min: 0, max: 3, step: 0.05, mode: "box" } } },
    ],
  },
  {
    type: "grid",
    schema: [
      { name: "tail_length", selector: { number: { min: 0, max: 0.3, step: 0.01, mode: "slider" } } },
      { name: "tail_segments", selector: { number: { min: 0, max: 16, step: 1, mode: "box" } } },
    ],
  },
];

const FORMAT_SCHEMA = [
  {
    type: "grid",
    schema: [
      { name: "kilo_threshold", selector: { number: { min: 0, max: 100000, step: 100, mode: "box" } } },
      { name: "display_zero_tolerance", selector: { number: { min: 0, max: 500, step: 1, mode: "box" } } },
    ],
  },
  {
    type: "grid",
    schema: [
      { name: "base_decimals", selector: { number: { min: 0, max: 3, step: 1, mode: "box" } } },
      { name: "kilo_decimals", selector: { number: { min: 0, max: 3, step: 1, mode: "box" } } },
    ],
  },
  {
    name: "display_zero_mode",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "show", label: "Linie unveraendert" },
          { value: "grey", label: "Linie ausgrauen" },
          { value: "transparency", label: "Linie transparent" },
          { value: "hide", label: "Linie ausblenden" },
        ],
      },
    },
  },
  {
    type: "grid",
    schema: [
      { name: "grey_color", selector: { color_rgb: {} } },
      { name: "transparency", selector: { number: { min: 0, max: 100, step: 5, mode: "slider" } } },
    ],
  },
];

const CARD_KEYS = ["title", "title_color", "title_size", "title_weight", "title_align", "card_width"];
const CENTER_KEYS = ["center_image", "center_image_fit", "center_icon", "center_size",
  "center_background", "center_tap_action", "center_hold_action"];
const RING_KEYS = ["node_size", "ring_radius", "track_opacity", "ring_transition", "show_names"];
const MOTION_KEYS = ["speed", "min_flow_rate", "max_flow_rate", "min_expected_power",
  "max_expected_power", "dot_size", "cycle_gap", "tail_length", "tail_segments"];

const SECTION_HINTS = {
  card: "Titel liegt über der Grafik und verschiebt sie nicht.",
  center: "Farbe füllt den Kreis vollständig, dann entfällt der Rahmen.",
  ring: "Knotengröße und Ringgröße wirken direkt. Nur wenn sich Knoten sonst berühren würden, bleibt die Grafik insgesamt etwas kleiner.",
  motion: "Tempo wirkt auf alle Linien, die Abstufung nach Leistung bleibt erhalten.",
  format: "Gilt für alle Knoten, sofern dort nichts Eigenes eingetragen ist.",
  nodes: "Ohne Sensor bleibt ein Knoten weg. Haus rechnet sich notfalls als Bilanz.",
};

class RadialFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = { individual: [] };
    this._built = false;
    this._forms = {};
  }

  setConfig(config) {
    this._config = { ...config };
    if (!this._config.individual) this._config.individual = [];
    this._maybeRender();
  }

  set hass(hass) {
    this._hass = hass;
    Object.values(this._forms).forEach((f) => {
      if (Array.isArray(f)) f.forEach((x) => { if (x) x.hass = hass; });
      else if (f && f.tagName === "HA-FORM") f.hass = hass;
    });
    this._maybeRender();
  }

  async _maybeRender() {
    if (!this._hass || !this._config) return;
    if (!customElements.get("ha-form")) {
      await loadHaComponents();
      if (!customElements.get("ha-form")) {
        this.shadowRoot.innerHTML =
          '<p style="padding:16px">Die Formularkomponenten von Home Assistant konnten nicht geladen werden. Bitte in YAML konfigurieren.</p>';
        return;
      }
    }
    const count = (this._config.individual || []).length;
    if (!this._built || this._individualCount !== count) this._build();
    else this._sync();
  }

  _build() {
    this._individualCount = (this._config.individual || []).length;
    this.shadowRoot.innerHTML = `
      <style>
        .box { display: flex; flex-direction: column; gap: 10px; padding: 4px 0 8px; }
        .group { font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
                 color: var(--secondary-text-color); margin: 14px 2px 2px; }
        .group:first-child { margin-top: 4px; }
        ha-expansion-panel { --expansion-panel-content-padding: 0 12px 12px; border-radius: 8px; }
        .panel-body { padding-top: 8px; }
        .hint { font-size: 12px; line-height: 1.5; color: var(--secondary-text-color); margin: 2px 0 10px; }
        .row { display: flex; align-items: center; gap: 14px; margin-top: 10px; }
        .del { background: none; border: none; color: var(--error-color, #db4437); cursor: pointer; font: inherit; padding: 4px 0; }
        .move { background: none; border: none; color: var(--primary-color); cursor: pointer; font: inherit; padding: 4px 0; }
        .move[disabled] { color: var(--disabled-text-color); cursor: default; }
        .add { background: none; border: 1px dashed var(--divider-color); border-radius: 8px;
               color: var(--primary-color); cursor: pointer; font: inherit; padding: 10px; width: 100%; }
      </style>
      <div class="box" id="root"></div>`;

    const root = this.shadowRoot.getElementById("root");
    this._forms = {};

    const group = (label) => {
      const d = document.createElement("div");
      d.className = "group";
      d.textContent = label;
      root.appendChild(d);
    };

    const section = (header, key, schema, data, onChange, hint, expanded) => {
      const body = document.createElement("div");
      body.className = "panel-body";
      if (hint) {
        const h = document.createElement("p");
        h.className = "hint";
        h.textContent = hint;
        body.appendChild(h);
      }
      body.appendChild(this._form(key, schema, data, onChange));
      root.appendChild(this._panel(header, body, expanded));
    };

    /* ---- 1. Sensoren ---- */
    group("Sensoren");
    ["solar", "grid", "battery", "home"].forEach((type, idx) => {
      const body = document.createElement("div");
      body.className = "panel-body";
      if (idx === 0) {
        const h = document.createElement("p");
        h.className = "hint";
        h.textContent = SECTION_HINTS.nodes;
        body.appendChild(h);
      }
      body.appendChild(
        this._form(type, nodeSchema(type), this._nodeData(this._config[type]),
          (v) => this._onNode(type, v), NODE_LABEL_OVERRIDES[type])
      );
      if (type !== "home" && this._config[type]) {
        const row = document.createElement("div");
        row.className = "row";
        const del = document.createElement("button");
        del.className = "del";
        del.textContent = "Knoten entfernen";
        del.addEventListener("click", () => {
          const cfg = { ...this._config };
          delete cfg[type];
          this._commit(cfg, true);
        });
        row.appendChild(del);
        body.appendChild(row);
      }
      root.appendChild(this._panel(NODE_LABELS[type], body, idx === 0 && !this._config.solar));
    });

    /* ---- 2. Verbraucher ---- */
    group("Verbraucher");
    const forms = [];
    (this._config.individual || []).forEach((ind, i) => {
      const body = document.createElement("div");
      body.className = "panel-body";
      const form = this._form(`ind${i}`, nodeSchema("individual"), this._nodeData(ind),
        (v) => this._onIndividual(i, v));
      forms.push(form);
      body.appendChild(form);

      const row = document.createElement("div");
      row.className = "row";
      const move = (delta) => {
        const list = [...this._config.individual];
        const target = i + delta;
        if (target < 0 || target >= list.length) return;
        [list[i], list[target]] = [list[target], list[i]];
        this._commit({ ...this._config, individual: list }, true);
      };
      const up = document.createElement("button");
      up.className = "move";
      up.textContent = "\u2191 nach vorn";
      up.disabled = i === 0;
      up.addEventListener("click", () => move(-1));
      const down = document.createElement("button");
      down.className = "move";
      down.textContent = "\u2193 nach hinten";
      down.disabled = i === this._config.individual.length - 1;
      down.addEventListener("click", () => move(1));
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "Entfernen";
      del.addEventListener("click", () => {
        const list = [...this._config.individual];
        list.splice(i, 1);
        this._commit({ ...this._config, individual: list }, true);
      });
      row.appendChild(up);
      row.appendChild(down);
      row.appendChild(del);
      body.appendChild(row);

      const label = `${i + 1}. ` + (
        ind.name ||
        (typeof ind.entity === "string" && this._hass.states[ind.entity]?.attributes.friendly_name) ||
        "Verbraucher"
      );
      root.appendChild(this._panel(label, body));
    });
    this._forms.individual = forms;

    const add = document.createElement("button");
    add.className = "add";
    add.textContent = "+ Verbraucher hinzuf\u00fcgen";
    add.addEventListener("click", () => {
      const list = [...(this._config.individual || []), { entity: "" }];
      this._commit({ ...this._config, individual: list }, true);
    });
    root.appendChild(add);

    /* ---- 3. Aussehen ---- */
    group("Aussehen");
    section("Karte & Titel", "card", CARD_SCHEMA, this._pick(CARD_KEYS),
      (v) => this._onGroup(v), SECTION_HINTS.card);
    section("Mitte", "center", CENTER_SCHEMA, this._pick(CENTER_KEYS),
      (v) => this._onGroup(v), SECTION_HINTS.center);
    section("Knoten & Ringe", "ring", RING_SCHEMA, this._pick(RING_KEYS),
      (v) => this._onGroup(v), SECTION_HINTS.ring);

    /* ---- 4. Bewegung und Zahlen ---- */
    group("Bewegung & Zahlen");
    section("Punkte", "motion", MOTION_SCHEMA, this._pick(MOTION_KEYS),
      (v) => this._onGroup(v), SECTION_HINTS.motion);
    section("Werte & Einheiten", "format", FORMAT_SCHEMA, this._formatData(),
      (v) => this._onFormat(v), SECTION_HINTS.format);

    this._built = true;
  }

  _panel(header, content, expanded) {
    const p = document.createElement("ha-expansion-panel");
    p.outlined = true;
    p.setAttribute("header", header);
    if (expanded) p.expanded = true;
    p.appendChild(content);
    return p;
  }

  _form(key, schema, data, onChange, overrides) {
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.schema = schema;
    form.data = data;
    form.computeLabel = (s) => (overrides && overrides[s.name]) || LABELS[s.name] || s.name;
    form.addEventListener("value-changed", (e) => {
      e.stopPropagation();
      onChange(e.detail.value);
    });
    this._forms[key] = form;
    return form;
  }

  _pick(keys) {
    const c = { ...DEFAULTS, ...this._config };
    const out = {};
    keys.forEach((k) => {
      const v = c[k] ?? DEFAULTS[k];
      out[k] = v === null ? undefined : v;
    });
    return out;
  }

  _formatData() {
    const c = { ...DEFAULTS, ...this._config };
    const dz = { ...DEFAULTS.display_zero_lines, ...(this._config.display_zero_lines || {}) };
    return {
      kilo_threshold: c.kilo_threshold,
      display_zero_tolerance: c.display_zero_tolerance,
      base_decimals: c.base_decimals,
      kilo_decimals: c.kilo_decimals,
      display_zero_mode: dz.mode,
      grey_color: dz.grey_color,
      transparency: dz.transparency,
    };
  }

  _nodeData(node) {
    const n = typeof node === "string" ? { entity: node } : { ...(node || {}) };
    const data = { ...n };
    if (n.entity && typeof n.entity === "object") {
      data.entity = "";
      data.entity_a = n.entity.consumption || n.entity.discharge || "";
      data.entity_b = n.entity.production || n.entity.charge || "";
    }
    if (data.soc_display === undefined) data.soc_display = "battery";
    // Liste aus YAML im Textfeld als kommagetrennte Angabe zeigen
    if (Array.isArray(data.charging_state)) data.charging_state = data.charging_state.join(", ");
    return data;
  }

  _nodeConfig(data, type) {
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
    ["name", "icon", "color", "unit", "note", "secondary_entity", "secondary_unit",
     "state_of_charge", "ring_source"].forEach((k) => put(k, data[k]));
    if (type === "individual") {
      // Anzeige nur speichern, wenn sie vom Standard (Batteriesymbol) abweicht
      if (data.soc_display && data.soc_display !== "battery") out.soc_display = data.soc_display;
      put("soc_color", data.soc_color);
      put("charging_entity", data.charging_entity);
      put("charging_state", data.charging_state);
    }
    if (data.max_power) out.max_power = data.max_power;
    if (type === "individual" && data.subtract_from_home === false) out.subtract_from_home = false;
    if (data.decimals !== undefined && data.decimals !== null && data.decimals !== "") out.decimals = data.decimals;
    if (data.invert) out.invert = true;
    if (type === "home" && data.subtract_individual === false) out.subtract_individual = false;
    ["tap_action", "hold_action", "double_tap_action"].forEach((k) => {
      if (data[k] && data[k].action && data[k].action !== "none") out[k] = data[k];
    });
    return out;
  }

  _onGroup(v) {
    const cfg = { ...this._config };
    Object.keys(v).forEach((k) => {
      const val = v[k];
      cfg[k] = val === "" || val === null ? undefined : val;
    });
    this._commit(cfg);
  }

  _onFormat(v) {
    const cfg = { ...this._config };
    ["kilo_threshold", "display_zero_tolerance", "base_decimals", "kilo_decimals"].forEach((k) => {
      cfg[k] = v[k];
    });
    cfg.display_zero_lines = {
      mode: v.display_zero_mode,
      grey_color: v.grey_color,
      transparency: v.transparency,
    };
    this._commit(cfg);
  }

  _onNode(type, v) {
    const cfg = { ...this._config };
    cfg[type] = this._nodeConfig(v, type);
    this._commit(cfg);
  }

  _onIndividual(index, v) {
    const list = [...(this._config.individual || [])];
    list[index] = this._nodeConfig(v, "individual");
    this._commit({ ...this._config, individual: list });
  }

  _commit(config, restructure) {
    const clean = { ...config };
    Object.keys(clean).forEach((k) => { if (clean[k] === undefined) delete clean[k]; });
    this._config = clean;
    fire(this, "config-changed", { config: clean });
    if (restructure) { this._built = false; this._maybeRender(); }
  }

  _sync() {
    const map = { card: CARD_KEYS, center: CENTER_KEYS, ring: RING_KEYS, motion: MOTION_KEYS };
    Object.keys(map).forEach((k) => {
      if (this._forms[k]) this._forms[k].data = this._pick(map[k]);
    });
    if (this._forms.format) this._forms.format.data = this._formatData();
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

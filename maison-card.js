/* ================================================================
   Carte Home Assistant « Ma maison en 3D »
   Affiche une des vues de ta page (Maison, un étage, ou un de tes
   dashboards personnalisés) directement comme une carte native,
   choisie dans un menu déroulant, sans écrire de code.
   ================================================================ */
const FIXED_VIEWS = [
  { id: "", label: "Maison (vue complète)" },
  { id: "niveau:level0", label: "Niveau 0" },
  { id: "niveau:level2", label: "Niveau 2" },
  { id: "niveau:level3", label: "Niveau 3" },
  { id: "niveau:level1", label: "Extérieur" },
];
const STORE_KEY = "plan-maison-noms-v1";

function readSavedDashboards() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw);
    const list = (saved && saved.dash && saved.dash.list) || [];
    return list.map(d => ({ id: "dash:" + d.id, label: d.name || "Dashboard" }));
  } catch (e) { return []; }
}

function allViews() { return FIXED_VIEWS.concat(readSavedDashboards()); }

function urlFor(baseUrl, viewId) {
  const base = (baseUrl || "/local/plan_maison_home_assistant.html").replace(/\/+$/, "");
  if (!viewId) return base + "?kiosk=1";
  const [kind, val] = viewId.split(":");
  if (kind === "niveau") return base + "?niveau=" + encodeURIComponent(val) + "&kiosk=1";
  if (kind === "dash") return base + "?dash=" + encodeURIComponent(val) + "&kiosk=1";
  return base + "?kiosk=1";
}

class MaisonCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({ base_url: "/local/plan_maison_home_assistant.html", view: "", aspect_ratio: "75%" }, config || {});
    this._build();
  }
  set hass(hass) { this._hass = hass; }               // la vue elle-même lit Home Assistant depuis l'iframe (connexion directe) ; la carte n'a pas besoin de relayer les états
  getCardSize() { return 5; }
  static getStubConfig() { return { view: "" }; }
  static getConfigElement() { return document.createElement("maison-card-editor"); }
  _build() {
    if (this._built === this._config.view + "|" + this._config.base_url + "|" + this._config.aspect_ratio) return;
    this._built = this._config.view + "|" + this._config.base_url + "|" + this._config.aspect_ratio;
    const url = urlFor(this._config.base_url, this._config.view);
    this.innerHTML =
      '<ha-card style="overflow:hidden">' +
      (this._config.title ? '<h1 class="card-header">' + this._esc(this._config.title) + "</h1>" : "") +
      '<div style="position:relative;width:100%;padding-top:' + this._esc(this._config.aspect_ratio || "75%") + '">' +
      '<iframe src="' + this._esc(url) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy"></iframe>' +
      "</div></ha-card>";
  }
  _esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
}

class MaisonCardEditor extends HTMLElement {
  setConfig(config) { this._config = config || {}; this._render(); }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
  _render() {
    const views = allViews(), cur = this._config.view || "";
    this.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:12px;padding:12px 4px">' +
      '<div><label style="display:block;font-size:13px;margin-bottom:4px">Vue à afficher</label>' +
      '<select id="mc-view" style="width:100%;padding:8px;border-radius:8px">' +
      views.map(v => '<option value="' + v.id + '"' + (v.id === cur ? " selected" : "") + ">" + this._esc(v.label) + "</option>").join("") +
      "</select></div>" +
      '<div><label style="display:block;font-size:13px;margin-bottom:4px">Titre de la carte (facultatif)</label>' +
      '<input id="mc-title" type="text" style="width:100%;padding:8px;border-radius:8px" value="' + this._esc(this._config.title || "") + '"></div>' +
      '<div><label style="display:block;font-size:13px;margin-bottom:4px">Adresse de la page (si différente)</label>' +
      '<input id="mc-url" type="text" style="width:100%;padding:8px;border-radius:8px" placeholder="/local/plan_maison_home_assistant.html" value="' + this._esc(this._config.base_url || "") + '"></div>' +
      (views.length <= FIXED_VIEWS.length ? '<div style="font-size:12px;opacity:.7">Tes dashboards personnalisés (Dashboard 1, 2…) apparaîtront ici automatiquement dès que tu les auras créés dans la page, sur cet appareil.</div>' : "") +
      "</div>";
    this.querySelector("#mc-view").addEventListener("change", e => { this._config = Object.assign({}, this._config, { view: e.target.value }); this._fire(); });
    this.querySelector("#mc-title").addEventListener("input", e => { this._config = Object.assign({}, this._config, { title: e.target.value }); this._fire(); });
    this.querySelector("#mc-url").addEventListener("input", e => { this._config = Object.assign({}, this._config, { base_url: e.target.value }); this._fire(); });
  }
  _esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
}

customElements.define("maison-card", MaisonCard);
customElements.define("maison-card-editor", MaisonCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "maison-card",
  name: "Ma maison en 3D",
  description: "Affiche une vue de ta maison en 3D (Maison, un étage, ou un de tes dashboards) directement comme une carte.",
  preview: false,
});

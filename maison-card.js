/* ================================================================
   Carte Home Assistant « Ma maison en 3D »
   Affiche une des vues de ta page (Maison, un étage, ou un de tes
   dashboards personnalisés) directement comme une carte native,
   choisie dans un menu déroulant, sans écrire de code.
   Un bouton en haut à droite verrouille/déverrouille le déplacement
   de la caméra (rotation, zoom) sans bloquer les entités cliquables
   (lampes, capteurs…) affichées dans la vue.
   ================================================================ */
// Après import de ton propre plan .sh3d, la page numérote tes niveaux
// level0, level1, level2... par ordre d'élévation croissante. Adapte
// la liste ci-dessous (id + libellé) au nombre réel de niveaux de ta
// maison — ce n'est qu'un exemple pour une maison à 4 niveaux.
const FIXED_VIEWS = [
  { id: "", label: "Maison (vue complète)" },
  { id: "niveau:level0", label: "Niveau 0" },
  { id: "niveau:level1", label: "Niveau 1" },
  { id: "niveau:level2", label: "Niveau 2" },
  { id: "niveau:level3", label: "Niveau 3" },
];
const STORE_KEY = "plan-maison-noms-v1";
const LOCK_STORE_KEY = "maison-card-locks-v1";

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

function urlFor(baseUrl, viewId, locked) {
  const base = (baseUrl || "/local/plan_maison_home_assistant.html").replace(/\/+$/, "");
  const [kind, val] = (viewId || "").split(":");
  const parts = [];
  if (kind === "niveau") parts.push("niveau=" + encodeURIComponent(val));
  else if (kind === "dash") parts.push("dash=" + encodeURIComponent(val));
  parts.push("kiosk=1");
  if (locked) parts.push("lock=1");                                          // verrouillage initial de la caméra dès le chargement de la page
  return base + "?" + parts.join("&");
}

// mémorise l'état verrouillé/déverrouillé de chaque carte (par vue + adresse), pour qu'il survive aux rechargements
function readLocks() {
  try { return JSON.parse(window.localStorage.getItem(LOCK_STORE_KEY)) || {}; } catch (e) { return {}; }
}
function writeLocks(locks) {
  try { window.localStorage.setItem(LOCK_STORE_KEY, JSON.stringify(locks)); } catch (e) {}
}

class MaisonCard extends HTMLElement {
  setConfig(config) {
    this._config = Object.assign({ base_url: "/local/plan_maison_home_assistant.html", view: "", aspect_ratio: "75%" }, config || {});
    this._lockKey = this._config.base_url + "|" + this._config.view;
    const locks = readLocks();
    this._locked = !!locks[this._lockKey];
    this._build();
  }
  set hass(hass) { this._hass = hass; }               // la vue elle-même lit Home Assistant depuis l'iframe (connexion directe) ; la carte n'a pas besoin de relayer les états
  getCardSize() { return 5; }
  static getStubConfig() { return { view: "" }; }
  static getConfigElement() { return document.createElement("maison-card-editor"); }
  _build() {
    const sig = this._config.view + "|" + this._config.base_url + "|" + this._config.aspect_ratio;
    if (this._built === sig) { this._syncLockButton(); return; }
    this._built = sig;
    const url = urlFor(this._config.base_url, this._config.view, this._locked);
    this.innerHTML =
      '<ha-card style="overflow:hidden">' +
      (this._config.title ? '<h1 class="card-header">' + this._esc(this._config.title) + "</h1>" : "") +
      '<div style="position:relative;width:100%;padding-top:' + this._esc(this._config.aspect_ratio || "75%") + '">' +
      '<iframe id="mc-frame" src="' + this._esc(url) + '" style="position:absolute;inset:0;width:100%;height:100%;border:0" loading="lazy"></iframe>' +
      '<button id="mc-lock" title="Verrouiller la caméra" style="position:absolute;top:6px;right:6px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2">' +
      '<svg id="mc-lock-svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/></svg>' +
      '</button>' +
      "</div></ha-card>";
    this._frame = this.querySelector("#mc-frame");
    this._lockBtn = this.querySelector("#mc-lock");
    this._lockBtn.addEventListener("click", e => { e.stopPropagation(); this._toggleLock(); });
    this._frame.addEventListener("load", () => this._sendLock());            // au (re)chargement de la page, on lui rappelle l'état voulu
    this._syncLockButton();
  }
  _toggleLock() {
    this._locked = !this._locked;
    const locks = readLocks(); locks[this._lockKey] = this._locked; writeLocks(locks);
    this._syncLockButton();
    this._sendLock();
  }
  _sendLock() {
    try { this._frame.contentWindow.postMessage({ source: "maison-card", type: "lock", value: this._locked }, "*"); } catch (e) {}
  }
  _syncLockButton() {
    if (!this._lockBtn) return;
    const svg = this.querySelector("#mc-lock-svg");
    if (svg) svg.innerHTML = this._locked
      ? '<path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>'
      : '<path d="M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H15V6A3,3 0 0,0 12,3A3,3 0 0,0 9,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18Z"/>';
    this._lockBtn.title = this._locked ? "Déverrouiller la caméra (le déplacement redevient possible)" : "Verrouiller la caméra (bloque le déplacement, les entités restent cliquables)";
    this._lockBtn.style.background = this._locked ? "rgba(211,47,47,.75)" : "rgba(0,0,0,.55)";
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
      '<div style="font-size:12px;opacity:.7">Un bouton de cadenas apparaît en haut à droite de la carte pour bloquer le déplacement de la caméra (rotation, zoom) sans empêcher de cliquer sur les entités. Cette préférence est mémorisée sur cet appareil.</div>' +
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
  description: "Affiche une vue de ta maison en 3D (Maison, un étage, ou un de tes dashboards) directement comme une carte, avec un bouton pour verrouiller la caméra.",
  preview: false,
});

import { ToolBase } from "./ToolBase.js";
import { obterCoordenadaSVG } from "../utils/svgHelpers.js";
import { CameraSVG } from "../core/CameraSVG.js";

/* ============================================
                  LupaTool
============================================ */
export class LupaTool extends ToolBase {
  constructor(svg, overlaySvg, camera = null) {
    super();

    this.svg = svg;
    this.overlaySvg = overlaySvg;
    this.camera = camera || new CameraSVG([svg, overlaySvg]);

    this.modo = "click"; // zoom padrão do inkscape

    // controles da interação mouseOnMove | Modo drag
    this.drag = {
      active: false, // se
      start: null, //
      button: null, //
      rect: null, //
    };

    this.zoomInFactor = 0.95;
    this.zoomOutFactor = 1 / this.zoomInFactor;

    this.minZoomLimit = this.camera.minZoomLimit; // Trava o Zoom Out em 10%
    this.maxZoomLimit = this.camera.maxZoomLimit; // Trava o Zoom In em 4000%
  }

  /* ============================================
    Interface e Butoes
  ============================================ */

  // Atualiza o indicador de acordo com o nivel de zoom
  updateZoomIndicator() {
    const el = document.getElementById("zoom-indicator");
    if (!el) return;
    el.textContent = `Zoom: ${this.camera.getZoomLevel()}%`;
  }

  // Atualiza o cursos de acordo com o modo
  updateCursor() {
    this.svg.style.cursor = this.modo === "drag" ? "crosshair" : "zoom-in";
  }

  // Atualiza o btn-drag quando pressionado
  updateButtons() {
    const btnDrag = document.getElementById("btn-drag");
    if (!btnDrag) return;
    btnDrag.classList.toggle("ativo", this.modo === "drag");

    const nomeEl = document.getElementById("nome-ferramenta");
    if (nomeEl)
      nomeEl.textContent = this.modo === "drag" ? "Zoom por Seleção" : "Zoom";
  }

  // Alterna o modo de interação da lupa
  setModo(modo) {
    this.modo = this.modo === modo ? "click" : modo;
    this.updateCursor();
    this.updateButtons();
  }

  // Renderiza dinamicamente o painel de opcoes da lupa
  renderOptions() {
    const panel = document.getElementById("zoom-options");

    if (!panel || panel.dataset.initialized) return;

    // Define o botão: 'btn-drag'
    panel.innerHTML = `
      <button
        id="btn-drag"
        class="btn-ferramenta"
        data-tooltip="Zoom por Seleção (Shift+Z)">

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="10"
            cy="10"
            r="8">
          </circle>

          <line
            x1="20"
            y1="20"
            x2="15"
            y2="15">
          </line>

          <rect x="7"
                y="7"
                width="6"
                height="6"
                stroke-dasharray="2">
          </rect>

        </svg>
      </button>
    `;
    // Atualiza o modo para 'drag' quando pressionado
    panel.querySelector("#btn-drag").onclick = () => {
      this.setModo("drag");
    };
    // Define que o painel existe (visivel)
    panel.dataset.initialized = "true";
    this.updateButtons();
  }

  // Cria e posiciona o painel em relação ao 'btn-Lupa' da main.js
  openPanel() {
    const panel = document.getElementById("zoom-options");
    const btnLupa = document.querySelector('[data-ferramenta="lupa"]');

    if (!panel || !btnLupa) return;

    const rect = btnLupa.getBoundingClientRect();

    panel.style.top = `${rect.top}px`;
    panel.style.left = `${rect.right + 8}px`;

    panel.classList.remove("hidden");

    this.renderOptions();
  }

  // Destroi o painel de opções (oculto)
  closePanel() {
    const panel = document.getElementById("zoom-options");
    if (!panel) return;
    panel.classList.add("hidden");
    panel.innerHTML = "";
    delete panel.dataset.initialized;
  }

  /* ============================================
    Retangulo Selecao
  ============================================ */

  // Define o retangulo de seleção
  createSelectionRect() {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "rgba(0,0,255,0.15)");
    rect.setAttribute("stroke", "blue");
    rect.setAttribute("stroke-width", "1");
    rect.setAttribute("stroke-dasharray", "4");
    rect.setAttribute("vector-effect", "non-scaling-stroke");
    rect.setAttribute("pointer-events", "none");
    this.overlaySvg.appendChild(rect);
    this.drag.rect = rect;
  }

  // Remove elemento retangulo de seleção e reseta o estado/modo da lupa
  cleanupDrag() {
    if (this.drag.rect && this.drag.rect.parentNode) {
      this.drag.rect.parentNode.removeChild(this.drag.rect);
    }
    this.drag = {
      active: false,
      start: null,
      button: null,
      rect: null,
    };
  }

  /* ============================================
    Eventos
  ============================================ */

  // Bloqueia a requisição de zoom se já estivermos nos limites
  requestZoom(scale, x, y) {
    const currentZoom = this.camera.getZoomLevel();

    // Se scale < 1, é Zoom In (aproximação do viewBox)
    if (scale < 1 && currentZoom >= this.maxZoomLimit) {
      return; // Ignora o comando
    }

    // Se scale > 1, é Zoom Out (afastamento do viewBox)
    if (scale > 1 && currentZoom <= this.minZoomLimit) {
      return; // Ignora o comando
    }

    // Se passou pela verificação, aplica o zoom livremente
    this.camera.zoom(scale, x, y);
    this.updateZoomIndicator();
  }

  // Inicio da interação com o mouse
  onMouseDown(evento) {
    evento.preventDefault();

    const coords = obterCoordenadaSVG(evento, this.svg);

    // Botão do meio ( Reset do viebox, independente do modo)
    if (evento.button === 1) {
      this.camera.resetView();
      this.updateZoomIndicator();
      return;
    }

    // Modo zoom padrão ('click')
    if (this.modo === "click") {
      if (evento.button === 0)
        this.requestZoom(this.zoomInFactor, coords.x, coords.y);
      if (evento.button === 2)
        this.requestZoom(this.zoomOutFactor, coords.x, coords.y);
      this.updateZoomIndicator();
      return;
    }

    // Modo zoom por seleção ('drag')
    if (this.modo === "drag") {
      this.drag.active = true;
      this.drag.start = coords;
      this.drag.button = evento.button;

      // Cria retangulo de seleção
      this.createSelectionRect();
    }
  }

  // Atualiza retangulo de seleção em relação a posiçao
  onMouseMove(evento) {
    evento.preventDefault();

    if (!this.drag.active || !this.drag.rect) return;

    const coords = obterCoordenadaSVG(evento, this.svg);
    const x = Math.min(this.drag.start.x, coords.x);
    const y = Math.min(this.drag.start.y, coords.y);
    const width = Math.abs(coords.x - this.drag.start.x);
    const height = Math.abs(coords.y - this.drag.start.y);

    this.drag.rect.setAttribute("x", x);
    this.drag.rect.setAttribute("y", y);
    this.drag.rect.setAttribute("width", width);
    this.drag.rect.setAttribute("height", height);
  }

  // Finaliza zoom de seleção e aplica zoom
  onMouseUp(evento) {
    evento.preventDefault();

    if (!this.drag.active) return;

    const coords = obterCoordenadaSVG(evento, this.svg);
    const x = Math.min(this.drag.start.x, coords.x);
    const y = Math.min(this.drag.start.y, coords.y);
    const width = Math.abs(coords.x - this.drag.start.x);
    const height = Math.abs(coords.y - this.drag.start.y);

    const acaoBotao = this.drag.button;
    this.cleanupDrag();

    // Ignora seleções muito pequenas
    if (width === 0 || height === 0) {
      return;
    }

    // Zoom In
    if (acaoBotao === 0) {
      this.camera.zoomToRect(x, y, width, height);
    }

    // Zoom Out
    if (acaoBotao === 2) {
      this.camera.zoomOutFromRect(x, y, width, height);
    }
    this.updateZoomIndicator();
  }

  // Interação do scroll do mouse (zoom conforme movimento do scroll)
  onWheel(evento) {
    evento.preventDefault();
    const coords = obterCoordenadaSVG(evento, this.svg);
    const scale =
      evento.deltaY > 0
        ? this.zoomOutFactor // scroll-up = zoom-in
        : this.zoomInFactor; // scroll-down = zoom-out
    this.requestZoom(scale, coords.x, coords.y);
    this.updateZoomIndicator();
  }

  onMouseLeave(evento) {
    if (!this.drag.active) {
      return;
    } else {
      this.onMouseUp(evento);
    }
  }
  /* ============================================
    Ciclo de Vida
  ============================================ */

  // Ativa ferramenta, exibe painel de opcoes do zoom e o Indicador de Zoom
  onAtivar() {
    this._wheelHandler = (e) => this.onWheel(e);
    this._leaveHandler = (e) => this.onMouseLeave(e);
    this.svg.addEventListener("wheel", this._wheelHandler, { passive: false });
    this.svg.addEventListener("mouseleave", this._leaveHandler);
    this.openPanel();
    this.updateCursor();
    this.updateZoomIndicator();
  }

  // Desativa ferramenta, limpa UI, retorna para o modo padrão
  onDesativar() {
    if (this._wheelHandler) {
      this.svg.removeEventListener("wheel", this._wheelHandler);
      this._wheelHandler = null;
    }
    if (this._leaveHandler) {
      this.svg.removeEventListener("mouseleave", this._leaveHandler);
      this._leaveHandler = null;
    }
    this.cleanupDrag();
    this.closePanel();

    this.setModo("click");
    this.svg.style.cursor = "default";
  }
}

import {
  definirCorBorda,
  definirCorPreenchimento,
  estado,
  registrarAcaoHistorico,
} from "../core/StateManager.js";
import { rgbToHex } from "../utils/colorHelpers.js";
import { obterCoordenadaSVG } from "../utils/svgHelpers.js";
import { ToolBase } from "./ToolBase.js";

export class ColorPickerTool extends ToolBase {
  /** @param {SVGSVGElement} svgCanvas */
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.detectedColor = "";
    /** @type {Set<string>} */
    this.pressedKeys = new Set();
    
    const listenKey = (/** @type {string} */ key) => {
      const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
        if (event.key === key) {
          this.pressedKeys.add(key);
        }
      };
      const onKeyUp = (/** @type {KeyboardEvent} */ event) => {
        if (event.key === key) {
          this.pressedKeys.delete(key);
        }
      };
      return { onKeyDown, onKeyUp };
    };
    this.listeners = ["Control", "Shift", "c"].flatMap(listenKey);
  }

  onAtivar() {
    this.listeners.forEach((keyListeners) => {
      window.addEventListener("keydown", keyListeners.onKeyDown);
      window.addEventListener("keyup", keyListeners.onKeyUp);
    });

    this.onCopyShortcut = (event) => {
      if (this.pressedKeys.has("Control") && event.key.toLowerCase() === "c") {
        navigator.clipboard.writeText(this.detectedColor);
      }
    };
    window.addEventListener("keydown", this.onCopyShortcut);
  }

  onDesativar() {
    this.listeners.forEach((keyListeners) => {
      window.removeEventListener("keydown", keyListeners.onKeyDown);
      window.removeEventListener("keyup", keyListeners.onKeyUp);
    });
    window.removeEventListener("keydown", this.onCopyShortcut);
    this.pressedKeys.clear();
  }

  /** @param {MouseEvent} evento*/
  onMouseMove(evento) {
    // clientX e clientY são mais consistentes em todos os navegadores
    const elemento = document.elementFromPoint(evento.clientX, evento.clientY);
    /** @type {string} */ let color = "rgb(255, 255, 255)";

    if (elemento instanceof SVGGeometryElement) {
      const style = window.getComputedStyle(elemento);
      const shiftPressionado = this.pressedKeys.has("Shift") || evento.shiftKey;

      // Se segurar Shift, força a captura da cor da borda (stroke) se ela existir.
      // Se não, usa a lógica de detecção de ponto ou cai no preenchimento (fill).
      if (shiftPressionado && style.stroke !== "none") {
        color = style.stroke;
      } else {
        const point = obterCoordenadaSVG(evento, this.svgCanvas);
        const isInStroke = elemento.isPointInStroke(point);
        color = isInStroke && style.stroke !== "none" ? style.stroke : style.fill;
      }
    } else if (elemento) {
      const bg = window.getComputedStyle(elemento).backgroundColor;
      if (bg) color = bg;
    }

    this.detectedColor = rgbToHex(color);
  }

  /**
   * @param {MouseEvent} evento
   */
  onMouseDown(evento) {
    const eBorda = this.pressedKeys.has("Shift") || evento.shiftKey;

    if (eBorda) {
      // 1. Aplica e salva como cor da Borda (Stroke)
      definirCorBorda(this.detectedColor);
      
      const bordaInput = /** @type {HTMLInputElement} */ (document.getElementById("cor-borda"));
      if (bordaInput) bordaInput.value = this.detectedColor;

      const popupBorda = /** @type {HTMLInputElement} */ (document.getElementById("popup-cor-borda"));
      if (popupBorda) popupBorda.value = this.detectedColor;

      // Altera a borda dos elementos selecionados no momento
      estado.elementosSelecionados.forEach(el => {
        el.setAttribute("stroke", this.detectedColor);
      });
    } else {
      // 2. Aplica e salva como cor de Preenchimento (Fill)
      definirCorPreenchimento(this.detectedColor);
      
      const preenchimentoInput = /** @type {HTMLInputElement} */ (document.getElementById("cor-preenchimento"));
      if (preenchimentoInput) preenchimentoInput.value = this.detectedColor;

      const popupPreenchimento = /** @type {HTMLInputElement} */ (document.getElementById("popup-cor-preenchimento"));
      if (popupPreenchimento) popupPreenchimento.value = this.detectedColor;

      // Altera o preenchimento dos elementos selecionados no momento
      estado.elementosSelecionados.forEach(el => {
        el.setAttribute("fill", this.detectedColor);
      });
    }

    // Salva a alteração no histórico do canvas (undo/redo)
    if (typeof registrarAcaoHistorico === "function") {
      registrarAcaoHistorico();
    }
  }
}
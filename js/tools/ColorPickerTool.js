import {
  definirCorBorda,
  definirCorPreenchimento,
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

    window.addEventListener("keydown", () => {
      if (this.pressedKeys.has("Control") && this.pressedKeys.has("c")) {
        navigator.clipboard.writeText(this.detectedColor);
      }
    });
  }

  onDesativar() {
    this.listeners.forEach((keyListeners) => {
      window.removeEventListener("keydown", keyListeners.onKeyDown);
      window.removeEventListener("keyup", keyListeners.onKeyUp);
    });
  }

  /** @param {MouseEvent} evento*/
  onMouseMove(evento) {
    const elemento = document.elementFromPoint(evento.x, evento.y);
    /** @type {string} */ let color;

    if (elemento instanceof SVGGeometryElement) {
      const point = obterCoordenadaSVG(evento, this.svgCanvas);
      const isInStroke = elemento.isPointInStroke(point);
      const style = window.getComputedStyle(elemento);
      color = isInStroke && style.stroke !== "none" ? style.stroke : style.fill;
    } else {
      color = elemento.computedStyleMap().get("background-color").toString();
    }

    this.detectedColor = rgbToHex(color);
  }

  /**
   * @param {MouseEvent} evento
   */
  onMouseDown(evento) {
    if (this.pressedKeys.has("Shift")) {
      definirCorBorda(this.detectedColor);
      const bordaInput =
        /** @type {HTMLInputElement} */
        (document.getElementById("cor-borda"));
      bordaInput.value = this.detectedColor;
    } else {
      definirCorPreenchimento(this.detectedColor);
      const preenchimentoInput =
        /** @type {HTMLInputElement} */
        (document.getElementById("cor-preenchimento"));
      preenchimentoInput.value = this.detectedColor;
    }
  }
}

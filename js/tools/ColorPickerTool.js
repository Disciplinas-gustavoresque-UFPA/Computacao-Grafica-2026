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
    /** @type {Set<string>} */
    this.pressedKeys = new Set();
    const listenKey = (/** @type {string} */ key) => {
      const onKeyDown = (/** @type {KeyboardEvent} */ event) => {
        if (event.key === key) {
          console.log(key, "down");
          this.pressedKeys.add(key);
        }
      };
      const onKeyUp = (/** @type {KeyboardEvent} */ event) => {
        if (event.key === key) {
          console.log(key, "up");
          this.pressedKeys.delete(key);
        }
      };
      return { onKeyDown, onKeyUp };
    };
    this.listeners = ["Control", "Shift", "c"].flatMap(listenKey);
    this.detectedColor = null;
  }

  onAtivar() {
    this.listeners.forEach((keyListeners) => {
      window.addEventListener("keydown", keyListeners.onKeyDown);
      window.addEventListener("keyup", keyListeners.onKeyUp);
    });
  }

  onDesativar() {
    this.listeners.forEach((keyListeners) => {
      window.removeEventListener("keydown", keyListeners.onKeyDown);
      window.removeEventListener("keyup", keyListeners.onKeyUp);
    });
  }

  /** @param {MouseEvent} evento*/
  onMouseDown(evento) {
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

    const hexColor = rgbToHex(color);

    if (this.pressedKeys.has("Shift")) {
      definirCorBorda(color);
      const bordaInput =
        /** @type {HTMLInputElement} */
        (document.getElementById("cor-borda"));
      bordaInput.value = hexColor;
    } else {
      definirCorPreenchimento(color);
      const preenchimentoInput =
        /** @type {HTMLInputElement} */
        (document.getElementById("cor-preenchimento"));
      preenchimentoInput.value = hexColor;
    }
  }
}

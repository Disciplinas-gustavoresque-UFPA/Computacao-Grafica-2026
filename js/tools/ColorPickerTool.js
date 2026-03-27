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
    this.shiftPressed = false;

    this.onShiftDown = (/** @type {KeyboardEvent} */ event) => {
      if (event.key === "Shift") {
        this.shiftPressed = true;
      }
    };

    this.onShiftUp = (/** @type {KeyboardEvent} */ event) => {
      if (event.key === "Shift") {
        this.shiftPressed = false;
      }
    };
  }

  onAtivar() {
    window.addEventListener("keydown", this.onShiftDown);
    window.addEventListener("keyup", this.onShiftUp);
  }

  onDesativar() {
    window.removeEventListener("keydown", this.onShiftDown);
    window.removeEventListener("keyup", this.onShiftUp);
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

    if (this.shiftPressed) {
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

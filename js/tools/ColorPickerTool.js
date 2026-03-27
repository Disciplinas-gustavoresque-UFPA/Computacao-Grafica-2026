import { definirCorPreenchimento } from "../core/StateManager.js";
import { rgbToHex } from "../utils/colorHelpers.js";
import { obterCoordenadaSVG } from "../utils/svgHelpers.js";
import { ToolBase } from "./ToolBase.js";

export class ColorPickerTool extends ToolBase {
  /** @param {SVGSVGElement} svgCanvas */
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
  }

  /** @param {MouseEvent} evento*/
  onMouseDown(evento) {
    const elemento = document.elementFromPoint(evento.x, evento.y);
    if (!(elemento instanceof SVGGeometryElement)) return;
    const point = obterCoordenadaSVG(evento, this.svgCanvas);
    const isInStroke = elemento.isPointInStroke(point);
    const style = window.getComputedStyle(elemento);
    const color =
      isInStroke && style.stroke !== "none" ? style.stroke : style.fill;
    definirCorPreenchimento(color);

    const corInput =
      /** @type {HTMLInputElement} */
      (document.getElementById("cor-preenchimento"));
    corInput.value = rgbToHex(color);
  }
}

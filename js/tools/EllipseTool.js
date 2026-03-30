import { ToolBase } from "./ToolBase";
import { criarElementoSVG, obterCoordenadaSVG } from "../utils/svgHelpers.js";

export class EllipseTool extends ToolBase {
    constructor(svgCanvas) {
        super()
        this.svgCanvas = svgCanvas
        this.isDrawing = false
        this.startX = 0
        this.startY = 0
        this.ellipseElement = null
    }

    onMouseDown(evento) {
        this.isDrawing = true

        const cd = obterCoordenadaSVG(evento, this.svgCanvas);
        this.startX = cd.x;
        this.startY = cd.y;

        this.ellipseElement = criarElementoSVG('ellipse', {
            cx: this.startX,
            cy: this.startY,
            rx: 0,
            ry: 0,
            fill: 'transparent',
            stroke: 'black',
            'stroke-width': 2
        });

        this.svgCanvas.appendChild(this.ellipseElement);
    }

    onMouseMove(evento) {
        if (!this.isDrawing || !this.ellipseElement) return;

        const cd = obterCoordenadaSVG(evento, this.svgCanvas);
        const currentX = cd.x;
        const currentY = cd.y;
    }
}
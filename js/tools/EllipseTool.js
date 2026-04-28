import { ToolBase } from "./ToolBase.js";
import { criarElementoSVG, obterCoordenadaSVG } from "../utils/svgHelpers.js";
import { estado } from "../core/StateManager.js";

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
            fill: estado.corPreenchimento,
            stroke: estado.corBorda,
            'stroke-width': 2
        });

        this.svgCanvas.appendChild(this.ellipseElement);
    }

    onMouseMove(evento) {
        if (!this.isDrawing || !this.ellipseElement) return;

        const cd = obterCoordenadaSVG(evento, this.svgCanvas);
        const currentX = cd.x;
        const currentY = cd.y;

        const cx = (this.startX + currentX) / 2;
        const cy = (this.startY + currentY) / 2;
        const rx = Math.abs(this.startX - currentX) / 2;
        const ry = Math.abs(this.startY - currentY) / 2;

        this.ellipseElement.setAttribute('cx', cx);
        this.ellipseElement.setAttribute('cy', cy);
        this.ellipseElement.setAttribute('rx', rx);
        this.ellipseElement.setAttribute('ry', ry);
    }

    onMouseUp(evento) {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ellipseElement = null
        }
    }

    onDesativar() {
        // Se a ferramenta for desativada durante um desenho em andamento,
        // removemos a elipse parcial e resetamos o estado interno.
        if (this.isDrawing && this.ellipseElement) {
            const parent = this.ellipseElement.parentNode;
            if (parent) {
                parent.removeChild(this.ellipseElement);
            }
        }
        this.isDrawing = false;
        this.ellipseElement = null;
        this.startX = 0;
        this.startY = 0;
    }
}
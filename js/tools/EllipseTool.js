import { ToolBase } from "./ToolBase";

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
        const cd = obterCoordenadaSVG(evento, this.svgCanvas);
        this.startX = cd.x;
        this.startY = cd.y;
    }
}
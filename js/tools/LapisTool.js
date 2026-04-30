import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

export class Lapis extends ToolBase {
    constructor(svgCanvas){
        super();
        this.svgCanvas = svgCanvas; 
        this.isDrawing = false;
        this.path = null;
        this.d = "";
        this.ultimoPonto = null;
        this.penultimoPonto = null;
    }

    onMouseDown(evento) {
       this.isDrawing = true;
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);

        this.ultimoPonto = pt;
        this.penultimoPonto = null;
        this.d = `M ${pt.x} ${pt.y}`;

        this.path = criarElementoSVG("path", {
            d: this.d,
            stroke: estado?.corBorda || "black",
            "stroke-width": 2,
            fill: "none",
            "stroke-linecap": "round",
            "stroke-linejoin": "round"
        });
    
        this.svgCanvas.appendChild(this.path);
    }

    onMouseMove(evento){
        if (!this.isDrawing) return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        this.penultimoPonto = this.ultimoPonto;
        this.ultimoPonto = pt;
        if (!this.penultimoPonto) return;

        const p1 = this.penultimoPonto;
        const p2 = this.ultimoPonto;

        // Usa média do ponto inicial e final como ponto de controle
        const px = (p1.x + p2.x)/2;
        const py = (p1.y + p2.y)/2;

        // Curva de Bezier quadrática: vai de p1 até px "puxando" pra p2 
        this.d += ` Q ${p1.x} ${p1.y} ${px} ${py}`;
        this.path.setAttribute("d", this.d);
    }

    onMouseUp() {
        this.isDrawing = false;
        this.path = null;
        this.d = "";
        this.ultimoPonto = null;
        this.penultimoPonto = null;
    }
}
import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import {
    estado,
    registrarAcaoHistorico
} from '../core/StateManager.js';

/**
 * Ferramenta responsável por desenhar polígonos regulares.
 */
export class PoligonoRegularTool extends ToolBase {

    constructor(svgCanvas) {
        super();

        this.svgCanvas = svgCanvas;

        this.isDrawing = false;

        this.startX = 0;
        this.startY = 0;

        this.poligonoElement = null;
    }

    onMouseDown(evento) {

        this.isDrawing = true;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);

        this.startX = pt.x;
        this.startY = pt.y;

        this.poligonoElement = criarElementoSVG('polygon', {

            x: this.startX,
            y: this.startY,

            width: 0,
            height: 0,

            fill: estado.corPreenchimento,
            'fill-opacity': estado.opacidadePreenchimento || '1',
            stroke: estado.corBorda,
            'stroke-opacity': estado.opacidadeBorda || '1',
            'stroke-width': 2,

            'data-shape': 'regular-polygon',
            'data-lados': estado.numeroLados

        });

        this.svgCanvas.appendChild(this.poligonoElement);

    }

    onMouseMove(evento) {

        if (!this.isDrawing || !this.poligonoElement)
            return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);

        const width = Math.abs(pt.x - this.startX);
        const height = Math.abs(pt.y - this.startY);

        const novoX = pt.x < this.startX ? pt.x : this.startX;
        const novoY = pt.y < this.startY ? pt.y : this.startY;

        this.poligonoElement.setAttribute("x", novoX);
        this.poligonoElement.setAttribute("y", novoY);

        this.poligonoElement.setAttribute("width", width);
        this.poligonoElement.setAttribute("height", height);

        this.atualizarVertices();

    }

    atualizarVertices() {

        const x = parseFloat(this.poligonoElement.getAttribute("x"));
        const y = parseFloat(this.poligonoElement.getAttribute("y"));

        const width = parseFloat(this.poligonoElement.getAttribute("width"));
        const height = parseFloat(this.poligonoElement.getAttribute("height"));

        const lados = Math.max(
            3,
            parseInt(this.poligonoElement.getAttribute("data-lados"))
        );

        const cx = x + width / 2;
        const cy = y + height / 2;

        const rx = width / 2;
        const ry = height / 2;

        const pontos = [];

        for (let i = 0; i < lados; i++) {

            const angulo =
                (-Math.PI / 2) +
                i * ((2 * Math.PI) / lados);

            const px = cx + rx * Math.cos(angulo);
            const py = cy + ry * Math.sin(angulo);

            pontos.push(`${px},${py}`);

        }

        this.poligonoElement.setAttribute(
            "points",
            pontos.join(" ")
        );

    }

    onMouseUp() {

        this.isDrawing = false;

        this.poligonoElement = null;

        registrarAcaoHistorico();

    }

    onDesativar() {

        if (this.isDrawing && this.poligonoElement) {

            this.poligonoElement.remove();

            this.isDrawing = false;
            this.poligonoElement = null;

        }

    }

}
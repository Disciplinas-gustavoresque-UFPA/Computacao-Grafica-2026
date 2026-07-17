import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado, registrarAcaoHistorico } from '../core/StateManager.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export class StarTool extends ToolBase {
    constructor(svgCanvas) {
        super();

        this.svgCanvas = svgCanvas;

        this.isDrawing = false;
        this.estrela = null;
        this.pontoInicial = null;
    }

    onMouseDown(evento) {
        this.isDrawing = true;

        this.pontoInicial = obterCoordenadaSVG(evento, this.svgCanvas);

        this.estrela = document.createElementNS(SVG_NS, 'polygon');

        this.estrela.dataset.shape = 'estrela';

        this.estrela.setAttribute('fill', estado.corPreenchimento || 'none');
        this.estrela.setAttribute('stroke', estado.corBorda || 'black');
        this.estrela.setAttribute('stroke-width', estado.espessuraLinha || 2);

        this.svgCanvas.appendChild(this.estrela);
    }

    onMouseMove(evento) {
        if (!this.isDrawing || !this.estrela) return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);

        const dx = pt.x - this.pontoInicial.x;
        const dy = pt.y - this.pontoInicial.y;

        const raioExterno = Math.sqrt(dx * dx + dy * dy);
        const raioInterno = raioExterno * 0.45;

        const pontos = [];

        for (let i = 0; i < 10; i++) {

            const angulo = (-Math.PI / 2) + i * Math.PI / 5;

            const raio = (i % 2 === 0)
                ? raioExterno
                : raioInterno;

            const x = this.pontoInicial.x + Math.cos(angulo) * raio;
            const y = this.pontoInicial.y + Math.sin(angulo) * raio;

            pontos.push(`${x},${y}`);
        }

        this.estrela.setAttribute('points', pontos.join(' '));
    }

    onMouseUp() {
        if (!this.isDrawing) return;

        this.isDrawing = false;
        this.estrela = null;
        this.pontoInicial = null;

        registrarAcaoHistorico();
    }
}
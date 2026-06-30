import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * PincelTool — Pincel com espessura dinâmica baseada na velocidade do mouse.
 *
 * Devagar → traço fino.
 * Rápido  → traço grosso.
 *
 * Cada segmento é um <line> independente com stroke-width calculado
 * a partir da velocidade instantânea, resultando em traços com
 * espessura variável ao longo do caminho.
 */
export class PincelTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas      = svgCanvas;
        this.isDrawing      = false;
        this.ultimoPonto    = null;
        this.ultimoTempo    = null;
        this.grupo          = null;

        // Limites de espessura (px no espaço SVG)
        this.espessuraMin   = 1;
        this.espessuraMax   = 30;

        // Velocidade (px/ms) que atinge a espessura máxima
        this.velocidadeRef  = 2.5;

        // Suavização da transição (0 = brusco, 1 = sem variação)
        this.suavizacao     = 0.3;
        this.espessuraAtual = this.espessuraMin;
    }

    onMouseDown(evento) {
        this.isDrawing      = true;
        const pt            = obterCoordenadaSVG(evento, this.svgCanvas);
        this.ultimoPonto    = pt;
        this.ultimoTempo    = performance.now();
        this.espessuraAtual = this.espessuraMin;

        // Agrupa todos os segmentos do traço em um único <g>
        this.grupo = document.createElementNS(SVG_NS, 'g');
        this.grupo.setAttribute('stroke-linecap', 'round');
        this.svgCanvas.appendChild(this.grupo);
    }

    onMouseMove(evento) {
        if (!this.isDrawing || !this.ultimoPonto) return;

        const pt    = obterCoordenadaSVG(evento, this.svgCanvas);
        const agora = performance.now();
        const dt    = agora - this.ultimoTempo;

        if (dt < 1) return;

        // Velocidade instantânea (px/ms)
        const dx         = pt.x - this.ultimoPonto.x;
        const dy         = pt.y - this.ultimoPonto.y;
        const distancia  = Math.sqrt(dx * dx + dy * dy);
        const velocidade = distancia / dt;

        // Rápido → grosso, devagar → fino
        const t     = Math.min(velocidade / this.velocidadeRef, 1);
        const alvo  = this.espessuraMin + t * (this.espessuraMax - this.espessuraMin);

        // Suaviza a transição
        this.espessuraAtual =
            this.espessuraAtual * (1 - this.suavizacao) +
            alvo * this.suavizacao;

        const segmento = document.createElementNS(SVG_NS, 'line');
        segmento.setAttribute('x1', this.ultimoPonto.x);
        segmento.setAttribute('y1', this.ultimoPonto.y);
        segmento.setAttribute('x2', pt.x);
        segmento.setAttribute('y2', pt.y);
        segmento.setAttribute('stroke', estado?.corBorda || 'black');
        segmento.setAttribute('stroke-width', this.espessuraAtual.toFixed(2));
        this.grupo.appendChild(segmento);

        this.ultimoPonto = pt;
        this.ultimoTempo = agora;
    }

    onMouseUp() {
        this.isDrawing      = false;
        this.ultimoPonto    = null;
        this.ultimoTempo    = null;
        this.grupo          = null;
        this.espessuraAtual = this.espessuraMin;
    }
}

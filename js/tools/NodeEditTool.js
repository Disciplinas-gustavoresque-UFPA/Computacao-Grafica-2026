import { ToolBase } from './ToolBase.js';
import { estado } from '../core/StateManager.js';
import { obterCoordenadaSVG, criarElementoSVG } from '../utils/svgHelpers.js';

/**
 * NodeEditTool
 * Ferramenta para edição de vértices (nós) de elementos vetoriais.
 */
export class NodeEditTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;
        this.elementoAlvo = null;
        this.grupoOverlay = null;
    }

    /**
     * Executado ao selecionar a ferramenta na barra lateral.
     */
    onAtivar() {
        // Verifica se há algo selecionado no estado global
        this.elementoAlvo = estado.elementoSelecionado;
        
        if (this.elementoAlvo) {
            console.log("Editando vértices de:", this.elementoAlvo.tagName);
            this.inicializarOverlay();
            this.identificarVertices();
        } else {
            console.warn("Nenhum elemento selecionado para edição de vértices.");
        }
    }

    /**
     * Cria um grupo SVG para conter as alças de manipulação (Issue #9).
     */
    inicializarOverlay() {
        this.grupoOverlay = criarElementoSVG('g', {
            'id': 'overlay-nodes',
            'style': 'pointer-events: all;' 
        });
        this.svgCanvas.appendChild(this.grupoOverlay);
    }

    /**
     * Lógica inicial para identificar os pontos estruturais.
     * Focaremos inicialmente em elementos do tipo 'rect'.
     */
    identificarVertices() {
        if (this.elementoAlvo.tagName === 'rect') {
            const x = parseFloat(this.elementoAlvo.getAttribute('x'));
            const y = parseFloat(this.elementoAlvo.getAttribute('y'));
            const w = parseFloat(this.elementoAlvo.getAttribute('width'));
            const h = parseFloat(this.elementoAlvo.getAttribute('height'));

            // Define os 4 cantos do retângulo
            const vertices = [
                { x: x, y: y, tipo: 'superior-esquerdo' },
                { x: x + w, y: y, tipo: 'superior-direito' },
                { x: x + w, y: y + h, tipo: 'inferior-direito' },
                { x: x, y: y + h, tipo: 'inferior-esquerdo' }
            ];

            console.log("Vértices identificados:", vertices);
            return vertices;
        }
        return [];
    }

    /**
     * Limpa os elementos de interface ao trocar de ferramenta.
     */
    onDesativar() {
        if (this.grupoOverlay) {
            this.grupoOverlay.remove();
            this.grupoOverlay = null;
        }
        this.elementoAlvo = null;
    }
}
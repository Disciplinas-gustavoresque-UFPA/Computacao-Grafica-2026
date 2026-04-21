import { ToolBase } from './ToolBase.js';
import { SelecaoTool } from './SelecaoTool.js';
import { definirElementoSelecionado, estado } from '../core/StateManager.js';
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

        // Estado do arraste
        this.isDraggingNode = false;
        this.activeNodeId = null;
    }

    /**
     * Executado ao clicar em um elemento.
     */
    onMouseDown(evento) {
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        const target = evento.target;

        // Verifica se o clique foi em um handle de nó
        if (this.grupoOverlay && this.grupoOverlay.contains(target)) {
            this.isDraggingNode = true;
            this.activeNodeId = target.getAttribute('data-node-id');
            
            // Impede que o evento selecione outros elementos abaixo
            evento.stopPropagation();
            console.log("Iniciando arraste do nó:", this.activeNodeId);
            return;
        }
        this.limparSelecao();

        const allowedTags = ['rect'];
        const tag = target.tagName ? target.tagName.toLowerCase() : '';

        // Se o clique não foi no canvas vazio e for um elemento permitido
        if (
            target !== this.svgCanvas &&
            target.parentNode === this.svgCanvas &&
            allowedTags.includes(tag)
        ) {
            // Verifica se há algo selecionado no estado global
            this.elementoAlvo = target;
            // Chama a função definindo o elemento selecionado no gerenciador de estado, o que atualiza a camada visual de seleção.
            definirElementoSelecionado(target);
        }
        
        if (this.elementoAlvo) {
            this.inicializarOverlay();
            this.identificarVertices();
        } 
    }

    // Gerencia o movimento do nó
    onMouseMove(evento) {
        if (!this.isDraggingNode || !this.activeNodeId) return;

        const coordenadas = obterCoordenadaSVG(evento, this.svgCanvas);

        // Por enquanto, apenas movemos visualmente a alça no overlay
        // No próximo passo (Passo 4), conectaremos isso à forma real
        this.atualizarPosicaoHandle(coordenadas);
    }

    //Finaliza o arraste
    onMouseUp() {
        if (this.isDraggingNode) {
            console.log("Arraste finalizado.");
        }
        this.isDraggingNode = false;
        this.activeNodeId = null;
    }

     // Cria um grupo SVG para conter as alças de manipulação (Issue #9).
    inicializarOverlay() {
        this.grupoOverlay = criarElementoSVG('g', {
            'id': 'overlay-nodes',
            'style': 'pointer-events: all;' 
        });
        this.svgCanvas.appendChild(this.grupoOverlay);
    }

    // Identifica os pontos e solicita a renderização.
    identificarVertices() {
        let vertices = [];

        if (this.elementoAlvo.tagName === 'rect') {
            const x = parseFloat(this.elementoAlvo.getAttribute('x'));
            const y = parseFloat(this.elementoAlvo.getAttribute('y'));
            const w = parseFloat(this.elementoAlvo.getAttribute('width'));
            const h = parseFloat(this.elementoAlvo.getAttribute('height'));

            vertices = [
                { x: x, y: y, id: 'top-left' },
                { x: x + w, y: y, id: 'top-right' },
                { x: x + w, y: y + h, id: 'bottom-right' },
                { x: x, y: y + h, id: 'bottom-left' }
            ];
        }

        // Renderiza cada vértice identificado
        vertices.forEach(ponto => this.renderizarHandle(ponto));
    }

    /**
     * Cria a representação visual (alça) de um vértice no overlay.
     * @param {Object} ponto - Coordenadas e ID do ponto.
     */
    renderizarHandle(ponto) {
        const handle = criarElementoSVG('rect', {
            'x': ponto.x - 4, // Centraliza o handle de 8x8 no ponto exato
            'y': ponto.y - 4,
            'width': 8,
            'height': 8,
            'fill': 'white',
            'stroke': '#4a90d9',
            'stroke-width': 1,
            'style': 'cursor: move;',
            'class': 'node-handle',
            'data-node-id': ponto.id
        });

        this.grupoOverlay.appendChild(handle);
    }

     // Limpa os elementos de interface ao trocar de ferramenta.
    onDesativar() {
        this.limparSelecao();
    }

    // Move visualmente o quadradinho azul no overlay
    atualizarPosicaoHandle(coords) {
        const handle = this.grupoOverlay.querySelector(`[data-node-id="${this.activeNodeId}"]`);
        if (handle) {
            handle.setAttribute('x', coords.x - 4);
            handle.setAttribute('y', coords.y - 4);
        }
    }

    limparSelecao() {
        if (this.grupoOverlay) {
            this.grupoOverlay.remove();
            this.grupoOverlay = null;
        }
        this.elementoAlvo = null;
        definirElementoSelecionado(null);
      }
    
}
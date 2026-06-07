import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG, criarElementoSVG } from '../utils/svgHelpers.js';
import { RetanguloShape } from '../shape/RetanguloShape.js';
import { ElipseShape } from '../shape/ElipseShape.js';

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
        this.allowedShapes = {
            'rect': new RetanguloShape(),
            'ellipse': new ElipseShape(),
        }
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
            return;
        }
        this.limparSelecao();
        const tag = target.tagName ? target.tagName.toLowerCase() : '';

        // Se o clique não foi no canvas vazio e for um elemento permitido
        if (
            target !== this.svgCanvas &&
            target.parentNode === this.svgCanvas &&
            Object.keys(this.allowedShapes).includes(tag)
        ) {
            // Verifica se há algo selecionado no estado global
            this.elementoAlvo = target;
        }
        
        if (this.elementoAlvo) {
            this.inicializarOverlay();
            this.allowedShapes[tag].renderizarTodosHandles(this.elementoAlvo, this.grupoOverlay);
        } 
    }

    // Gerencia o movimento do nó
    onMouseMove(evento) {
        if (!this.isDraggingNode || !this.elementoAlvo || !this.activeNodeId) return;

        const coordenadas = obterCoordenadaSVG(evento, this.svgCanvas);

        // No onMouseMove de NodeEditTool.js altere para:
        const tag = this.elementoAlvo.tagName.toLowerCase();
        this.allowedShapes[tag].atualizarPosicaoHandle(coordenadas, this.grupoOverlay);
        this.allowedShapes[tag].atualizarForma(coordenadas, this.elementoAlvo, this.activeNodeId, this.grupoOverlay);
    }

    //Finaliza o arraste
    onMouseUp() {
        this.isDraggingNode = false;
        this.activeNodeId = null;
    }

    // Limpa os elementos de interface ao trocar de ferramenta.
    onDesativar() {
        this.limparSelecao();
    }

     // Cria um grupo SVG para conter as alças de manipulação (Issue #9).
    inicializarOverlay() {
        this.grupoOverlay = criarElementoSVG('g', {
            'id': 'overlay-nodes',
            'style': 'pointer-events: all;' 
        });
        this.svgCanvas.appendChild(this.grupoOverlay);
    }

    limparSelecao() {
        if (this.grupoOverlay) {
            this.grupoOverlay.remove();
            this.grupoOverlay = null;
        }
        this.elementoAlvo = null;
      }
    
}
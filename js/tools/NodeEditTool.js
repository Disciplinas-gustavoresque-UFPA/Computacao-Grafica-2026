import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG, criarElementoSVG } from '../utils/svgHelpers.js';
import { RetanguloShape } from '../shape/RetanguloShape.js';
import { ElipseShape } from '../shape/ElipseShape.js';
import { PoligonoRegularShape } from '../shape/PoligonoRegularShape.js';

/**
 * NodeEditTool
 * Ferramenta para edição de vértices (nós) de elementos vetoriais.
 */
export class NodeEditTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;
        this.elementoAlvo = null;

        // Estado do arraste
        this.isDraggingNode = false;
        this.activeNodeId = null;
        this.allowedShapes = {
            'rect': new RetanguloShape(svgCanvas),
            'ellipse': new ElipseShape(svgCanvas),
            'image': new RetanguloShape(svgCanvas), // Image possui as mesmas propriedades de retangulos
            'polygon': new PoligonoRegularShape(svgCanvas)
        }
    }

    /**
     * Executado ao clicar em um elemento.
     */
    onMouseDown(evento) {
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        const target = evento.target;
        let shape = this.elementoAlvo ? this.allowedShapes[this.elementoAlvo.tagName] : null;

        // Verifica se o clique foi em um handle de nó
        if (shape && shape.grupoOverlay && shape.grupoOverlay.contains(target)) {
            this.isDraggingNode = true;
            this.activeNodeId = target.getAttribute('data-node-id');
            
            // Impede que o evento selecione outros elementos abaixo
            evento.stopPropagation();
            return;
        }

        this.limparSelecao();
        const tag = target.tagName ? target.tagName.toLowerCase() : '';
        let newShape = this.allowedShapes[tag];

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
            newShape.inicializarOverlay();
            newShape.renderizarTodosHandles(this.elementoAlvo);
        } 
    }

    // Gerencia o movimento do nó
    onMouseMove(evento) {
        if (!this.isDraggingNode || !this.elementoAlvo || !this.activeNodeId) return;

        const coordenadas = obterCoordenadaSVG(evento, this.svgCanvas);

        // No onMouseMove de NodeEditTool.js altere para:
        const tag = this.elementoAlvo.tagName.toLowerCase();
        const shape = this.allowedShapes[tag];
        shape.atualizarPosicaoHandle(coordenadas);
        shape.atualizarForma(coordenadas, this.elementoAlvo, this.activeNodeId);
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

    limparSelecao() {
        const tag = this.elementoAlvo ? this.elementoAlvo.tagName : '';
        if (tag) this.allowedShapes[tag].removeOverlay();
        this.elementoAlvo = null;
      }
    
}
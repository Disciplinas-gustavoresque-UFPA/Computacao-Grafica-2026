import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { RetanguloShape } from '../shape/RetanguloShape.js';
import { ElipseShape } from '../shape/ElipseShape.js';
import { LinhaCurvadaShape } from '../shape/LinhaCurvadaShape.js';
import { PoligonoRegularShape } from '../shape/PoligonoRegularShape.js';
import { LosangoShape } from '../shape/LosangoShape.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';

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
            'linhaCurvada': new LinhaCurvadaShape(svgCanvas),
            'losango': new LosangoShape(svgCanvas),
            'poligonoRegular': new PoligonoRegularShape(svgCanvas)
        }
    }

    obterTipoEditavel(elemento) {
        if (!elemento || !elemento.tagName) return null;

        const tag = elemento.tagName.toLowerCase();

        if (tag === 'path') {
            return elemento.dataset && elemento.dataset.tipoLinha === 'linhaCurvada'
                ? 'linhaCurvada'
                : null;
        }

        if (tag === 'polygon') {

            if (elemento.dataset.shape === 'losango') {
                return 'losango';
            }

            if (elemento.dataset.shape === 'regular-polygon') {
                return 'poligonoRegular';
            }

            return null;
        }

        return Object.prototype.hasOwnProperty.call(this.allowedShapes, tag) ? tag : null;
    }

    /**
     * Executado ao clicar em um elemento.
     */
    onMouseDown(evento) {
        const target = evento.target;
        const tipoAtual = this.elementoAlvo ? this.obterTipoEditavel(this.elementoAlvo) : null;
        let shape = tipoAtual ? this.allowedShapes[tipoAtual] : null;

        // Verifica se o clique foi em um handle de nó
        if (shape && shape.grupoOverlay && shape.grupoOverlay.contains(target)) {
            this.isDraggingNode = true;
            this.activeNodeId = target.getAttribute('data-node-id');
            shape.activeNodeId = this.activeNodeId;
            
            // Impede que o evento selecione outros elementos abaixo
            evento.stopPropagation();
            return;
        }

        this.limparSelecao();
        const tipo = this.obterTipoEditavel(target);
        let newShape = tipo ? this.allowedShapes[tipo] : null;

        // Se o clique não foi no canvas vazio e for um elemento permitido
        if (
            target !== this.svgCanvas &&
            target.parentNode === this.svgCanvas &&
            tipo
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

        const tipo = this.obterTipoEditavel(this.elementoAlvo);
        const shape = this.allowedShapes[tipo];
        shape.activeNodeId = this.activeNodeId;
        shape.atualizarPosicaoHandle(coordenadas);
        shape.atualizarForma(coordenadas, this.elementoAlvo, this.activeNodeId);
    }

    //Finaliza o arraste e salva o estado da edição (Memento) via HistoryManager
    onMouseUp() {
        const estavaEditandoNo = this.isDraggingNode;

        this.isDraggingNode = false;
        this.activeNodeId = null;

        if (estavaEditandoNo) {
            registrarAcaoHistorico();
        }
    }

    // Limpa os elementos de interface ao trocar de ferramenta.
    onDesativar() {
        this.limparSelecao();
    }

    limparSelecao() {
        const tipo = this.elementoAlvo ? this.obterTipoEditavel(this.elementoAlvo) : null;
        if (tipo) this.allowedShapes[tipo].removeOverlay();
        this.elementoAlvo = null;
      }
    
}
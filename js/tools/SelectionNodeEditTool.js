import { ToolBase } from './ToolBase.js';
import { SelecaoTool } from './SelecaoTool.js';
import { NodeEditTool } from './NodeEditTool.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado, atualizarPosicaoSelecaoVisual } from '../core/StateManager.js';


export class SelectionNodeEditTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;

        this.selecaoTool = new SelecaoTool(svgCanvas);
        this.nodeEditTool = new NodeEditTool(svgCanvas);

        this.modoAtual = 'selecao';
        this.isNodeHit = false;
        this.isDragging = false;
        this.mouseDownPos = null;
    }

    onMouseDown(evento) {
        const target = evento.target;
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        this.mouseDownPos = {x: pt.x, y:pt.y};
        this.isDragging = false;

        if (this._isNodeHandle(target)) {
            this.modoAtual = 'nodeEdit';
            this.isNodeHit = true;
            this.nodeEditTool.onMouseDown(evento);
            return;
        }
        this.modoAtual = 'selecao';
        this.isNodeHit = false;
        this.selecaoTool.onMouseDown(evento);
        this._sincronizarOverlayNos();
    }

    onMouseMove(evento) {
        if (this.modoAtual === 'nodeEdit' && this.isNodeHit) {
            this.nodeEditTool.onMouseMove(evento);
            atualizarPosicaoSelecaoVisual();
            return;
        }

        if (this.modoAtual === 'selecao') {
            if (this.mouseDownPos && !this.isDragging) {
                const pt = obterCoordenadaSVG(evento, this.svgCanvas)
                const dx = pt.x - this.mouseDownPos.x;
                const dy = pt.y - this.mouseDownPos.y;
                if (Math.sqrt(dx*dx + dy*dy) > 3)
                    this.isDragging = true;
            }

            this.selecaoTool.onMouseMove(evento);

            if (this.nodeEditTool.elementoAlvo) {
                const tag = this.nodeEditTool.elementoAlvo.tagName.toLowerCase();
                const shape = this.nodeEditTool.allowedShapes[tag];
                // Atualiza os handles para acompanhar a movimentação do objeto
                if (shape) {
                    shape.sincronizarTodosOsHandles(this.nodeEditTool.elementoAlvo);
                }
            }
        }
    }

    onMouseUp(evento) {
        if (this.modoAtual === 'nodeEdit' && this.isNodeHit) {
            this.nodeEditTool.onMouseUp(evento);
            this.isNodeHit = false;
            this.modoAtual = 'selecao';
            return;
        }

        if (this.modoAtual === 'selecao') {
            this.selecaoTool.onMouseUp(evento);
            this.isDragging = false;
            this.mouseDownPos = null;
        }
    }

    onKeyDown(evento) {
        this.selecaoTool.onKeyDown(evento);
    }

    onDesativar() {
        this.limparSelecao();
        this.isNodeHit = false;
        this.modoAtual = 'selecao';
        this.isDragging = false;
        this.mouseDownPos = null;

        this.selecaoTool.onDesativar?.();
        this.nodeEditTool.onDesativar?.();
    }

    limparSelecao() {
        this.selecaoTool.limparSelecao();
        this.nodeEditTool.limparSelecao();
    }

    /**
     * Lida com o overlay de edição com nós
     * @private
     */
    _sincronizarOverlayNos() {
        const selecionados = estado.elementosSelecionados;
        // Garante que edição dos nós só ocorre quando um elemento é selecionado
        const elementoUnico = selecionados.length === 1 ? selecionados[0] : null;
        if (!elementoUnico) {
            if (this.nodeEditTool.elementoAlvo) {
                this.nodeEditTool.limparSelecao();
            }
            return;
        }

        const tag = elementoUnico.tagName.toLocaleLowerCase();
        const shapeSuportada = this.nodeEditTool.allowedShapes[tag] || null;
        if (!shapeSuportada) {
            if (this.nodeEditTool.elementoAlvo) {
                this.nodeEditTool.limparSelecao();
            }
            return;
        }
        // Não houve mudanças
        if (this.nodeEditTool.elementoAlvo === elementoUnico) {
            return;
        }
        // Troca de alvo
        if (this.nodeEditTool.elementoAlvo) {
            this.nodeEditTool.limparSelecao();
        }
        this.nodeEditTool.elementoAlvo = elementoUnico;
        shapeSuportada.inicializarOverlay();
        shapeSuportada.renderizarTodosHandles(elementoUnico);
    }

    /**
     * Checa se o elemento selecionado é de um nó
     * @private
     */
    _isNodeHandle(target) {
        let current = target;
        while (current && current != this.svgCanvas) {
            if (current.hasAttribute && current.hasAttribute('data-node-id')) {
                return true;
            }
            current = current.parentNode;
        }
        return false;
    }
}
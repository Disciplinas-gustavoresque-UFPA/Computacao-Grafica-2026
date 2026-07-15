/**
 * NodeEditTool
 * Ferramenta para edição de vértices (nós) de elementos vetoriais.
 * Possui 2 modos: Edição de Grupo (arrastar tudo) e Edição de Vértice (pontos).
 */

import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { RetanguloShape } from '../shape/RetanguloShape.js';
import { ElipseShape } from '../shape/ElipseShape.js';
import { LinhaCurvadaShape } from '../shape/LinhaCurvadaShape.js';
import { LosangoShape } from '../shape/LosangoShape.js';
import { registrarAcaoHistorico, definirElementosSelecionados } from '../core/StateManager.js';

import { PathShape } from '../shape/PathShape.js';
import { LinhaShape } from '../shape/LinhaShape.js';

export class NodeEditTool extends ToolBase {
    // Agora recebemos a selecaoVisual para podermos usar o bounding box de redimensionamento
    constructor(svgCanvas, selecaoVisual) {
        super();
        this.svgCanvas = svgCanvas;
        this.selecaoVisual = selecaoVisual; 
        
        this.elementoAlvo = null;
        this.modo = 'grupo'; // 'grupo' ou 'vertice'
        this.grupoAlvo = null;

        // Estado do arraste de nós (Vértices)
        this.isDraggingNode = false;
        this.activeNodeId = null;

        this.allowedShapes = {
            'rect': new RetanguloShape(svgCanvas),
            'ellipse': new ElipseShape(svgCanvas),
            'image': new RetanguloShape(svgCanvas),
            'linhaCurvada': new LinhaCurvadaShape(svgCanvas),
            'losango': new LosangoShape(svgCanvas),
            'path': new PathShape(svgCanvas),
            'line': new LinhaShape(svgCanvas)
        }
    }

    obterTipoEditavel(elemento) {
        if (!elemento || !elemento.tagName) return null;
        const tag = elemento.tagName.toLowerCase();

        if (tag === 'path') {
            return elemento.dataset && elemento.dataset.tipoLinha === 'linhaCurvada'
                ? 'linhaCurvada' : 'path'; 
        }

        if (tag === 'polygon') {
            return elemento.dataset && elemento.dataset.shape === 'losango'
                ? 'losango' : null;
        }

        if (tag === 'line') return 'line';

        return Object.prototype.hasOwnProperty.call(this.allowedShapes, tag) ? tag : null;
    }

    obterGrupoPai(elemento) {
        let atual = elemento;
        let grupo = null;
        while (atual && atual !== this.svgCanvas) {
            if (atual.tagName.toLowerCase() === 'g') {
                grupo = atual;
            }
            atual = atual.parentNode;
        }
        return grupo;
    }

    onMouseDown(evento) {
        const target = evento.target;

        // 1. MODO GRUPO: Verifica se o clique foi em um dos pontos de redimensionamento do SelecaoVisual
        if (this.modo === 'grupo' && this.selecaoVisual && this.selecaoVisual.isHandle(target)) {
            // Delega o inicio do redimensionamento para a classe Selecao
            this.selecaoVisual.onMouseDown(evento);
            return;
        }

        const tipoAtual = this.elementoAlvo ? this.obterTipoEditavel(this.elementoAlvo) : null;
        let shape = tipoAtual ? this.allowedShapes[tipoAtual] : null;

        // 2. MODO VÉRTICE: Verifica se clicou em uma alça (handle) de vértice
        if (this.modo === 'vertice' && shape && shape.grupoOverlay && shape.grupoOverlay.contains(target)) {
            this.isDraggingNode = true;
            this.activeNodeId = target.getAttribute('data-node-id');
            shape.activeNodeId = this.activeNodeId;
            evento.stopPropagation();
            return;
        }

        // 3. Limpa seleções anteriores se não clicou em handles
        this.limparSelecao();
        
        if (target === this.svgCanvas) {
            this.modo = 'grupo';
            return;
        }

        // 4. Verifica se o elemento clicado pertence a um grupo
        const grupoClicado = this.obterGrupoPai(target);

        if (grupoClicado) {
            if (this.modo === 'grupo' || this.grupoAlvo !== grupoClicado) {
                this.modo = 'grupo';
                this.grupoAlvo = grupoClicado;
                
                // Define o grupo no estado e desenha a caixa de seleção com redimensionamento
                definirElementosSelecionados([this.grupoAlvo]);
                if (this.selecaoVisual) {
                    this.selecaoVisual.desenharCaixaSelecao([this.grupoAlvo]);
                    // Permite que o usuário arraste o grupo clicando dentro da bounding box
                    this.selecaoVisual.onMouseDown(evento); 
                }
                return;
            }
        }

        // 5. Elemento solto ou já estamos em modo vértice
        const tipo = this.obterTipoEditavel(target);
        if (this.svgCanvas.contains(target) && tipo) {
            this.elementoAlvo = target;
            let newShape = this.allowedShapes[tipo];
            newShape.inicializarOverlay();
            newShape.renderizarTodosHandles(this.elementoAlvo);
        }
    }

    onMouseMove(evento) {
        // Delega o arraste/redimensionamento global para a Seleção Visual
        if (this.modo === 'grupo' && this.selecaoVisual && this.selecaoVisual.isDragging) {
            this.selecaoVisual.onMouseMove(evento);
            return;
        }

        // Processa o arraste dos vértices
        if (this.modo === 'vertice' && this.isDraggingNode && this.elementoAlvo && this.activeNodeId) {
            const coordenadas = obterCoordenadaSVG(evento, this.svgCanvas);
            const tipo = this.obterTipoEditavel(this.elementoAlvo);
            const shape = this.allowedShapes[tipo];
            shape.activeNodeId = this.activeNodeId;
            shape.atualizarPosicaoHandle(coordenadas);
            shape.atualizarForma(coordenadas, this.elementoAlvo, this.activeNodeId);
        }
    }

    onMouseUp(evento) {
        if (this.modo === 'grupo' && this.selecaoVisual) {
            this.selecaoVisual.onMouseUp(evento);
        }

        if (this.isDraggingNode) {
            registrarAcaoHistorico();
        }

        this.isDraggingNode = false;
        this.activeNodeId = null;
    }

    onDoubleClick(evento) {
        const target = evento.target;
        const grupo = this.obterGrupoPai(target);

        if (this.modo === 'grupo' && this.grupoAlvo && grupo === this.grupoAlvo) {
            // Entrar no modo de vértices
            this.modo = 'vertice'; 
            
            // Ocultar a caixa de redimensionamento global
            if (this.selecaoVisual) {
                this.selecaoVisual.ocultar();
                definirElementosSelecionados([]); // Tira do estado de seleção global para evitar conflitos
            }

            const tipo = this.obterTipoEditavel(target);
            if (tipo) {
                this.elementoAlvo = target;
                let newShape = this.allowedShapes[tipo];
                newShape.inicializarOverlay();
                newShape.renderizarTodosHandles(this.elementoAlvo);
            }
        }
    }

    onDesativar() {
        this.limparSelecao();
        this.modo = 'grupo';
    }

    limparSelecao() {
        // Limpa os vértices
        const tipo = this.elementoAlvo ? this.obterTipoEditavel(this.elementoAlvo) : null;
        if (tipo) this.allowedShapes[tipo].removeOverlay();
        
        // Limpa a caixa de seleção global
        if (this.selecaoVisual) {
            this.selecaoVisual.ocultar();
        }

        this.elementoAlvo = null;
        this.grupoAlvo = null;
    }
}
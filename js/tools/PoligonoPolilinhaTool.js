import { ToolBase } from "./ToolBase.js";
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

export class PoligonoPolilinhaTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;
        this.vertices = []; // Armazena objetos {x, y}
        this.polylineElement = null; // Elemento aberto usado DURANTE o desenho
        this.onKeyDownBound = this.onKeyDown.bind(this); // Bind necessário para remover o listener corretamente depois
    }

    /**
    * Ativa a ferramenta e começa a escutar o teclado para o "Enter".
    */
    onAtivar() {
        window.addEventListener('keydown', this.onKeyDownBound);
    }

    /**
    * Desativa a ferramenta, limpa listeners e cancela desenhos inacabados.
    */
    onDesativar() {
        window.removeEventListener('keydown', this.onKeyDownBound);
        this.resetarDesenho();
    }

    /**
    * Cada clique adiciona um novo vértice de forma aberta (polyline).
    */
    onMouseDown(evento) {
        // Captura a coordenada do clique adaptada ao SVG
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        this.vertices.push(pt);

        if (!this.polylineElement) {
            // Cria o elemento polilinha no primeiro clique (não fecha automaticamente)
            this.polylineElement = criarElementoSVG('polyline', {
                points: this.formatarPoints(),
                stroke: estado.corBorda,
                'stroke-width': 2,
                fill: 'transparent' // Mantém transparente enquanto desenha
            });
            this.svgCanvas.appendChild(this.polylineElement);
        } else {
            // Atualiza os pontos com o novo vértice inserido
            this.polylineElement.setAttribute('points', this.formatarPoints());
        }
    }

    /**
    * Mostra uma prévia da linha seguindo o mouse até o próximo clique.
    */
    onMouseMove(evento) {
        if (!this.polylineElement || this.vertices.length === 0) return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        // Cria uma string temporária incluindo a posição atual do mouse sem fechar a forma
        const pontosComMouse = this.formatarPoints() + ` ${pt.x},${pt.y}`;
        this.polylineElement.setAttribute('points', pontosComMouse);
    }

    /**
    * Captura o hotswapping de teclas (Enter para fechar o polígono).
    */
    onKeyDown(evento) {
        if (evento.key === 'Enter') {
            this.finalizarPoligono();
        }
    }

    /**
    * Finaliza a construção se os critérios de validação forem aceitos e converte para polygon.
    */
    finalizarPoligono() {
        // Validação: Um polígono precisa de pelo menos 3 vértices
        if (this.vertices.length < 3) {
            console.warn('Um polígono precisa de pelo menos 3 vértices.');
            this.resetarDesenho();
            return;
        }

        // Remove a polilinha temporária de rascunho do ecrã
        if (this.polylineElement) {
            this.svgCanvas.removeChild(this.polylineElement);
        }

        // Cria o elemento 'polygon' definitivo (une automaticamente o último ponto ao primeiro)
        const poligonoFinal = criarElementoSVG('polygon', {
            points: this.formatarPoints(),
            stroke: estado.corBorda,
            'stroke-width': 2,
            fill: estado.corPreenchimento || 'transparent'
        });

        // Adiciona o polígono finalizado de forma permanente ao SVG
        this.svgCanvas.appendChild(poligonoFinal);

        // Limpa o estado interno para o próximo desenho
        this.polylineElement = null;
        this.vertices = [];
    }

    /**
    * Limpa o estado atual e remove o elemento inacabado do SVG.
    */
    resetarDesenho() {
        if (this.polylineElement) {
            this.svgCanvas.removeChild(this.polylineElement);
        }
        this.polylineElement = null;
        this.vertices = [];
    }

    /**
    * Transforma o array de vértices na string formatada exigida pelo atributo 'points' do SVG.
    * Exemplo: "x1,y1 x2,y2 x3,y3"
    */
    formatarPoints() {
        return this.vertices.map(pt => `${pt.x},${pt.y}`).join(' ');
    }
}
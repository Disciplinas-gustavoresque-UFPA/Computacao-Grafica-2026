import { ToolBase } from "./ToolBase.js";
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';

export class PoligonoPolilinhaTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;
        this.vertices = []; // Armazena objetos {x, y}
        this.polylineElement = null; // Elemento aberto usado DURANTE o desenho
        
        // Binds necessários para gerenciar/remover os listeners corretamente
        this.onKeyDownBound = this.onKeyDown.bind(this);
        this.onDoubleClickBound = this.onDoubleClick.bind(this);
        
        // Raio de tolerância (em pixels) para detectar o clique no primeiro vértice
        this.raioCliqueVerticeInicial = 10; 
    }

    /**
    * Ativa a ferramenta e registra os escutadores de teclado e clique duplo.
    */
    onAtivar() {
        window.addEventListener('keydown', this.onKeyDownBound);
        this.svgCanvas.addEventListener('dblclick', this.onDoubleClickBound);
    }

    /**
    * Desativa a ferramenta e remove todos os listeners para evitar vazamento de memória.
    */
    onDesativar() {
        window.removeEventListener('keydown', this.onKeyDownBound);
        this.svgCanvas.removeEventListener('dblclick', this.onDoubleClickBound);
        this.resetarDesenho();
    }

    /**
    * Cada clique adiciona um novo vértice ou fecha se clicado no ponto inicial.
    */
    onMouseDown(evento) {
        // Ignora cliques que fazem parte de um clique duplo para evitar pontos extras indesejados
        if (evento.detail > 1) return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);

        // SUGESTÃO DO P.O: Fechar ao clicar no vértice inicial
        if (this.vertices.length >= 3 && this.verificarProximidadePontoInicial(pt)) {
            this.finalizarPoligono();
            return;
        }

        this.vertices.push(pt);

        if (!this.polylineElement) {
            // Cria o elemento polilinha aberto no primeiro clique
            this.polylineElement = criarElementoSVG('polyline', {
                points: this.formatarPoints(),
                stroke: estado.corBorda,
                'stroke-width': 2,
                fill: 'transparent'
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
        const pontosComMouse = this.formatarPoints() + ` ${pt.x},${pt.y}`;
        this.polylineElement.setAttribute('points', pontosComMouse);
    }

    /**
    * SUGESTÃO DO P.O: Captura o clique duplo para fechar o polígono.
    */
    onDoubleClick(evento) {
        evento.preventDefault(); // Previne comportamentos padrões de seleção do navegador
        
        // O clique duplo insere um vértice fantasma residual pelo mousedown, removemos ele antes de fechar
        if (this.vertices.length > 0) {
            this.vertices.pop();
        }

        this.finalizarPoligono();
    }

    /**
    * Captura o Enter para fechar o polígono (mantendo o requisito original).
    */
    onKeyDown(evento) {
        if (evento.key === 'Enter') {
            this.finalizarPoligono();
        }
    }

    /**
    * Valida a distância matemática entre o clique atual e o primeiro ponto criado.
    */
    verificarProximidadePontoInicial(pontoAtual) {
        const primeiroPonto = this.vertices[0];
        // Teorema de Pitágoras para calcular a distância entre dois pontos (dx e dy)
        const dx = pontoAtual.x - primeiroPonto.x;
        const dy = pontoAtual.y - primeiroPonto.y;
        const distancia = Math.sqrt(dx * dx + dy * dy);
        
        return distancia <= this.raioCliqueVerticeInicial;
    }

    /**
    * Converte o rascunho temporário (polyline) em um polígono fechado definitivo.
    */
    finalizarPoligono() {
        // Validação: Um polígono precisa de pelo menos 3 vértices
        if (this.vertices.length < 3) {
            console.warn('Um polígono precisa de pelo menos 3 vértices.');
            this.resetarDesenho();
            return;
        }

        // Remove o rascunho do ecrã
        if (this.polylineElement) {
            this.svgCanvas.removeChild(this.polylineElement);
        }

        // Cria o elemento 'polygon' definitivo
        const poligonoFinal = criarElementoSVG('polygon', {
            points: this.formatarPoints(),
            stroke: estado.corBorda,
            'stroke-width': 2,
            'data-shape': 'poligono',
            fill: estado.corPreenchimento || 'transparent'
        });

        this.svgCanvas.appendChild(poligonoFinal);
        registrarAcaoHistorico();
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
    * Transforma o array de vértices na string formatada para o SVG.
    */
    formatarPoints() {
        return this.vertices.map(pt => `${pt.x},${pt.y}`).join(' ');
    }
}
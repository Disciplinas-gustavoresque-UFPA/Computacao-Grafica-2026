import { ToolBase } from "./ToolBase";

export class PoligonoPolilinhaTool extends ToolBase {
    constructor(svgCanvas) {
        super();
        this.svgCanvas = svgCanvas;
        this.vertices = []; // Armazena objetos {x, y}
        this.polygonElement = null;
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
    * Cada clique adiciona um novo vértice ao polígono.
    */
    onMouseDown(evento) {
        // Captura a coordenada do clique adaptada ao SVG
        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        this.vertices.push(pt);

        if (!this.polygonElement) {
        // Cria o elemento polígono no primeiro clique
        this.polygonElement = criarElementoSVG('polygon', {
            points: this.formatarPoints(),
            stroke: estado.corBorda,
            'stroke-width': 2,
            fill: 'transparent' // Permite ver através enquanto desenha
        });
        this.svgCanvas.appendChild(this.polygonElement);
        } else {
        // Atualiza os pontos com o novo vértice inserido
        this.polygonElement.setAttribute('points', this.formatarPoints());
        }
    }

    /**
    * Mostra uma prévia da linha seguindo o mouse até o próximo clique.
    */
    onMouseMove(evento) {
        if (!this.polygonElement || this.vertices.length === 0) return;

        const pt = obterCoordenadaSVG(evento, this.svgCanvas);
        // Cria uma string temporária incluindo a posição atual do mouse
        const pontosComMouse = this.formatarPoints() + ` ${pt.x},${pt.y}`;
        this.polygonElement.setAttribute('points', pontosComMouse);
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
    * Finaliza a construção se os critérios de validação forem aceitos.
    */
    finalizarPoligono() {
        // Validação: Um polígono precisa de pelo menos 3 vértices
        if (this.vertices.length < 3) {
        console.warn('Um polígono precisa de pelo menos 3 vértices.');
        this.resetarDesenho();
        return;
        }

        // Aplica a cor de preenchimento definitiva do estado, se houver
        if (estado.corPreenchimento) {
        this.polygonElement.setAttribute('fill', estado.corPreenchimento);
        }

        // O elemento é mantido no SVG, apenas limpamos a referência da Tool
        this.polygonElement = null;
        this.vertices = [];
    }

    /**
    * Limpa o estado atual e remove o elemento inacabado do SVG.
    */
    resetarDesenho() {
        if (this.polygonElement) {
        this.svgCanvas.removeChild(this.polygonElement);
        }
        this.polygonElement = null;
        this.vertices = [];
    }
}
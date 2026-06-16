import { ToolBase } from "./ToolBase";

export class PoligonoPolilinhaTool extends ToolBase {
    constructor(svgCanvas) {
        super();
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
}
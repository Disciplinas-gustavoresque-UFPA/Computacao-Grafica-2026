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
}
export class MementoSVG {
  #conteudoSVG;

  constructor(htmlContent) {
    this.#conteudoSVG = htmlContent;
  }

  getConteudo() {
    return this.#conteudoSVG;
  }
}
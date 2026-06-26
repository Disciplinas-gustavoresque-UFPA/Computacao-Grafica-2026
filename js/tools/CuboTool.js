export class CuboTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.canvas = svgCanvas;
    this._desenhando = false;
    this._origem = null;       // ponto onde o mousedown ocorreu
    this._grupoPreview = null; // <g> temporário mostrado durante o drag
  }
}
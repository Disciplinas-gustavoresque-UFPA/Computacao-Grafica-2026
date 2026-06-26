export class CuboTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.canvas = svgCanvas;
    this._desenhando = false;
    this._origem = null;       // ponto onde o mousedown ocorreu
    this._grupoPreview = null; // <g> temporário mostrado durante o drag
  }

  onAtivar() {
    this.canvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    this.canvas.style.cursor = 'default';
    this._limparPreview();
  }

  onMouseDown(evento) {
    if (evento.button !== 0) return;
    const { x, y } = this._coordenadasSVG(evento);
    this._desenhando = true;
    this._origem = { x, y };
    this._grupoPreview = this._criarGrupo();
    this.canvas.appendChild(this._grupoPreview);
  }

  onMouseMove(evento) {
    if (!this._desenhando) return;
    const { x, y } = this._coordenadasSVG(evento);
    const tamanho = this._calcularTamanho(this._origem, { x, y });
    this._renderizarCubo(this._grupoPreview, this._origem, tamanho, 0.4);
  }

  onMouseUp(evento) {
    if (!this._desenhando) return;
    const { x, y } = this._coordenadasSVG(evento);
    const tamanho = this._calcularTamanho(this._origem, { x, y });

    this._limparPreview();

    if (tamanho < 10) {
      this._desenhando = false;
      return;
    }

    const grupo = this._criarGrupo();
    this._renderizarCubo(grupo, this._origem, tamanho, 1.0);
    this.canvas.appendChild(grupo);
  }
}
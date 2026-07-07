export class Regua {
  constructor(container, svgCanvas) {
    this.container = container;
    this.svgCanvas = svgCanvas;
    this.ativa = false;

    this._criarElementos();
  }

  _criarElementos() {
    this.horizontal = document.createElement('div');
    this.horizontal.className = 'regua regua-horizontal oculto';

    this.vertical = document.createElement('div');
    this.vertical.className = 'regua regua-vertical oculto';

    this.canto = document.createElement('div');
    this.canto.className = 'regua-canto oculto';

    this.container.appendChild(this.horizontal);
    this.container.appendChild(this.vertical);
    this.container.appendChild(this.canto);
  }
}
export class GridManager {
  constructor(containerPai) {
    this.container = containerPai;
    this.ativo = false;
    
    this.overlay = document.createElement('div');
    this.overlay.id = 'grid-overlay';
    this.container.appendChild(this.overlay);
  }

  alternar() {
    this.ativo = !this.ativo;
    this.overlay.classList.toggle('ativo', this.ativo);
    return this.ativo;
  }
}
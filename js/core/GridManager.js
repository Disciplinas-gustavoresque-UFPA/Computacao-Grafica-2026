export class GridManager {
  constructor(containerPai) {
    this.container = containerPai;
    this.ativo = false;
    this.overlay = document.createElement('div');
    this.overlay.id = 'grid-overlay';
    this.container.appendChild(this.overlay);
    
    this.config = { tipo: 'uniform', tamanho: 50, corHex: '#ff4a4a', opacidade: 0.2 };
    this.aplicarEstilos();
  }

  alternar() {
    this.ativo = !this.ativo;
    this.overlay.classList.toggle('ativo', this.ativo);
    return this.ativo;
  }

  atualizarConfig(chave, valor) {
    if (chave == 'tamanho' && valor < 5) {
      valor = 5;
    }

    if (chave === 'opacidade') {
      if (valor < 0) valor = 0
      if (valor > 1) valor = 1
    }

    this.config[chave] = valor;
    this.aplicarEstilos();
  }

  aplicarEstilos() {
    this.overlay.className = this.ativo ? 'ativo' : '';
    this.overlay.classList.add(`grid-${this.config.tipo}`);

    const hex = this.config.corHex.replace('#', '');
    const rgbaCor = `rgba(${parseInt(hex.substring(0, 2), 16)}, ${parseInt(hex.substring(2, 4), 16)}, ${parseInt(hex.substring(4, 6), 16)}, ${this.config.opacidade})`;
    
    this.overlay.style.setProperty('--cor-grid', rgbaCor);

    if (this.config.tipo === 'uniform') {
      this.overlay.style.backgroundSize = `${this.config.tamanho}px ${this.config.tamanho}px`;
    } else if (this.config.tipo === 'column') {
      this.overlay.style.backgroundSize = `calc(100% / ${this.config.tamanho}) 100%`;
    } else if (this.config.tipo === 'row') {
      this.overlay.style.backgroundSize = `100% calc(100% / ${this.config.tamanho})`;
    }
  }
}
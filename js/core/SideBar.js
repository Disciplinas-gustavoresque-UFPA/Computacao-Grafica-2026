export class SideBar {
  constructor(rootSelector = document) {
    this.root = rootSelector;
    this.botoes = this.root.querySelectorAll('.tab-btn');
    this.conteudos = this.root.querySelectorAll('.tab-content');

    this.init();
  }

  init() {
    this.botoes.forEach(botao => {
      botao.addEventListener('click', () => this.onClick(botao));
    });
  }

  onClick(botao) {
    const alvoId = botao.getAttribute('data-target');

    this.botoes.forEach(b => b.classList.remove('ativo'));
    this.conteudos.forEach(c => c.classList.remove('ativo'));

    botao.classList.add('ativo');

    const painel = this.root.getElementById
      ? this.root.getElementById(alvoId)
      : document.getElementById(alvoId);

    if (painel) {
      painel.classList.add('ativo');
    }
  }
}
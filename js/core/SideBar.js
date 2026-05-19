export class SideBar {
  constructor(rootSelector = document) {
    this.root = rootSelector;
    this.sidebarElement = document.getElementById('barra-configuracoes'); // A barra toda
    this.btnToggle = document.getElementById('btn-toggle-sidebar'); // O botão novo
    this.botoes = this.root.querySelectorAll('.tab-btn');
    this.conteudos = this.root.querySelectorAll('.tab-content');

    this.init();
  }

  init() {
    this.botoes.forEach(botao => {
      botao.addEventListener('click', () => this.onClick(botao));
    });

    if (this.btnToggle && this.sidebarElement) {
      this.btnToggle.addEventListener('click', () => {
        this.sidebarElement.classList.toggle('escondida');
        this.btnToggle.classList.toggle('sidebar-escondida'); // Controla a posição/seta do botão
      });
    }
  }

  onClick(botao) {
    // Proteção essencial caso o elemento não exista no DOM
    if (!this.sidebarElement) return;

    // Se a barra estiver oculta e o usuário clicar em uma aba, reabre automaticamente
    this.sidebarElement.classList.remove('escondida');
    if (this.btnToggle) {
      this.btnToggle.classList.remove('sidebar-escondida');
    }

    const alvoId = botao.getAttribute('data-target');
    this.botoes.forEach(b => b.classList.remove('ativo'));
    this.conteudos.forEach(c => c.classList.remove('ativo'));

    botao.classList.add('ativo');
    const painel = document.getElementById(alvoId);
    if (painel) painel.classList.add('ativo');
  }
}
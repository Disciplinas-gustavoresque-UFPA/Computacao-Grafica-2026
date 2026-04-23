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
    // Evento das abas que você já tinha
    this.botoes.forEach(botao => {
      botao.addEventListener('click', () => this.onClick(botao));
    });

    // Evento para esconder/mostrar
    if (this.btnToggle && this.sidebarElement) {
      this.btnToggle.addEventListener('click', () => {
        this.sidebarElement.classList.toggle('escondida');
      });
    }
  }

  onClick(botao) {
    // Se clicar numa aba e a barra estiver escondida, podemos mostrar ela automaticamente
    this.sidebarElement.classList.remove('escondida');

    const alvoId = botao.getAttribute('data-target');
    this.botoes.forEach(b => b.classList.remove('ativo'));
    this.conteudos.forEach(c => c.classList.remove('ativo'));

    botao.classList.add('ativo');
    const painel = document.getElementById(alvoId);
    if (painel) painel.classList.add('ativo');
  }
}
/**
 * ToolbarGroup.js — Gerencia os grupos de ferramentas da sidebar
 *
 * Responsabilidades:
 * - Abrir e fechar grupos ao clicar nos botões de grupo (btn-grupo)
 * - Garantir que apenas um grupo fique aberto por vez
 * - Marcar o btn-grupo como ativo quando seu grupo estiver aberto
 */

export class ToolbarGroup {
  constructor() {
    this.botoesGrupo = document.querySelectorAll('.btn-grupo');
    this.grupos = document.querySelectorAll('.grupo-ferramentas');
    this.grupoAtivo = null;
    this.init();
  }

  init() {
    this.botoesGrupo.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idGrupo = `grupo-${btn.getAttribute('data-grupo')}`;
        this.toggleGrupo(idGrupo, btn);
      });
    });
  }

  toggleGrupo(idGrupo, btnClicado) {
    const grupoAlvo = document.getElementById(idGrupo);
    if (!grupoAlvo) return;

    const estaAberto = !grupoAlvo.classList.contains('escondido');

    // Fecha todos os grupos e remove ativo de todos os botões
    this.grupos.forEach((g) => g.classList.add('escondido'));
    this.botoesGrupo.forEach((b) => b.classList.remove('ativo'));

    // Se o grupo clicado estava fechado, abre ele
    if (!estaAberto) {
      grupoAlvo.classList.remove('escondido');
      btnClicado.classList.add('ativo');
      this.grupoAtivo = idGrupo;
    } else {
      this.grupoAtivo = null;
    }
  }
}
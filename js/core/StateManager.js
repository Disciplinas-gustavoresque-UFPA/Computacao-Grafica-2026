/**
 * StateManager.js — Gerenciador de Estado Global da aplicação.
 *
 * Centraliza o estado compartilhado entre todos os módulos,
 * evitando variáveis globais soltas e facilitando a depuração.
 *
 * Propriedades do estado:
 *  - ferramentaAtual {ToolBase|null} - Instância da ferramenta de desenho ativa.
 *  - corPreenchimento {string}       - Cor de preenchimento dos elementos (formato hex).
 *  - corBorda {string}               - Cor da borda/stroke dos elementos (formato hex).
 *  - elementoSelecionado {SVGElement|null} - Elemento SVG atualmente selecionado.
 */

/** @type {{ ferramentaAtual: import('../tools/ToolBase.js').ToolBase|null, corPreenchimento: string, corBorda: string, elementoSelecionado: SVGElement|null }} */
export const estado = {
  ferramentaAtual: null,
  corPreenchimento: '#4a90d9',
  corBorda: '#1a1a2e',
  elementoSelecionado: null,
};

let gerenciadorSelecaoVisual = null;

export function definirGerenciadorSelecao(selecao) {
  gerenciadorSelecaoVisual = selecao;
}

export function atualizarPosicaoSelecaoVisual() {
  if (gerenciadorSelecaoVisual && estado.elementoSelecionado) {
    gerenciadorSelecaoVisual.atualizarPosicao(estado.elementoSelecionado);
  }
}

/**
 * Define a ferramenta de desenho ativa.
 * Invoca os métodos de ciclo de vida `onDesativar` na ferramenta anterior
 * e `onAtivar` na nova ferramenta, quando aplicável.
 *
 * @param {import('../tools/ToolBase.js').ToolBase|string|null} ferramenta
 *   Instância de uma ferramenta (ToolBase) ou string identificadora.
 *   Futuras implementações de ferramentas deverão passar a instância;
 *   por ora, aceita string para permitir a seleção via botões da UI.
 */
export function definirFerramenta(ferramenta) {
  const anterior = estado.ferramentaAtual;

  // Notifica a ferramenta anterior antes de trocar
  if (anterior && typeof anterior.onDesativar === 'function') {
    anterior.onDesativar();
  }

  estado.ferramentaAtual = ferramenta;

  // Notifica a nova ferramenta após a troca
  if (ferramenta && typeof ferramenta.onAtivar === 'function') {
    ferramenta.onAtivar();
  }
}

/**
 * Define a cor de preenchimento ativa.
 *
 * @param {string} cor - Cor em formato hexadecimal (ex: '#ff0000').
 */
export function definirCorPreenchimento(cor) {
  estado.corPreenchimento = cor;
}

/**
 * Define a cor da borda/stroke ativa.
 *
 * @param {string} cor - Cor em formato hexadecimal (ex: '#000000').
 */
export function definirCorBorda(cor) {
  estado.corBorda = cor;
}

/**
 * Define o elemento SVG atualmente selecionado.
 *
 * @param {SVGElement|null} elemento - Elemento SVG selecionado ou null para limpar a seleção.
 */
export function definirElementoSelecionado(elemento) {
  estado.elementoSelecionado = elemento;
  if (gerenciadorSelecaoVisual) {
    gerenciadorSelecaoVisual.desenhar(elemento);
  }
}


/**
 * Remove o elemento atualmente selecionado do DOM e limpa a seleção.
 */
export function removerElementoSelecionado() {
  if (estado.elementoSelecionado) {
    // Remove o nó SVG diretamente do DOM
    estado.elementoSelecionado.remove();
    
    // Limpa o estado global e remove a borda de seleção visual
    definirElementoSelecionado(null);
  }
}
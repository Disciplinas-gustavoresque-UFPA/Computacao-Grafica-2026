/**
 * StateManager.js — Gerenciador de Estado Global da aplicação.
 *
 * Centraliza o estado compartilhado entre todos os módulos,
 * evitando variáveis globais soltas e facilitando a depuração.
 *
 * Propriedades do estado:
 * - ferramentaAtual {ToolBase|null} - Instância da ferramenta de desenho ativa.
 * - corPreenchimento {string}       - Cor de preenchimento dos elementos (formato hex).
 * - corBorda {string}               - Cor da borda/stroke dos elementos (formato hex).
 * - elementosSelecionados {SVGElement[]} - Elementos SVG atualmente selecionados.
 * - interfaceAtual {string}         - Flag para sabermos a tela onde o usuário está.
 */

/** @type {{ ferramentaAtual: import('../tools/ToolBase.js').ToolBase|null, corPreenchimento: string, corBorda: string, elementosSelecionados: SVGElement[], interfaceAtual: string, areaPagina: {x: number, y: number, width: number, height: number} }} */
export const estado = {
  ferramentaAtual: null,
  corPreenchimento: '#4a90d9',
  corBorda: '#1a1a2e',
  interfaceAtual: 'inicio',
  elementosSelecionados: [],
  areaPagina: { x: 0, y: 0, width: 800, height: 1131 },
};

let gerenciadorSelecaoVisual = null;

export function definirGerenciadorSelecao(selecao) {
  gerenciadorSelecaoVisual = selecao;
}

export function atualizarPosicaoSelecaoVisual() {
  if (gerenciadorSelecaoVisual && estado.elementosSelecionados.length > 0) {
    gerenciadorSelecaoVisual.atualizarPosicao(estado.elementosSelecionados);
  }
}

/**
 * Define a ferramenta de desenho ativa.
 * Invoca os métodos de ciclo de vida `onDesativar` na ferramenta anterior
 * e `onAtivar` na nova ferramenta, quando aplicável.
 *
 * @param {import('../tools/ToolBase.js').ToolBase|string|null} ferramenta
 * Instância de uma ferramenta (ToolBase) ou string identificadora.
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
 * Define os elementos SVG atualmente selecionados.
 *
 * @param {SVGElement|SVGElement[]|null} elementos - Elemento(s) SVG selecionado(s) ou null para limpar.
 */
export function definirElementosSelecionados(elementos) {
  if (!elementos) {
    estado.elementosSelecionados = [];
  } else if (Array.isArray(elementos)) {
    estado.elementosSelecionados = elementos;
  } else {
    estado.elementosSelecionados = [elementos];
  }

  if (gerenciadorSelecaoVisual) {
    gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
  }
}

/**
 * Alias para compatibilidade ou seleção única.
 * @deprecated Use definirElementosSelecionados
 */
export function definirElementoSelecionado(elemento) {
  definirElementosSelecionados(elemento);
}

/**
 * Adiciona um elemento à seleção atual.
 *
 * @param {SVGElement} elemento
 */
export function adicionarElementoSelecao(elemento) {
  if (!estado.elementosSelecionados.includes(elemento)) {
    estado.elementosSelecionados.push(elemento);
    if (gerenciadorSelecaoVisual) {
      gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
    }
  }
}

/**
 * Remove um elemento da seleção atual.
 *
 * @param {SVGElement} elemento
 */
export function removerElementoSelecao(elemento) {
  estado.elementosSelecionados = estado.elementosSelecionados.filter(el => el !== elemento);
  if (gerenciadorSelecaoVisual) {
    gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
  }
}

export function definirInterface(novaInterface) {
  estado.interfaceAtual = novaInterface;
}

let callbackRecalculo = null;

/**
 * Define a área da página (região imprimível/exportável).
 * Dispara recálculo de status de todos os elementos.
 *
 * @param {{ x: number, y: number, width: number, height: number }} area
 */
export function definirAreaPagina(area) {
  estado.areaPagina = { ...area };
  if (typeof callbackRecalculo === 'function') {
    callbackRecalculo();
  }
}

/**
 * Retorna a área atual da página.
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function obterAreaPagina() {
  return { ...estado.areaPagina };
}

/**
 * Registra uma função de callback chamada quando a área da página muda.
 * @param {Function} cb
 */
export function onAreaPaginaMudou(cb) {
  callbackRecalculo = cb;
}
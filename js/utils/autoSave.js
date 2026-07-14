/**
 * autoSave.js — Utilitário de Auto-Save e Persistência de Rascunhos.
 *
 * Persiste o innerHTML do canvas SVG, viewBox, cores, background
 * e qual tela o usuário estava no localStorage sob chaves específicas.
 */

export const STORAGE_KEY = 'vetor_editor_draft';
export const SCREEN_KEY = 'vetor_editor_screen';

/**
 * Serializa o conteúdo do canvas, viewBox, cores e background para o localStorage.
 * Também salva em qual tela (editor ou menu) o usuário estava.
 *
 * @param {SVGElement} svgCanvas - Elemento SVG principal do canvas.
 * @param {{ corPreenchimento: string, corBorda: string }} estado - Estado global.
 * @param {string} telaAtual - 'editor' ou 'menu' — tela atual.
 */
export function salvarRascunho(svgCanvas, estado, telaAtual = 'editor') {
  const dados = {
    svgContent: svgCanvas.innerHTML,
    viewBox: svgCanvas.getAttribute('viewBox'),
    backgroundColor: svgCanvas.style.backgroundColor,
    corPreenchimento: estado.corPreenchimento,
    corBorda: estado.corBorda,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    localStorage.setItem(SCREEN_KEY, telaAtual);
  } catch (_e) {
    // Silencia falhas de quota (ex: modo privado esgotado)
  }
}

/**
 * Restaura o rascunho do localStorage no canvas e atualiza o estado de cores.
 *
 * @param {SVGElement} svgCanvas
 * @param {(cor: string) => void} definirCorPreenchimento
 * @param {(cor: string) => void} definirCorBorda
 * @returns {boolean} true se o rascunho foi restaurado, false se não havia dados.
 */
export function restaurarRascunho(svgCanvas, definirCorPreenchimento, definirCorBorda) {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  try {
    const dados = JSON.parse(raw);
    // innerHTML injeta os nós como elementos SVG nativos, mantendo interatividade
    svgCanvas.innerHTML = dados.svgContent || '';

    // Restaura viewBox
    if (dados.viewBox) {
      svgCanvas.setAttribute('viewBox', dados.viewBox);
    } else {
      svgCanvas.removeAttribute('viewBox');
    }

    // Restaura background
    if (dados.backgroundColor) {
      svgCanvas.style.backgroundColor = dados.backgroundColor;
    }

    // Restaura cores
    if (dados.corPreenchimento) definirCorPreenchimento(dados.corPreenchimento);
    if (dados.corBorda) definirCorBorda(dados.corBorda);
    return true;
  } catch (_e) {
    // Dado corrompido — descarta o rascunho
    limparRascunho();
    return false;
  }
}

/**
 * Retorna em qual tela o usuário estava quando salvou o rascunho.
 *
 * @returns {string} 'editor' ou 'menu', padrão 'menu' se não existe.
 */
export function obterTelaRascunho() {
  return localStorage.getItem(SCREEN_KEY) || 'menu';
}

/**
 * Remove o rascunho e informações de tela do localStorage.
 */
export function limparRascunho() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SCREEN_KEY);
}

/**
 * Marca o desenho atual como salvo, descartando o rascunho pendente.
 */
export function marcarSalvo() {
  limparRascunho();
}

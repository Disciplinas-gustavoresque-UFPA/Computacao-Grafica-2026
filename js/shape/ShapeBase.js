import { criarElementoSVG } from "../utils/svgHelpers.js";

/**
 * ShapeBase.js — Classe base abstrata para todas as lógicas de modificação estrutural
 *
 * Define a interface (contrato) que cada ferramenta específica deverá implementar.
 * Ferramentas concretas (ex: RetanguloShape, CirculoShape) devem
 * estender esta classe e sobrescrever os métodos de estruturação e manipulação.
 *
 * @example
 * import { ShapeBase } from './ShapeBase.js';
 *
 * export class RetanguloShape extends ShapeBase {
 *   renderizarTodosHandles(elemento) { ... }
 *   atualizarForma(coords) { ... }
 *   sincronizarTodosOsHandles(elemento)   { ... }
 * }
 */
export class ShapeBase {

  // Funções que são implementadas pela classe base
  // renderizarHandle, atualizarPosicaoHandle

  /**
  * Cria a representação visual (alça) de um vértice no overlay.
  * @param {Object} ponto - Coordenadas e ID do ponto.
  */
  renderizarHandle(ponto, grupoOverlay) {
    const handle = criarElementoSVG('rect', {
      'x': ponto.x - 4, // Centraliza o handle de 8x8 no ponto exato
      'y': ponto.y - 4,
      'width': 8,
      'height': 8,
      'fill': 'white',
      'stroke': '#4a90d9',
      'stroke-width': 1,
      'style': 'cursor: move;',
      'class': 'node-handle',
      'data-node-id': ponto.id
    });
  
    grupoOverlay.appendChild(handle);
  }

  // Move visualmente o quadradinho azul no overlay
  atualizarPosicaoHandle(coords, grupoOverlay) {
    const handle = grupoOverlay.querySelector(`[data-node-id="${this.activeNodeId}"]`);
    if (handle) {
      handle.setAttribute('x', coords.x - 4);
      handle.setAttribute('y', coords.y - 4);
    }
  }
  /**
   * renderiza os pontos estruturais
   *
   * @param {SVGAElement} elemento - elemento svg
   */
  renderizarTodosHandles(targetElement, grupoOverlay) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Lógica de modificação estrutural da forma
   *
   * @param {coordenadas} coordenadas - coordenadas da forma.
   */
  atualizarForma(coords, targetElement, activeNode, grupoOverlay) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Re-posiciona todas as alças do overlay com base nos novos atributos do elemento alvo.
   *
   * @param {SVGAElement} elemento - elemento SVG.
   */
  sincronizarTodosOsHandles(targetElement, grupoOverlay) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }
}

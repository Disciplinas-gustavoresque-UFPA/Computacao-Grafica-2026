import { criarElementoSVG } from "../utils/svgHelpers.js";

/**
 * ShapeBase.js — Classe base abstrata para todas as lógicas de modificação estrutural
 *
 * Define a interface (contrato) que cada comportamento específico deverá implementar.
 * Comportamentos concretos (ex: RetanguloShape, CirculoShape) devem
 * estender esta classe e sobrescrever os métodos de estruturação e manipulação.
 * 
 * Alguns métodos já são implementados pela classe pai como:
 * renderizarHandle: apenas cria um svg de ponto (rect pequeno);
 * atualizarPosicaoHandle: move o ponto de acordo com o cursor se pressionado;
 * inicializaOverlay e removeOverlay: cria um svg para renderizar os pontos estruturais
 * (impede que eles sejam renderizados no elemento principal);
 * 
 *
 * @example
 * import { ShapeBase } from './ShapeBase.js';
 *
 * export class RetanguloShape extends ShapeBase {
 *   renderizarTodosHandles(elemento) { ... }
 *   atualizarForma(coords, elemento, noAtivo) { ... }
 *   sincronizarTodosOsHandles(elemento)   { ... }
 * }
 */
export class ShapeBase {

  // Funções que são implementadas pela classe base
  // renderizarHandle, atualizarPosicaoHandle

  constructor(svgCanvas) {
    this.grupoOverlay = null;
    this.svgCanvas = svgCanvas;
  }

  /**
  * Cria a representação visual (alça) de um vértice no overlay.
  * @param {Object} ponto - Coordenadas e ID do ponto.
  */
  renderizarHandle(ponto) {
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
  
    this.grupoOverlay.appendChild(handle);
  }

  // Move visualmente o quadradinho azul no overlay
  atualizarPosicaoHandle(coords) {
    const handle = this.grupoOverlay.querySelector(`[data-node-id="${this.activeNodeId}"]`);
    if (handle) {
      handle.setAttribute('x', coords.x - 4);
      handle.setAttribute('y', coords.y - 4);
    }
  }

  // Cria um grupo SVG para conter as alças de manipulação (Issue #9).
  inicializarOverlay() {
    this.grupoOverlay = criarElementoSVG('g', {
        'id': 'overlay-nodes',
        'style': 'pointer-events: all;' 
    });
    this.svgCanvas.appendChild(this.grupoOverlay);
  }

  // Remove o grupo svg
  removeOverlay() {
    if (this.grupoOverlay) {
      this.grupoOverlay.remove();
      this.grupoOverlay = null;
    }
  }

  /**
   * renderiza os pontos estruturais
   *
   * @param {targetElement} elemento - elemento svg
   */
  renderizarTodosHandles(targetElement) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Lógica de modificação estrutural da forma
   *
   * @param {coordenadas, targetElement, activeNode} coordenadas; elemento alvo; nó ativo - coordenadas da forma.
   */
  atualizarForma(coords, targetElement, activeNode) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Re-posiciona todas as alças do overlay com base nos novos atributos do elemento alvo.
   *
   * @param {targetElement} elemento - elemento Alvo.
   */
  sincronizarTodosOsHandles(targetElement) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }
}

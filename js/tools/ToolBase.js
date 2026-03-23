/**
 * ToolBase.js — Classe base abstrata para todas as ferramentas de desenho.
 *
 * Define a interface (contrato) que cada ferramenta específica deverá implementar.
 * Ferramentas concretas (ex: FerramentaRetangulo, FerramentaLinha) devem
 * estender esta classe e sobrescrever os métodos de evento do mouse.
 *
 * @example
 * import { ToolBase } from './ToolBase.js';
 *
 * export class FerramentaRetangulo extends ToolBase {
 *   onMouseDown(evento) { ... }
 *   onMouseMove(evento) { ... }
 *   onMouseUp(evento)   { ... }
 * }
 */
export class ToolBase {
  /**
   * Chamado quando o botão do mouse é pressionado sobre o canvas SVG.
   *
   * @param {MouseEvent} evento - Evento nativo do mouse.
   */
  onMouseDown(evento) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Chamado enquanto o mouse se move sobre o canvas SVG.
   *
   * @param {MouseEvent} evento - Evento nativo do mouse.
   */
  onMouseMove(evento) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Chamado quando o botão do mouse é liberado sobre o canvas SVG.
   *
   * @param {MouseEvent} evento - Evento nativo do mouse.
   */
  onMouseUp(evento) {
    // Deve ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Chamado quando a ferramenta é ativada (selecionada pelo usuário).
   * Útil para inicializar estado interno ou alterar o cursor.
   */
  onAtivar() {
    // Pode ser sobrescrito pela ferramenta concreta.
  }

  /**
   * Chamado quando a ferramenta é desativada (outra ferramenta é selecionada).
   * Útil para limpar estado interno ou operações em andamento.
   */
  onDesativar() {
    // Pode ser sobrescrito pela ferramenta concreta.
  }
}

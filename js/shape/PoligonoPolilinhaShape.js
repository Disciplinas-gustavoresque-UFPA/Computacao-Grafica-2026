import { ShapeBase } from "./ShapeBase.js";

export class PoligonoPolilinhaShape extends ShapeBase {

  constructor(svgCanvas) {
    super(svgCanvas);
  }

  /**
   * Converte a string `points` em um array de objetos {x, y}.
   */
  parsePoints(targetElement) {
    const pointsStr = targetElement.getAttribute('points');
    if (!pointsStr) return [];
    return pointsStr.trim().split(/\s+/).map((par, i) => {
      const [x, y] = par.split(',').map(Number);
      return { x, y, id: `v${i}` };
    });
  }

  /**
   * Reconstrói a string `points` a partir do array de vértices.
   */
  formatarPoints(vertices) {
    return vertices.map(v => `${v.x},${v.y}`).join(' ');
  }

  renderizarTodosHandles(targetElement) {
    const vertices = this.parsePoints(targetElement);
    vertices.forEach(ponto => super.renderizarHandle(ponto));
  }

  atualizarForma(coords, targetElement, activeNode) {
    const vertices = this.parsePoints(targetElement);
    const indice = parseInt(activeNode.replace('v', ''), 10);

    if (indice >= 0 && indice < vertices.length) {
      vertices[indice].x = coords.x;
      vertices[indice].y = coords.y;
    }

    targetElement.setAttribute('points', this.formatarPoints(vertices));
    this.sincronizarTodosOsHandles(targetElement);
  }

  sincronizarTodosOsHandles(targetElement) {
    const vertices = this.parsePoints(targetElement);

    const posicoes = {};
    vertices.forEach(v => {
      posicoes[v.id] = { x: v.x, y: v.y };
    });

    for (const [id, pos] of Object.entries(posicoes)) {
      const handle = this.grupoOverlay.querySelector(`[data-node-id="${id}"]`);
      if (handle) {
        handle.setAttribute('x', pos.x - 4);
        handle.setAttribute('y', pos.y - 4);
      }
    }
  }
}

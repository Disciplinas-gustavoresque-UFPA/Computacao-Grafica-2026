import { ShapeBase } from "./ShapeBase.js";

export class LinhaShape extends ShapeBase {

  constructor(svgCanvas) {
    super(svgCanvas);
  }

  renderizarTodosHandles(targetElement) {
    const x1 = parseFloat(targetElement.getAttribute('x1'));
    const y1 = parseFloat(targetElement.getAttribute('y1'));
    const x2 = parseFloat(targetElement.getAttribute('x2'));
    const y2 = parseFloat(targetElement.getAttribute('y2'));

    const vertices = [
      { x: x1, y: y1, id: 'start' },
      { x: x2, y: y2, id: 'end' }
    ];

    vertices.forEach(ponto => super.renderizarHandle(ponto));
  }

  atualizarForma(coords, targetElement, activeNode) {
    switch (activeNode) {
      case 'start':
        targetElement.setAttribute('x1', coords.x);
        targetElement.setAttribute('y1', coords.y);
        break;
      case 'end':
        targetElement.setAttribute('x2', coords.x);
        targetElement.setAttribute('y2', coords.y);
        break;
    }

    this.sincronizarTodosOsHandles(targetElement);
  }

  sincronizarTodosOsHandles(targetElement) {
    const x1 = parseFloat(targetElement.getAttribute('x1'));
    const y1 = parseFloat(targetElement.getAttribute('y1'));
    const x2 = parseFloat(targetElement.getAttribute('x2'));
    const y2 = parseFloat(targetElement.getAttribute('y2'));

    const posicoes = {
      'start': { x: x1, y: y1 },
      'end': { x: x2, y: y2 }
    };

    for (const [id, pos] of Object.entries(posicoes)) {
      const handle = this.grupoOverlay.querySelector(`[data-node-id="${id}"]`);
      if (handle) {
        handle.setAttribute('x', pos.x - 4);
        handle.setAttribute('y', pos.y - 4);
      }
    }
  }
}

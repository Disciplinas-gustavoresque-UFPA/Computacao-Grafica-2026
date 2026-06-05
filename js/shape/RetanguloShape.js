import { ShapeBase } from "./ShapeBase.js";

export class RetanguloShape extends ShapeBase {

  constructor() {
    super();
  }

  renderizarTodosHandles(targetElement, grupoOverlay) {
    let vertices = [];

    const x = parseFloat(targetElement.getAttribute('x'));
    const y = parseFloat(targetElement.getAttribute('y'));
    const w = parseFloat(targetElement.getAttribute('width'));
    const h = parseFloat(targetElement.getAttribute('height'));

    vertices = [
        { x: x, y: y, id: 'top-left' },
        { x: x + w, y: y, id: 'top-right' },
        { x: x + w, y: y + h, id: 'bottom-right' },
        { x: x, y: y + h, id: 'bottom-left' }
    ];

    // Renderiza cada vértice identificado
    vertices.forEach(ponto => super.renderizarHandle(ponto, grupoOverlay));
  }

  atualizarForma(coords, targetElement, activeNode, grupoOverlay) {
    const x = parseFloat(targetElement.getAttribute('x'));
    const y = parseFloat(targetElement.getAttribute('y'));
    const w = parseFloat(targetElement.getAttribute('width'));
    const h = parseFloat(targetElement.getAttribute('height'));

    switch (activeNode) {
      case 'top-left':
        // Ao mover o topo-esquerdo, mudamos X e Y, e ajustamos W e H
        targetElement.setAttribute('x', coords.x);
        targetElement.setAttribute('y', coords.y);
        targetElement.setAttribute('width', Math.max(0, w + (x - coords.x)));
        targetElement.setAttribute('height', Math.max(0, h + (y - coords.y)));
        break;

      case 'top-right':
          targetElement.setAttribute('y', coords.y);
          targetElement.setAttribute('width', Math.max(0, coords.x - x));
          targetElement.setAttribute('height', Math.max(0, h + (y - coords.y)));
          break;

      case 'bottom-right':
          targetElement.setAttribute('width', Math.max(0, coords.x - x));
          targetElement.setAttribute('height', Math.max(0, coords.y - y));
          break;

      case 'bottom-left':
          targetElement.setAttribute('x', coords.x);
          targetElement.setAttribute('width', Math.max(0, w + (x - coords.x)));
          targetElement.setAttribute('height', Math.max(0, coords.y - y));
          break;
    }

    // Sincroniza os nodes (vértices)
    this.sincronizarTodosOsHandles(targetElement, grupoOverlay);
  }

  sincronizarTodosOsHandles(targetElement, grupoOverlay){
    const x = parseFloat(targetElement.getAttribute('x'));
    const y = parseFloat(targetElement.getAttribute('y'));
    const w = parseFloat(targetElement.getAttribute('width'));
    const h = parseFloat(targetElement.getAttribute('height'));

    const posicoes = {
        'top-left': { x, y },
        'top-right': { x: x + w, y },
        'bottom-right': { x: x + w, y: y + h },
        'bottom-left': { x, y: y + h }
    };

    for (const [id, pos] of Object.entries(posicoes)) {
        const handle = grupoOverlay.querySelector(`[data-node-id="${id}"]`);
        if (handle) {
            handle.setAttribute('x', pos.x - 4);
            handle.setAttribute('y', pos.y - 4);
        }
    }
  }
}
import { ShapeBase } from "./ShapeBase.js";

export class ElipseShape extends ShapeBase {

  constructor() {
    super();
  }

  renderizarTodosHandles(targetElement, grupoOverlay) {
    let vertices = [];

    const cx = parseFloat(targetElement.getAttribute('cx'));
    const cy = parseFloat(targetElement.getAttribute('cy'));
    const rx = parseFloat(targetElement.getAttribute('rx'));
    const ry = parseFloat(targetElement.getAttribute('ry'));

    // Define 4 pontos de controle nas extremidades da elipse
    vertices = [
        { x: cx, y: cy - ry, id: 'top' },
        { x: cx + rx, y: cy, id: 'right' },
        { x: cx, y: cy + ry, id: 'bottom' },
        { x: cx - rx, y: cy, id: 'left' }
    ];

    // Renderiza cada vértice identificado usando o método da classe base
    vertices.forEach(ponto => super.renderizarHandle(ponto, grupoOverlay));
  }

  atualizarForma(coords, targetElement, activeNode, grupoOverlay) {
    const cx = parseFloat(targetElement.getAttribute('cx'));
    const cy = parseFloat(targetElement.getAttribute('cy'));
    const rx = parseFloat(targetElement.getAttribute('rx'));
    const ry = parseFloat(targetElement.getAttribute('ry'));

    switch (activeNode) {
      case 'top':
        // Altera o raio vertical (ry). Opcionalmente ajusta o cy se quiser travar a base.
        // Aqui mantemos o centro fixo, que é o padrão matemático mais limpo:
        targetElement.setAttribute('ry', Math.max(0, cy - coords.y));
        break;

      case 'right':
        // Altera o raio horizontal (rx) baseado na distância do centro
        targetElement.setAttribute('rx', Math.max(0, coords.x - cx));
        break;

      case 'bottom':
        // Altera o raio vertical (ry) baseado na distância do centro
        targetElement.setAttribute('ry', Math.max(0, coords.y - cy));
        break;

      case 'left':
        // Altera o raio horizontal (rx) baseado na distância do centro
        targetElement.setAttribute('rx', Math.max(0, cx - coords.x));
        break;
    }

    // Sincroniza os nodes (vértices) com a nova geometria da elipse
    this.sincronizarTodosOsHandles(targetElement, grupoOverlay);
  }

  sincronizarTodosOsHandles(targetElement, grupoOverlay) {
    const cx = parseFloat(targetElement.getAttribute('cx'));
    const cy = parseFloat(targetElement.getAttribute('cy'));
    const rx = parseFloat(targetElement.getAttribute('rx'));
    const ry = parseFloat(targetElement.getAttribute('ry'));

    const posicoes = {
        'top': { x: cx, y: cy - ry },
        'right': { x: cx + rx, y: cy },
        'bottom': { x: cx, y: cy + ry },
        'left': { x: cx - rx, y: cy }
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
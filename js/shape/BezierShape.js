import { ShapeBase } from "./ShapeBase.js";

export class BezierShape extends ShapeBase {

  constructor(svgCanvas) {
    super(svgCanvas);
  }

  /**
   * Extrai os pontos definidos pelo usuario a partir do atributo `d` do path.
   * O formato esperado e o produzido pela LinhaCurvadaTool:
   *   M x y Q cx cy ex ey Q cx cy ex ey ...
   * ou M x y L x y (2 pontos apenas).
   */
  extrairPontos(targetElement) {
    const d = targetElement.getAttribute('d');
    if (!d) return [];

    const tokens = d.trim().match(/[MLQ]|-?[\d.e+-]+/g);
    if (!tokens) return [];

    const pontos = [];
    const endpointsQ = [];
    let i = 0;

    while (i < tokens.length) {
      const cmd = tokens[i];
      i++;

      if (cmd === 'M') {
        pontos.push({ x: parseFloat(tokens[i]), y: parseFloat(tokens[i + 1]) });
        i += 2;
      } else if (cmd === 'L') {
        pontos.push({ x: parseFloat(tokens[i]), y: parseFloat(tokens[i + 1]) });
        i += 2;
      } else if (cmd === 'Q') {
        const cx = parseFloat(tokens[i]);
        const cy = parseFloat(tokens[i + 1]);
        const ex = parseFloat(tokens[i + 2]);
        const ey = parseFloat(tokens[i + 3]);
        pontos.push({ x: cx, y: cy });
        endpointsQ.push({ x: ex, y: ey });
        i += 4;
      }
    }

    // O endpoint do ultimo Q e o ultimo ponto definido pelo usuario
    if (endpointsQ.length > 0) {
      pontos.push(endpointsQ[endpointsQ.length - 1]);
    }

    return pontos;
  }

  /**
   * Reconstrói o atributo `d` a partir do array de pontos,
   * recalculando os pontos medios entre controles consecutivos.
   */
  reconstruirPathD(pontos) {
    if (pontos.length === 0) return '';
    if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
    if (pontos.length === 2) return `M ${pontos[0].x} ${pontos[0].y} L ${pontos[1].x} ${pontos[1].y}`;

    let d = `M ${pontos[0].x} ${pontos[0].y}`;

    for (let i = 1; i < pontos.length - 1; i++) {
      const controle = pontos[i];
      const proximo = pontos[i + 1];
      const ehUltimoControle = i === pontos.length - 2;
      const fim = ehUltimoControle
        ? proximo
        : { x: (controle.x + proximo.x) / 2, y: (controle.y + proximo.y) / 2 };

      d += ` Q ${controle.x} ${controle.y} ${fim.x} ${fim.y}`;
    }

    return d;
  }

  renderizarTodosHandles(targetElement) {
    const pontos = this.extrairPontos(targetElement);
    pontos.forEach((ponto, i) => {
      super.renderizarHandle({ x: ponto.x, y: ponto.y, id: `v${i}` });
    });
  }

  atualizarForma(coords, targetElement, activeNode) {
    const pontos = this.extrairPontos(targetElement);
    const indice = parseInt(activeNode.replace('v', ''), 10);

    if (indice >= 0 && indice < pontos.length) {
      pontos[indice].x = coords.x;
      pontos[indice].y = coords.y;
    }

    targetElement.setAttribute('d', this.reconstruirPathD(pontos));
    this.sincronizarTodosOsHandles(targetElement);
  }

  sincronizarTodosOsHandles(targetElement) {
    const pontos = this.extrairPontos(targetElement);

    const posicoes = {};
    pontos.forEach((ponto, i) => {
      posicoes[`v${i}`] = { x: ponto.x, y: ponto.y };
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

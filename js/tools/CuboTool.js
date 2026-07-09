import { ToolBase } from './ToolBase.js';
import { getCubeVertices, CUBE_FACES } from '../shape/CuboShape.js';
import { projectIsometric, computeFaceNormalZ, computeFaceDepth } from '../core/Projection3D.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';

const NS = 'http://www.w3.org/2000/svg';

// Mapa de luminosidade por face — simula iluminação direcional simples
const FACE_BRIGHTNESS = {
  frente:    1.00,
  direita:   0.85,
  esquerda:  0.70,
  topo:      0.95,
  fundo:     0.55,
  'trás':    0.65,
};

export class CuboTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.canvas = svgCanvas;
    this._desenhando = false;
    this._origem = null;       // ponto onde o mousedown ocorreu
    this._grupoPreview = null; // <g> temporário mostrado durante o drag
  }

  onAtivar() {
    this.canvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    this.canvas.style.cursor = 'default';
    this._limparPreview();
  }

  onMouseDown(evento) {
    if (evento.button !== 0) return;
    const { x, y } = this._coordenadasSVG(evento);
    this._desenhando = true;
    this._origem = { x, y };
    this._grupoPreview = this._criarGrupo();
    this.canvas.appendChild(this._grupoPreview);
  }

  onMouseMove(evento) {
    if (!this._desenhando) return;
    const { x, y } = this._coordenadasSVG(evento);
    const tamanho = this._calcularTamanho(this._origem, { x, y });
    this._renderizarCubo(this._grupoPreview, this._origem, tamanho, 0.4);
  }

  onMouseUp(evento) {
    if (!this._desenhando) return;
    const { x, y } = this._coordenadasSVG(evento);
    const tamanho = this._calcularTamanho(this._origem, { x, y });

    this._limparPreview();

    if (tamanho < 10) {
      this._desenhando = false;
      return;
    }

    const grupo = this._criarGrupo();
    this._renderizarCubo(grupo, this._origem, tamanho, 1.0);
    this.canvas.appendChild(grupo);
    registrarAcaoHistorico({
      tipo: 'criacao',
      elemento: grupo
    });

    this._desenhando = false;
    this._origem = null;
  }

  // ── Auxiliares ────────────────────────────────────────────

  _coordenadasSVG(evento) {
    const rect = this.canvas.getBoundingClientRect();
    const vb = this.canvas.viewBox.baseVal;

    // Se não há viewBox, usa as dimensões físicas do elemento
    const width  = vb && vb.width  ? vb.width  : rect.width;
    const height = vb && vb.height ? vb.height : rect.height;
    const originX = vb ? vb.x : 0;
    const originY = vb ? vb.y : 0;

    const scaleX = width  / rect.width;
    const scaleY = height / rect.height;

    return {
        x: (evento.clientX - rect.left) * scaleX + originX,
        y: (evento.clientY - rect.top)  * scaleY + originY,
    };
  }

  _calcularTamanho(a, b) {
    return Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  }

  _criarGrupo() {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'cubo-3d');
    return g;
  }

  _limparPreview() {
    if (this._grupoPreview) {
      this._grupoPreview.remove();
      this._grupoPreview = null;
    }
  }

  _renderizarCubo(grupo, centro, tamanho, opacidade = 1) {
    // Limpa o grupo antes de redesenhar (para preview em tempo real)
    while (grupo.firstChild) grupo.removeChild(grupo.firstChild);

    const vertices3D = getCubeVertices(tamanho);
    const projOpts = { originX: centro.x, originY: centro.y, scale: 1 };

    // Projeta todos os vértices para 2D
    const vertices2D = vertices3D.map(v =>
      projectIsometric(v.x, v.y, v.z, projOpts)
    );

    // Calcula profundidade de cada face (Painter's Algorithm)
    const facesOrdenadas = CUBE_FACES
      .map(face => ({
        ...face,
        profundidade: computeFaceDepth(face.indices, vertices3D),
      }))
      .sort((a, b) => b.profundidade - a.profundidade); // mais fundo primeiro

    const corBase = '#4a90d9';
    const corBorda = '#1a1a2e';

    for (const face of facesOrdenadas) {
      const pts2D = face.indices.map(i => vertices2D[i]);

      // Back-face culling: descarta faces voltadas para trás
      const normalZ = computeFaceNormalZ(pts2D[0], pts2D[1], pts2D[2]);
      if (normalZ >= 0) continue;

      const pontosStr = pts2D.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
      const brilho = FACE_BRIGHTNESS[face.label] ?? 0.8;

      const poly = document.createElementNS(NS, 'polygon');
      poly.setAttribute('points', pontosStr);
      poly.setAttribute('fill', this._ajustarBrilho(corBase, brilho));
      poly.setAttribute('stroke', corBorda);
      poly.setAttribute('stroke-width', '1');
      poly.setAttribute('stroke-linejoin', 'round');
      poly.setAttribute('opacity', String(opacidade));
      poly.setAttribute('data-face', face.label);

      grupo.appendChild(poly);
    }
  }

  /**
   * Ajusta o brilho de uma cor hex multiplicando cada canal por `fator`.
   */
  _ajustarBrilho(hex, fator) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const clamp = v => Math.min(255, Math.max(0, Math.round(v * fator)));
    return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`;
  }
}
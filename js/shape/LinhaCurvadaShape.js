import { ShapeBase } from './ShapeBase.js';
import { gerarPathDataSuave } from '../utils/curvaHelpers.js';

/**
 * LinhaCurvadaShape
 *
 * Responsável por exibir e permitir a edição dos vértices (nós) de um
 * <path> criado pela LinhaCurvadaTool. Segue o mesmo "contrato" usado pelo
 * NodeEditTool para RetanguloShape/ElipseShape
 */
export class LinhaCurvadaShape extends ShapeBase {
  constructor(svgCanvas) {
    super(svgCanvas);
    this.pontos = [];
  }

  inicializarOverlay() {
    if (this.grupoOverlay) return;

    super.inicializarOverlay();
    this.grupoOverlay.classList.add('overlay-handles', 'overlay-linha-curvada');
  }

  /**
   * Lê os vértices salvos em data-pontos e desenha um handle (quadrado) para
   * cada um deles, seguindo o mesmo padrão visual usado nas outras shapes.
   */
  renderizarTodosHandles(elementoAlvo) {
    if (!this.grupoOverlay) this.inicializarOverlay();

    this.pontos = this.obterPontosDoElemento(elementoAlvo);
    this.grupoOverlay.innerHTML = '';

    this.pontos.forEach((ponto, indice) => {
      this.renderizarHandle({
        x: ponto.x,
        y: ponto.y,
        id: String(indice),
      });
    });
  }

  /**
   * Move visualmente o handle ativo para acompanhar o mouse. Como o handle
   * é um <rect>, posicionamos pelo canto superior esquerdo (x/y), então
   * precisamos recentralizar em relação ao lado do quadrado.
   */
  atualizarPosicaoHandle(coordenadas) {
    super.atualizarPosicaoHandle(coordenadas);
  }

  /**
   * Atualiza o vértice movido, regenera o `d` do path com o mesmo algoritmo
   * de suavização usado no desenho, e persiste os novos vértices de volta
   * no elemento.
   */
  atualizarForma(coordenadas, elementoAlvo, activeNodeId) {
    const indice = Number(activeNodeId);
    if (Number.isNaN(indice) || !this.pontos[indice]) return;

    this.pontos[indice] = { x: coordenadas.x, y: coordenadas.y };

    const novoPathData = gerarPathDataSuave(this.pontos);
    elementoAlvo.setAttribute('d', novoPathData);
    elementoAlvo.dataset.pontos = JSON.stringify(this.pontos);

    this.sincronizarTodosOsHandles();
  }

  removeOverlay() {
    super.removeOverlay();
    this.pontos = [];
  }

  sincronizarTodosOsHandles() {
    if (!this.grupoOverlay) return;

    this.pontos.forEach((ponto, indice) => {
      const handle = this.grupoOverlay.querySelector(`[data-node-id="${String(indice)}"]`);
      if (!handle) return;

      handle.setAttribute('x', ponto.x - 4);
      handle.setAttribute('y', ponto.y - 4);
    });
  }

  obterPontosDoElemento(elementoAlvo) {
    try {
      const pontosSalvos = JSON.parse(elementoAlvo.dataset.pontos || '[]');
      return Array.isArray(pontosSalvos) ? pontosSalvos : [];
    } catch (erro) {
      return [];
    }
  }
}
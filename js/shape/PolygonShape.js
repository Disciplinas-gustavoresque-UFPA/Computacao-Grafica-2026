import { ShapeBase } from './ShapeBase.js';

export class PolygonShape extends ShapeBase {
    constructor(svgCanvas) {
        super(svgCanvas);
    }

    renderizarTodosHandles(elemento) {
        if (!this.grupoOverlay) return;

        // Limpa handles antigos
        this.grupoOverlay.innerHTML = '';

        const translacao = this._obterTranslacao(elemento);

        const pontos = elemento
            .getAttribute('points')
            .trim()
            .split(/\s+/);

        pontos.forEach((ponto, index) => {
            const [x, y] = ponto.split(',').map(Number);

            this.renderizarHandle({
                id: index,
                x: x + translacao.x,
                y: y + translacao.y
            });
        });
    }

    atualizarForma(coords, elemento, nodeId) {
        const pontos = elemento
            .getAttribute('points')
            .trim()
            .split(/\s+/)
            .map(p => {
                const [x, y] = p.split(',').map(Number);
                return { x, y };
            });

        const translacao = this._obterTranslacao(elemento);

        const indice = Number(nodeId);

        if (indice >= 0 && indice < pontos.length) {

            pontos[indice] = {

                x: coords.x - translacao.x,
                y: coords.y - translacao.y

            };

        }

        elemento.setAttribute(
            'points',
            pontos.map(p => `${p.x},${p.y}`).join(' ')
        );

        this.sincronizarTodosOsHandles(elemento);
    }

    sincronizarTodosOsHandles(elemento) {

        const translacao = this._obterTranslacao(elemento);

        const pontos = elemento
            .getAttribute('points')
            .trim()
            .split(/\s+/);

        pontos.forEach((ponto, index) => {

            const [x, y] = ponto.split(',').map(Number);

            const handle =
                this.grupoOverlay.querySelector(`[data-node-id="${index}"]`);

            if (handle) {

                handle.setAttribute('x', x + translacao.x - 4);
                handle.setAttribute('y', y + translacao.y - 4);

            }

        });

    }

    _obterTranslacao(elemento) {
        const lista = elemento.transform.baseVal;

        for (let i = 0; i < lista.numberOfItems; i++) {
            const item = lista.getItem(i);

            if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                return {
                    x: item.matrix.e,
                    y: item.matrix.f
                };
            }
        }

        return { x: 0, y: 0 };
    }
}
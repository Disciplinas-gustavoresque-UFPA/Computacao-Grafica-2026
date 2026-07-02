import { ShapeBase } from "./ShapeBase.js";

export class PoligonoRegularShape extends ShapeBase {

    constructor(svgCanvas) {
        super(svgCanvas);
    }

    renderizarTodosHandles(targetElement) {

        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        const vertices = [
            { x: x,     y: y,     id: 'top-left' },
            { x: x + w, y: y,     id: 'top-right' },
            { x: x + w, y: y + h, id: 'bottom-right' },
            { x: x,     y: y + h, id: 'bottom-left' }
        ];

        vertices.forEach(ponto => super.renderizarHandle(ponto));
    }

    atualizarForma(coords, targetElement, activeNode) {

        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        switch (activeNode) {

            case 'top-left':
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

        this.recalcularVertices(targetElement);

        this.sincronizarTodosOsHandles(targetElement);

    }

    recalcularVertices(targetElement) {

        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        const lados = Math.max(
            3,
            parseInt(targetElement.getAttribute('data-lados'))
        );

        const centroX = x + w / 2;
        const centroY = y + h / 2;

        const raioX = w / 2;
        const raioY = h / 2;

        const pontos = [];

        for (let i = 0; i < lados; i++) {

            const angulo = -Math.PI / 2 + (2 * Math.PI * i) / lados;

            const px = centroX + raioX * Math.cos(angulo);
            const py = centroY + raioY * Math.sin(angulo);

            pontos.push(`${px},${py}`);

        }

        targetElement.setAttribute("points", pontos.join(" "));

    }

    sincronizarTodosOsHandles(targetElement) {

        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        const posicoes = {
            'top-left':     { x,       y },
            'top-right':    { x: x+w,  y },
            'bottom-right': { x: x+w,  y: y+h },
            'bottom-left':  { x,       y: y+h }
        };

        for (const [id, pos] of Object.entries(posicoes)) {

            const handle = this.grupoOverlay.querySelector(
                `[data-node-id="${id}"]`
            );

            if (handle) {

                handle.setAttribute('x', pos.x - 4);
                handle.setAttribute('y', pos.y - 4);

            }

        }

    }

}
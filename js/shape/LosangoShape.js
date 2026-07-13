import { ShapeBase } from "./ShapeBase.js";

export class LosangoShape extends ShapeBase {
    constructor(svgCanvas) {
        super(svgCanvas);
    }

    renderizarTodosHandles(targetElement) {
        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        let vertices = [
            {x: x + w/2, y: y, id: 'top'},         // x + (width/2), y: top
            {x: x, y: y + h/2, id: 'left'},        // x, y + (height/2): left
            {x: x + w, y: y + h/2, id: 'right'},   // x + width, y + (height/2): right
            {x: x + w/2, y: y + h, id: 'bottom'},  // x + (width/2), y + height: bottom
        ];

        // Renderiza cada vértice identificado
        vertices.forEach(ponto => super.renderizarHandle(ponto));
    }

    atualizarForma(coords, targetElement, activateNode) {
        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        switch(activateNode) {
            case 'top':
                targetElement.setAttribute('y', coords.y);
                targetElement.setAttribute('height', Math.max(0, (y + h) - coords.y));
                break;
            case 'left':
                targetElement.setAttribute('x', coords.x);
                targetElement.setAttribute('width', Math.max(0, (x + w) - coords.x));
                break;
            case 'right':
                targetElement.setAttribute('width', Math.max(0, coords.x - x));
                break;
            case 'bottom':
                targetElement.setAttribute('height', Math.max(0, coords.y - y));
                break;
        }

        // Redefinição dos pontos do Losango
        const nx = parseFloat(targetElement.getAttribute('x'));
        const ny = parseFloat(targetElement.getAttribute('y'));
        const nw = parseFloat(targetElement.getAttribute('width'));
        const nh = parseFloat(targetElement.getAttribute('height'));

        const centroX = nx + nw / 2;
        const centroY = ny + nh / 2;

        const novosPontos = `${centroX},${ny} ${nx + nw},${centroY} ${centroX},${ny + nh} ${nx},${centroY}`;
        targetElement.setAttribute('points', novosPontos);

        // Sincroniza os nodes (vértices)
        this.sincronizarTodosOsHandles(targetElement);
    }

    sincronizarTodosOsHandles(targetElement){
        const x = parseFloat(targetElement.getAttribute('x'));
        const y = parseFloat(targetElement.getAttribute('y'));
        const w = parseFloat(targetElement.getAttribute('width'));
        const h = parseFloat(targetElement.getAttribute('height'));

        const posicoes = {
            'top': { x: x + w/2, y: y },
            'left': { x: x, y: y + h/2 },
            'right': { x: x + w, y: y + h/2 },
            'bottom': { x: x + w/2, y: y + h }
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
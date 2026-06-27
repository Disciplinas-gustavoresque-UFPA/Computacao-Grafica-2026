import { ShapeBase } from "./ShapeBase";

export class LosangoShape extends ShapeBase {
    constructor(svgCanvas) {
        super(svgCanvas);
    }

    renderizarTodosOsHandles(targetElement) {
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
                targetElement.setAttribute('width', coords.x - x);
                break;
            case 'bottom':
                targetElement.setAttribute('height', coords.y - y);
                break;
            
            // Sincroniza os nodes (vértices)
            this.sincronizarTodosOsHandles(targetElement);
        }
    }
}
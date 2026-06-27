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
}
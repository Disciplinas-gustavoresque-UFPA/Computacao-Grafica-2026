function obterCentro(elemento) {

    const box = elemento.getBBox();

    return {
        cx: box.x + box.width / 2,
        cy: box.y + box.height / 2
    };

}

function numero(elemento, atributo) {
    return parseFloat(elemento.getAttribute(atributo) || 0);
}

export function atualizarTransformacao(elemento) {

    const { cx, cy } = obterCentro(elemento);

    const flipH = elemento.dataset.flipH === "true";
    const flipV = elemento.dataset.flipV === "true";

    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;

    const tx = parseFloat(elemento.dataset.translateX || 0);
    const ty = parseFloat(elemento.dataset.translateY || 0);

    elemento.setAttribute(
        "transform",
        `translate(${tx}, ${ty})
         translate(${cx}, ${cy})
         scale(${scaleX}, ${scaleY})
         translate(${-cx}, ${-cy})`
    );
}

function alternarEspelhamentoHorizontal(elemento) {

    elemento.dataset.flipH =
        elemento.dataset.flipH === "true" ? "false" : "true";

    atualizarTransformacao(elemento);
}

function alternarEspelhamentoVertical(elemento) {

    elemento.dataset.flipV =
        elemento.dataset.flipV === "true" ? "false" : "true";

    atualizarTransformacao(elemento);
}

export function espelharHorizontal(elemento) {

    const tag = elemento.tagName.toLowerCase();

    // Linha
    if (tag === "line") {

        const { cx } = obterCentro(elemento);

        const x1 = numero(elemento, "x1");
        const x2 = numero(elemento, "x2");

        elemento.setAttribute("x1", 2 * cx - x1);
        elemento.setAttribute("x2", 2 * cx - x2);

        return;
    }

    // Imagem, Texto, Retangulo, Desenho a Lapis e Circulo/Elipse
    if (
        tag === "image" ||
        tag === "text" ||
        tag === "rect" ||
        tag === "path" ||
        tag === "circle" ||
        tag === "ellipse" ||
        tag === "g"
    ) {
        alternarEspelhamentoHorizontal(elemento);
        return;
    }
}

export function espelharVertical(elemento) {

    const tag = elemento.tagName.toLowerCase();

    // Linha
    if (tag === "line") {

        const { cy } = obterCentro(elemento);

        const y1 = numero(elemento, "y1");
        const y2 = numero(elemento, "y2");

        elemento.setAttribute("y1", 2 * cy - y1);
        elemento.setAttribute("y2", 2 * cy - y2);

        return;
    }

    // Imagem, Texto, Retangulo, Desenho a Lapis e Circulo/Elipse
    if (
        tag === "image" ||
        tag === "text" ||
        tag === "rect" ||
        tag === "path" ||
        tag === "circle" ||
        tag === "ellipse" ||
         tag === "g"
    ) {
        alternarEspelhamentoVertical(elemento);
        return;
    }
}
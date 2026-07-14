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

/**
 * Lê a translação atual do elemento a partir da lista de transformações SVG.
 */
function obterTranslacao(elemento) {
    const transformList = elemento.transform.baseVal;

    for (let i = 0; i < transformList.numberOfItems; i++) {
        const item = transformList.getItem(i);

        if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            return {
                x: item.matrix.e,
                y: item.matrix.f
            };
        }
    }

    return { x: 0, y: 0 };
}

export function atualizarTransformacao(elemento) {

    const { cx, cy } = obterCentro(elemento);

    const flipH = elemento.dataset.flipH === "true";
    const flipV = elemento.dataset.flipV === "true";

    const scaleX = flipH ? -1 : 1;
    const scaleY = flipV ? -1 : 1;

    // Lê a translação real do SVG
    const { x: tx, y: ty } = obterTranslacao(elemento);

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

    if (tag === "line") {

        const { cx } = obterCentro(elemento);

        const x1 = numero(elemento, "x1");
        const x2 = numero(elemento, "x2");

        elemento.setAttribute("x1", 2 * cx - x1);
        elemento.setAttribute("x2", 2 * cx - x2);

        return;
    }

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
    }
}

export function espelharVertical(elemento) {

    const tag = elemento.tagName.toLowerCase();

    if (tag === "line") {

        const { cy } = obterCentro(elemento);

        const y1 = numero(elemento, "y1");
        const y2 = numero(elemento, "y2");

        elemento.setAttribute("y1", 2 * cy - y1);
        elemento.setAttribute("y2", 2 * cy - y2);

        return;
    }

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
    }
}
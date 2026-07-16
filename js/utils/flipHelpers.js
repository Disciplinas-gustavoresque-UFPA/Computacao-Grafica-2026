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

    const flipH = elemento.dataset.flipH === "true";
    const flipV = elemento.dataset.flipV === "true";

    // Preserva o que já existe na transformList antes de reescrever o atributo:
    // a translação de movimento (primeiro item translate, mantido no índice 0
    // pela SelecaoTool) e a matriz de cisalhamento (último item, aplicada sobre
    // a geometria local). Reconstruir só a partir dos data-attributes de flip
    // zerava o arrasto de path/g/polygon e apagava o skew ao mover.
    let tx = 0, ty = 0;
    let temTranslacao = false;
    let matrizSkew = null;

    const lista = elemento.transform.baseVal;
    for (let i = 0; i < lista.numberOfItems; i++) {
        const item = lista.getItem(i);
        if (!temTranslacao && item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
            tx = item.matrix.e;
            ty = item.matrix.f;
            temTranslacao = true;
        } else if (!matrizSkew && item.type === SVGTransform.SVG_TRANSFORM_MATRIX) {
            matrizSkew = item.matrix;
        }
    }

    const partes = [];

    // Com flip ou skew presentes, a translação entra mesmo zerada, para o
    // primeiro item translate continuar sendo o de movimento.
    if (tx !== 0 || ty !== 0 || flipH || flipV || matrizSkew) {
        partes.push(`translate(${tx}, ${ty})`);
    }

    if (flipH || flipV) {
        const { cx, cy } = obterCentro(elemento);
        const scaleX = flipH ? -1 : 1;
        const scaleY = flipV ? -1 : 1;
        partes.push(`translate(${cx}, ${cy}) scale(${scaleX}, ${scaleY}) translate(${-cx}, ${-cy})`);
    }

    if (matrizSkew) {
        const m = matrizSkew;
        partes.push(`matrix(${m.a}, ${m.b}, ${m.c}, ${m.d}, ${m.e}, ${m.f})`);
    }

    if (partes.length === 0) {
        elemento.removeAttribute("transform");
        return;
    }

    elemento.setAttribute("transform", partes.join(" "));
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
        tag === "polygon"
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
        tag === "polygon"
    ) {
        alternarEspelhamentoVertical(elemento);
        return;
    }
}
function ajustarPosicaoElemento(elemento, offsetX, offsetY) {
  const tag = elemento.tagName ? elemento.tagName.toLowerCase() : '';

  // Agrupamos as tags que devem ser deslocadas via transform/translate
  const tagsComTransform = ['g', 'path', 'polygon', 'polyline'];

  if (tagsComTransform.includes(tag)) {
    const transformAttr = elemento.getAttribute('transform') || '';
    let translateX = 0;
    let translateY = 0;

    if (transformAttr.includes('translate')) {
      const match = transformAttr.match(/translate\(([^,)]+)[,\s]+([^)]+)\)/);
      if (match) {
        translateX = parseFloat(match[1]) || 0;
        translateY = parseFloat(match[2]) || 0;
        const rest = transformAttr.replace(match[0], '').trim();
        elemento.setAttribute('transform', `translate(${translateX + offsetX}, ${translateY + offsetY}) ${rest}`.trim());
      }
    } else {
      elemento.setAttribute('transform', `translate(${offsetX}, ${offsetY}) ${transformAttr}`.trim());
    }
    return;
  }

  const attrs = TAG_POS_ATTRS[tag];
  if (!attrs) return;

  if (Array.isArray(attrs.x)) {
    attrs.x.forEach(attr => {
      const val = parseFloat(elemento.getAttribute(attr)) || 0;
      elemento.setAttribute(attr, val + offsetX);
    });
  } else if (attrs.x) {
    const xVal = parseFloat(elemento.getAttribute(attrs.x)) || 0;
    elemento.setAttribute(attrs.x, xVal + offsetX);
  }

  if (Array.isArray(attrs.y)) {
    attrs.y.forEach(attr => {
      const val = parseFloat(elemento.getAttribute(attr)) || 0;
      elemento.setAttribute(attr, val + offsetY);
    });
  } else if (attrs.y) {
    const yVal = parseFloat(elemento.getAttribute(attrs.y)) || 0;
    elemento.setAttribute(attrs.y, yVal + offsetY);
  }
}
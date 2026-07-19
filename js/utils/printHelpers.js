/**
 * printHelpers.js — Funções utilitárias para impressão e preview de impressão.
 */

/**
 * Clona o SVG contendo apenas os elementos dentro da área da página
 * e abre uma janela de preview para impressão.
 *
 * @param {SVGSVGElement} svgCanvas
 * @param {{ x: number, y: number, width: number, height: number }} areaPagina
 */
export function abrirPreviewImpressao(svgCanvas, areaPagina) {
  const svgClone = _criarSVGFiltrado(svgCanvas, areaPagina);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);

  const janela = window.open('', '_blank', 'width=900,height=700');
  if (!janela) {
    alert('Bloqueado pelo navegador. Permita pop-ups para esta página.');
    return;
  }

  janela.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Preview de Impressão</title>
  <style>
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #f0f0f0;
      font-family: sans-serif;
    }
    .container {
      background: white;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    svg { display: block; }
    .botoes {
      position: fixed;
      top: 16px;
      right: 16px;
      display: flex;
      gap: 8px;
    }
    button {
      padding: 8px 16px;
      border: 1px solid #333;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover { background: #f0f0f0; }
    @media print {
      .botoes { display: none; }
      body { background: white; }
      .container { box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="botoes">
    <button onclick="window.print()">Imprimir</button>
    <button onclick="window.close()">Fechar</button>
  </div>
  <div class="container">${svgString}</div>
</body>
</html>`);
  janela.document.close();
}

/**
 * Imprime diretamente o conteúdo da página, filtrando objetos externos.
 *
 * @param {SVGSVGElement} svgCanvas
 * @param {{ x: number, y: number, width: number, height: number }} areaPagina
 */
export function imprimir(svgCanvas, areaPagina) {
  const svgClone = _criarSVGFiltrado(svgCanvas, areaPagina);

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);

  const janela = window.open('', '_blank', 'width=900,height=700');
  if (!janela) {
    alert('Bloqueado pelo navegador. Permita pop-ups para esta página.');
    return;
  }

  janela.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Imprimir</title>
  <style>
    body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    svg { display: block; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>${svgString}</body>
</html>`);
  janela.document.close();

  janela.onload = () => {
    janela.print();
    janela.close();
  };
}

/**
 * Cria um clone do SVG contendo apenas elementos dentro da página.
 * @private
 */
function _criarSVGFiltrado(svgCanvas, areaPagina) {
  const svgClone = svgCanvas.cloneNode(true);

  svgClone.setAttribute('width', areaPagina.width);
  svgClone.setAttribute('height', areaPagina.height);
  svgClone.setAttribute('viewBox', `${areaPagina.x} ${areaPagina.y} ${areaPagina.width} ${areaPagina.height}`);

  const filhosParaRemover = [];
  Array.from(svgClone.children).forEach(el => {
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (!['rect', 'ellipse', 'circle', 'line', 'path', 'text', 'image',
          'g', 'polygon', 'polyline'].includes(tag)) return;

    if (!_verificarDentro(el, areaPagina)) {
      filhosParaRemover.push(el);
    }
  });
  filhosParaRemover.forEach(el => el.parentNode.removeChild(el));

  return svgClone;
}

function _verificarDentro(el, areaPagina) {
  try {
    const bbox = el.getBBox();
    return (
      bbox.x >= areaPagina.x &&
      bbox.y >= areaPagina.y &&
      bbox.x + bbox.width <= areaPagina.x + areaPagina.width &&
      bbox.y + bbox.height <= areaPagina.y + areaPagina.height
    );
  } catch {
    return true;
  }
}

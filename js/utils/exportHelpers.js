/**
 * exportHelpers.js — Funções utilitárias para exportar o desenho do canvas.
 */

/**
 * Função auxiliar que força o download de um arquivo no navegador do usuário.
 *
 * @param {string} url - A URL ou DataURL do arquivo gerado.
 * @param {string} nomeArquivo - O nome que o arquivo terá ao ser baixado.
 */
function baixarArquivo(url, nomeArquivo) {
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  // Simula um clique no link para iniciar o download automaticamente
  link.click();
}

// Mostra uma mensagem temporária no canto superior direito da tela.
function mostrarMensagem(texto, duracao = 2500) {
  const id = "export-helper-msg";
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("div");
    el.id = id;
    // aparência minimalista — evita dependência de CSS externo
    Object.assign(el.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      borderRadius: "6px",
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      zIndex: 99999,
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
      transition: "opacity 200ms ease-in-out",
      opacity: "0",
    });
    document.body.appendChild(el);
  }

  clearTimeout(el._hideTimeout);
  clearTimeout(el._removeTimeout);

  el.textContent = texto;
  // forçar reflow para garantir transição
  // eslint-disable-next-line no-unused-expressions
  el.offsetWidth;
  el.style.opacity = "1";

  el._hideTimeout = setTimeout(() => {
    el.style.opacity = "0";
    // remove after transition
    el._removeTimeout = setTimeout(() => {
      if (el && el.parentNode) el.parentNode.removeChild(el);
      el._removeTimeout = null;
    }, 250);
  }, duracao);
}

/**
 * Lê o conteúdo de um elemento SVG e o exporta no formato desejado.
 *
 * @param {SVGSVGElement} svgElement - O elemento SVG raiz (seu canvas).
 * @param {string} formato - O formato escolhido ('svg', 'png' ou 'jpg').
 * @param {Object} [opcoes={}] - Opções de exportação.
 * @param {boolean} [opcoes.incluirExternos=false] - Se true, inclui objetos fora da página.
 * @param {{ x: number, y: number, width: number, height: number }|null} [opcoes.areaPagina=null] - Área da página para filtragem.
 */
export function exportarDesenho(svgElement, formato, opcoes = {}) {
  const { incluirExternos = false, areaPagina = null } = opcoes;
  const deveFiltrar = areaPagina && !incluirExternos;
  // 1. Pega as dimensões da página (ou do canvas se não houver página)
  let largura, altura;
  let svgClone;

  if (deveFiltrar) {
    largura = areaPagina.width;
    altura = areaPagina.height;

    svgClone = svgElement.cloneNode(true);
    svgClone.setAttribute("width", largura);
    svgClone.setAttribute("height", altura);
    svgClone.setAttribute("viewBox", `${areaPagina.x} ${areaPagina.y} ${largura} ${altura}`);

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
  } else {
    const rect = svgElement.getBoundingClientRect();
    largura = rect.width;
    altura = rect.height;
    svgClone = svgElement.cloneNode(true);
    svgClone.setAttribute("width", largura);
    svgClone.setAttribute("height", altura);
  }

  // 4. Extrai todo o código XML do clone como texto
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);

  // show a save/export message
  mostrarMensagem("Salvando desenho...");

  // 5. Lógica para exportação em SVG
  if (formato === "svg") {
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    baixarArquivo(url, "meu_desenho.svg");
    setTimeout(() => URL.revokeObjectURL(url), 0);
    mostrarMensagem("Download iniciado: meu_desenho.svg");
    return;
  }

  // 6. Lógica para exportação em PNG ou JPG
  const canvasHtml = document.createElement("canvas");
  canvasHtml.width = largura;
  canvasHtml.height = altura;

  const ctx = canvasHtml.getContext("2d");

  // Se for JPG, pintamos o fundo de branco (pois JPG não suporta fundo transparente)
  if (formato === "jpg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, largura, altura);
  }

  // 7. Carrega o SVG dentro de um elemento de Imagem usando um Blob (mais seguro)
  const img = new Image();
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const urlBlob = URL.createObjectURL(svgBlob);

  // Só tentamos desenhar e exportar DEPOIS que a imagem terminar de carregar
  img.onload = () => {
    // Desenha a imagem carregada no nosso canvas invisível
    ctx.drawImage(img, 0, 0);

    // Define o tipo de arquivo correto
    const mimeType = formato === "png" ? "image/png" : "image/jpeg";

    // Converte o canvas HTML para um link de dados contendo a imagem final
    const dataUrl = canvasHtml.toDataURL(mimeType);

    // Inicia o download
    baixarArquivo(dataUrl, `meu_desenho.${formato}`);
    mostrarMensagem(`Download iniciado: meu_desenho.${formato}`);

    // Limpa a memória
    URL.revokeObjectURL(urlBlob);
  };

  // Dispara o carregamento da imagem
  img.src = urlBlob;
}

/**
 * Verifica se um elemento SVG clone está totalmente dentro da área da página.
 * @private
 */
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

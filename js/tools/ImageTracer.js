export function inicializarImageTracer(svgCanvas) {
  const btnTrace = document.getElementById('btn-trace');
  const inputImage = document.getElementById('input-imagem-trace');

  if (!btnTrace || !inputImage) return;

  // Pra abrir o picker
  btnTrace.addEventListener('click', () => {
    inputImage.click();
  });

  // Pra usar o arquivo
  inputImage.addEventListener('change', (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target.result;

      window.ImageTracer.imageToSVG(dataUrl, (svgString) => {
        
        // O imagetracer passa o resultado no formato de string.
        // Aqui ocorre a conversão para SVG.
        const parser = new DOMParser();
        const docSVG = parser.parseFromString(svgString, "image/svg+xml");
        const svgGerado = docSVG.querySelector('svg');

        if (svgGerado) {
          const grupoTrace = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          grupoTrace.setAttribute('class', 'imagem-vetorizada');
          
          grupoTrace.setAttribute('transform', 'translate(0, 0)');

          Array.from(svgGerado.childNodes).forEach(node => {
            if (node.nodeType === 1) { // Apenas elementos (ignora textos vazios)
              grupoTrace.appendChild(node);
            }
          });

          svgCanvas.appendChild(grupoTrace);
        }

        inputImage.value = '';
      }, 'default');
    };

    reader.readAsDataURL(arquivo);
  });
}
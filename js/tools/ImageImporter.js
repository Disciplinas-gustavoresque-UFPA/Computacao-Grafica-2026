/**
 * ImageImporter.js — Serviço responsável por lidar com a importação 
 * de imagens rasterizadas para dentro do canvas SVG.
 */

import { registrarAcaoHistorico } from '../core/StateManager.js';

/**
 * @param {SVGSVGElement} svgCanvas
 * @param {HTMLInputElement} inputImagem 
 */
export function inicializarImportadorImagem(svgCanvas, inputImagem) {
  if (!svgCanvas || !inputImagem) {
    console.error("ImageImporter: Elementos do DOM necessários não foram fornecidos.");
    return;
  }

  inputImagem.addEventListener('change', (evento) => {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;

    const reader = new FileReader();
    
    reader.onload = function(e) {
      const dataUrl = e.target.result;

      const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      
    
      svgImage.setAttribute('href', dataUrl);
      svgImage.setAttribute('x', '50');
      svgImage.setAttribute('y', '50');
      svgImage.setAttribute('width', '300');
      svgImage.setAttribute('height', '300');

      // O atributo permite a edição estrutural de imagens de forma mais fluida
      svgImage.setAttribute('preserveAspectRatio', 'none');
      
      // Classe para que a SelecaoTool reconheça o elemento
      svgImage.classList.add('elemento-desenho'); 

      // Adiciona a imagem ao canvas
      svgCanvas.appendChild(svgImage);

      registrarAcaoHistorico();
      inputImagem.value = '';
    };

    reader.readAsDataURL(arquivo);
  });
}
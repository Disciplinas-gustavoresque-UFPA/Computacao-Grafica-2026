/**
 * ImageImporter.js — Serviço responsável por lidar com a importação 
 * de imagens rasterizadas para dentro do canvas SVG com logs de depuração.
 */

import { registrarAcaoHistorico } from '../core/StateManager.js';

/**
 * @param {SVGSVGElement} svgCanvas
 * @param {HTMLInputElement} inputImagem 
 */
export function inicializarImportadorImagem(svgCanvas, inputImagem) {
  if (!svgCanvas || !inputImagem) {
    console.error("DEBUG [ImageImporter]: Elementos do DOM necessários não foram fornecidos.");
    return;
  }

  inputImagem.addEventListener('change', (evento) => {
    console.group("DEBUG [ImageImporter]: Evento de importação iniciado");
    
    const arquivo = evento.target.files[0];
    if (!arquivo) {
      console.warn("DEBUG [ImageImporter]: Nenhum arquivo selecionado.");
      console.groupEnd();
      return;
    }

    console.log("Arquivo detectado:", {
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: `${(arquivo.size / 1024).toFixed(2)} KB`
    });

    const reader = new FileReader();
    
    reader.onload = function(e) {
      const dataUrl = e.target.result;

      if (!dataUrl) {
        console.error("DEBUG [FileReader]: Erro! DataURL vazia.");
        console.groupEnd();
        return;
      }

      // Instanciação da imagem na memória do navegador
      const img = new Image();
      
      img.onload = function() {
        // Coleta de todas as dimensões possíveis
        const naturalW = img.naturalWidth;
        const naturalH = img.naturalHeight;
        const offsetW = img.width;
        const offsetH = img.height;

        // Definição das dimensões finais usando prioridades
        const larguraFinal = naturalW || offsetW || 300;
        const alturaFinal = naturalH || offsetH || 300;

        console.log(`DEBUG: Dimensões calculadas para aplicar no SVG: ${larguraFinal}px x ${alturaFinal}px`);

        const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        
        svgImage.setAttribute('href', dataUrl);
        svgImage.setAttribute('x', '50');
        svgImage.setAttribute('y', '50');

        // Atributos originais base
        svgImage.setAttribute('width', larguraFinal.toString());
        svgImage.setAttribute('height', alturaFinal.toString());

        // (Opcional) Define explicitamente como 'none' para forçar o preenchimento da caixa
        svgImage.setAttribute('preserveAspectRatio', 'none');
        
        svgImage.style.display = 'block';
        svgImage.classList.add('elemento-desenho'); 

        // Insere no canvas
        svgCanvas.appendChild(svgImage);

        // Verificação de interferência externa de CSS (importante!)
        const estilosComputados = window.getComputedStyle(svgImage);

        registrarAcaoHistorico();
        
        console.groupEnd(); // Fim do grupo do HTML Image.onload
        console.groupEnd(); // Fim do grupo do evento change
      };

      img.onerror = function(err) {
        console.error("DEBUG [HTML Image]: Falha crítica ao processar a imagem em memória.", err);
        console.groupEnd();
      };
      
      img.src = dataUrl;
      inputImagem.value = '';
    };

    reader.onerror = function(err) {
      console.error("DEBUG [FileReader]: Falha crítica ao ler arquivo.", err);
      console.groupEnd();
    };

    reader.readAsDataURL(arquivo);
  });
}
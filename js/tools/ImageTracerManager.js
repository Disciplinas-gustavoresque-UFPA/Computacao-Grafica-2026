/**
 * ImageTracerManager.js
 * Gerencia a aba de vetorização de imagens rasterizadas.
 */
import { registrarAcaoHistorico, definirElementosSelecionados } from '../core/StateManager.js';

export class ImageTracerManager {
    constructor(svgCanvas, inputImagem) {
        this.svgCanvas = svgCanvas;
        this.inputImagem = inputImagem;
        this.imagemSelecionada = null;

        // Elementos de UI
        this.emptyState = document.getElementById('tracer-empty-state');
        this.conteudoAtivo = document.getElementById('tracer-conteudo');
        this.containerLista = document.getElementById('tracer-lista-imagens');
        this.btnImportar = document.getElementById('btn-tracer-importar');
        this.btnAplicar = document.getElementById('btn-tracer-aplicar');
        this.selectPreset = document.getElementById('tracer-preset');

        this._bindEvents();
    }

    _bindEvents() {
        this.btnImportar.addEventListener('click', () => {
            this.inputImagem.click();
        });

        this.btnAplicar.addEventListener('click', () => this.aplicarTracer());
    }

    atualizarLista() {
        this.containerLista.innerHTML = '';
        const imagens = Array.from(this.svgCanvas.querySelectorAll('image'));

        if (imagens.length === 0) {
            this.emptyState.classList.remove('oculto');
            this.conteudoAtivo.classList.add('oculto');
            this.imagemSelecionada = null;
            return;
        }

        this.emptyState.classList.add('oculto');
        this.conteudoAtivo.classList.remove('oculto');

        imagens.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'tracer-item';
            item.style.padding = '8px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #eee';
            item.textContent = `Imagem ${index + 1} (${img.getAttribute('width')}x${img.getAttribute('height')})`;
            
            item.onclick = () => this.selecionarImagem(img, item);
            this.containerLista.appendChild(item);
        });

        // Seleciona automaticamente a primeira imagem
        if (imagens.length > 0) {
            this.selecionarImagem(imagens[0], this.containerLista.firstChild);
        }
    }

    selecionarImagem(img, elItem) {
        this.imagemSelecionada = img;
        
        const itens = this.containerLista.querySelectorAll('.tracer-item');
        itens.forEach(el => {
            el.style.backgroundColor = 'transparent';
            el.style.fontWeight = 'normal';
        });
        
        if (elItem) {
            elItem.style.backgroundColor = '#e0f0ff';
            elItem.style.fontWeight = 'bold';
        }

        definirElementosSelecionados([img]);
    }

    aplicarTracer() {
        if (!this.imagemSelecionada || !window.ImageTracer) {
            console.error("ImageTracer indisponível ou nenhuma imagem selecionada.");
            return;
        }

        const textoOriginal = this.btnAplicar.textContent;
        this.btnAplicar.textContent = "Processando...";
        this.btnAplicar.disabled = true;

        const url = this.imagemSelecionada.getAttribute('href');
        const preset = this.selectPreset.value;
        const opcoes = preset === 'default' ? null : preset;

        const x = parseFloat(this.imagemSelecionada.getAttribute('x') || 0);
        const y = parseFloat(this.imagemSelecionada.getAttribute('y') || 0);

        setTimeout(() => {
            ImageTracer.imageToSVG(url, (svgString) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(svgString, "image/svg+xml");
                const generatedSvg = doc.documentElement;

                const grupoVetorizado = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                
                const transform = this.svgCanvas.createSVGTransform();
                transform.setTranslate(x, y);
                grupoVetorizado.transform.baseVal.appendItem(transform);
                
                grupoVetorizado.classList.add('elemento-desenho');

                const paths = generatedSvg.querySelectorAll('path');
                paths.forEach(p => grupoVetorizado.appendChild(p));

                this.svgCanvas.appendChild(grupoVetorizado);
                this.imagemSelecionada.remove();

                registrarAcaoHistorico();
                definirElementosSelecionados([grupoVetorizado]);
                this.atualizarLista();

                this.btnAplicar.textContent = textoOriginal;
                this.btnAplicar.disabled = false;

            }, opcoes);
        }, 50);
    }
}
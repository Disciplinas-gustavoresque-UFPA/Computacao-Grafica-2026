/**
 * [source: 10]
 * ImageTracerManager.js
 * Gerencia a aba de vetorização de imagens rasterizadas com suporte a parâmetros manuais.
 */
import { registrarAcaoHistorico, definirElementosSelecionados } from '../core/StateManager.js';

export class ImageTracerManager {
    constructor(svgCanvas, inputImagem) {
        this.svgCanvas = svgCanvas;
        this.inputImagem = inputImagem;
        this.imagemSelecionada = null;

        // Elementos base de UI
        this.emptyState = document.getElementById('tracer-empty-state');
        this.conteudoAtivo = document.getElementById('tracer-conteudo');
        this.containerLista = document.getElementById('tracer-lista-imagens');
        this.btnImportar = document.getElementById('btn-tracer-importar');
        this.btnAplicar = document.getElementById('btn-tracer-aplicar');
        this.selectPreset = document.getElementById('tracer-preset');
        this.advancedPanel = document.getElementById('tracer-advanced-panel');

        // Mapeamento dos novos inputs avançados e seus respectivos indicadores numéricos
        this.inputsAvancados = {
            numberofcolors: { input: document.getElementById('tracer-colors'), val: document.getElementById('val-tracer-colors') },
            colorquantcycles: { input: document.getElementById('tracer-cycles'), val: document.getElementById('val-tracer-cycles') },
            ltres: { input: document.getElementById('tracer-ltres'), val: document.getElementById('val-tracer-ltres') },
            qtres: { input: document.getElementById('tracer-qtres'), val: document.getElementById('val-tracer-qtres') },
            pathomit: { input: document.getElementById('tracer-omit'), val: document.getElementById('val-tracer-omit') },
            blurradius: { input: document.getElementById('tracer-blur'), val: document.getElementById('val-tracer-blur') },
            strokewidth: { input: document.getElementById('tracer-stroke'), val: document.getElementById('val-tracer-stroke') },
            roundcoords: { input: document.getElementById('tracer-round'), val: document.getElementById('val-tracer-round') },
            rightangleenhance: { input: document.getElementById('tracer-rightangle'), val: null }
        };

        this._bindEvents();
        this._initSlidersSync();
    }

    _bindEvents() {
        this.btnImportar.addEventListener('click', () => {
            this.inputImagem.click();
        });

        this.btnAplicar.addEventListener('click', () => this.aplicarTracer());

        // Escuta a alteração no seletor de estilo para alternar visibilidade do painel avançado
        this.selectPreset.addEventListener('change', () => {
            if (this.selectPreset.value === 'custom') {
                this.advancedPanel.style.display = 'block';
            } else {
                this.advancedPanel.style.display = 'none';
            }
        });
    }

    /**
     * Inicializa a sincronização dinâmica de texto nos labels de exibição conforme os sliders se movem
     */
    _initSlidersSync() {
        Object.keys(this.inputsAvancados).forEach(chave => {
            const item = this.inputsAvancados[chave];
            if (item.val && item.input) {
                item.input.addEventListener('input', (e) => {
                    item.val.textContent = e.target.value;
                });
            }
        });
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

    /**
     * Coleta todos os parâmetros definidos na UI e monta o objeto customizado para o ImageTracerJS
     */
    _obterOpcoesCustomizadas() {
        return {
            numberofcolors: parseInt(this.inputsAvancados.numberofcolors.input.value, 10),
            colorquantcycles: parseInt(this.inputsAvancados.colorquantcycles.input.value, 10),
            ltres: parseFloat(this.inputsAvancados.ltres.input.value),
            qtres: parseFloat(this.inputsAvancados.qtres.input.value),
            pathomit: parseInt(this.inputsAvancados.pathomit.input.value, 10),
            blurradius: parseInt(this.inputsAvancados.blurradius.input.value, 10),
            strokewidth: parseFloat(this.inputsAvancados.strokewidth.input.value),
            roundcoords: parseInt(this.inputsAvancados.roundcoords.input.value, 10),
            rightangleenhance: this.inputsAvancados.rightangleenhance.input.checked
        };
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
        
        // Se for 'custom', invoca o extrator de opções manuais; caso contrário, usa a string do preset
        let opcoes = null;
        if (preset === 'custom') {
            opcoes = this._obterOpcoesCustomizadas();
        } else if (preset !== 'default') {
            opcoes = preset;
        }

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
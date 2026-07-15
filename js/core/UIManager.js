import { definirInterface, definirAreaPagina } from './StateManager.js';
import { restaurarRascunho, obterTelaRascunho, limparRascunho, STORAGE_KEY } from '../utils/autoSave.js';

/**
 * Inicializa os ouvintes de evento para a Tela Inicial
 * @param {SVGSVGElement} svgCanvas - A referência ao canvas principal
 */
export function inicializarMenuInicial(svgCanvas, definirCorPreenchimento, definirCorBorda) {
    const telaInicial = document.getElementById('tela-inicial');
    const telaEditor = document.getElementById('app');
    
    const btnNovoDoc = document.getElementById('btn-novo-doc');
    const btnAbrirArq = document.getElementById('btn-abrir-arq');
    const selectTamanho = document.getElementById('select-tamanho');

    // Função central para transição de tela
    function irParaEditor() {
        telaInicial.classList.add('oculto');
        telaEditor.classList.remove('oculto');
        definirInterface('editor');
        svgCanvas.dispatchEvent(new CustomEvent('canvas-cleared'));
    }

    // ── Auto-Save: verificar rascunho ao iniciar ──────────────────────────────
    const telaRascunho = obterTelaRascunho();
    const temRascunho = !!localStorage.getItem(STORAGE_KEY);

    if (temRascunho && telaRascunho === 'editor') {
      const restaurar = confirm(
        'Encontramos um rascunho não salvo. Deseja restaurar o seu trabalho anterior?'
      );

      if (restaurar) {
        restaurarRascunho(svgCanvas, definirCorPreenchimento, definirCorBorda);
        irParaEditor();
      } else {
        limparRascunho();
      }
    }
    // ─────────────────────────────────────────────────────────────────────────


    // 1. Lógica: Criar Novo Documento
    btnNovoDoc.addEventListener('click', () => {
        const tamanho = selectTamanho.value;
        
        if (tamanho === 'a4') {
            svgCanvas.setAttribute('viewBox', '0 0 800 1131');
            definirAreaPagina({ x: 0, y: 0, width: 800, height: 1131 });
        } else if (tamanho === 'a3') {
            svgCanvas.setAttribute('viewBox', '0 0 1131 1600');
            definirAreaPagina({ x: 0, y: 0, width: 1131, height: 1600 });
        } else {
            svgCanvas.removeAttribute('viewBox');
            definirAreaPagina({ x: 0, y: 0, width: 800, height: 1131 });
        }
        
        svgCanvas.innerHTML = '';
        limparRascunho();
        irParaEditor();
    });

    // 2. Lógica: Abrir Arquivo (Lê um SVG do computador do usuário)
    btnAbrirArq.addEventListener('click', () => {
        // Criamos um input de arquivo invisível dinamicamente
        const inputFalso = document.createElement('input');
        inputFalso.type = 'file';
        inputFalso.accept = '.svg';

        inputFalso.addEventListener('change', (evento) => {
            const arquivo = evento.target.files[0];
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = (e) => {
                const conteudoSvg = e.target.result;
                
                // Transforma o texto do arquivo lido em Elementos DOM de verdade
                const parser = new DOMParser();
                const docSvg = parser.parseFromString(conteudoSvg, "image/svg+xml");
                const svgImportado = docSvg.documentElement;

                // Injeta o conteúdo no nosso canvas
                svgCanvas.innerHTML = svgImportado.innerHTML;
                
                // Preserva o viewBox original do arquivo, se existir
                if (svgImportado.hasAttribute('viewBox')) {
                    svgCanvas.setAttribute('viewBox', svgImportado.getAttribute('viewBox'));
                }
                
                limparRascunho();
                irParaEditor();
            };
            leitor.readAsText(arquivo);
        });

        // Simula o clique do usuário para abrir a janela do Windows/Linux
        inputFalso.click(); 
    });

    // 3. Stubs (Para as futuras issues)
    document.getElementById('btn-modelos').addEventListener('click', () => {
        alert('As opções de Template serão lançadas na versão 1.2!');
    });
    document.getElementById('btn-config').addEventListener('click', () => {
        alert('As configurações avançadas serão implementadas em breve.');
    });
}
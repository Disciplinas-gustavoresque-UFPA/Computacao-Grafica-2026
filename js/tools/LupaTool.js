import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';

// Ferramenta responsavel por controlar zoom no canvas SVG via viewBox
export class LupaTool extends ToolBase {
  constructor(svg) {
    super();
    this.svg = svg;

    this.modo = 'click'; // zoom padrão do inkscape

    // controles da interação mouseOnMove
    this.isDragging = false;
    this.start = null;
    this.dragButton = null;
    this.selectionRect = null;


    // Estado atual da área visivel (viewbox)
    this.viewBox = {
      x: 0,
      y: 0,
      width: svg.clientWidth,
      height: svg.clientHeight
    }; // <-- viewBox


    this.initialViewBox = {
      ...this.viewBox
    }; // <-- initialViewBox (guardar a posição inicial)
  } // <-- constructor
  

  // Restaura posição inicial do viewBox
  resetView() {
    this.viewBox = {
      ...this.initialViewBox
    };
    this.applyViewBox();
  } // <-- resetView


  // Aplica o viewBox atual no SVG (atualiza o "zoom")
  applyViewBox() {
    const {
      x,
      y,
      width,
      height
    } = this.viewBox;
    this.svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
  } // <-- applyViewBox


  // Atualiza estado visual do botão e do cursor
  updateUI() {
    const btn = document.getElementById('btn-drag');
    if (!btn) return;

    const ativo = this.modo === 'drag';

    btn.classList.toggle('ativo', ativo);

    // muda cursor dinamicamente
    this.svg.style.cursor = ativo ? 'crosshair' : 'zoom-in';
  } // <-- updateUI


  // Alterna o modo de interação da lupa 
  setModo(modo) {
    this.modo = (this.modo === modo) ? 'click' : modo;
    this.updateUI();
  } // <-- setModo


  // Renderiza dinamicamente o painel de opcoes da lupa 
  renderOptions() {
    const panel = document.getElementById('zoom-options');

    if (!panel.dataset.initialized) {
      panel.innerHTML = `
        <button id="btn-drag" title="Zoom por seleção">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">

            <!-- lente -->
            <circle cx="10" cy="10" r="8"></circle>
            <line x1="20" y1="20" x2="15" y2="15"></line>

            <!-- retângulo de seleção -->
            <rect x="7" y="7" width="6" height="6" stroke-dasharray="2"></rect>

          </svg>
        </button>
        `;

      // Evento para alternar para modo 'drag' 
      panel.querySelector('#btn-drag').onclick = () => {
        this.setModo('drag');
      };
    }
  } // <-- renderOptions

  
  // Converte botão do mouse em máscara binária (para evento.buttons)
  getButtonMask(button) {
    switch (button) {
      case 0: return 1; // esquerdo
      case 1: return 4; // meio
      case 2: return 2; // direito
      default: return 0;
    }
  } // <-- getButtonMask


  // Realiza zoom mantendo o ponto (cx, cy) fixo como foco
  zoom(scale, cx, cy) {
    const newWidth = this.viewBox.width * scale;
    const newHeight = this.viewBox.height * scale;
  
    // Reposiciona o viewBox para manter o cursor fixo
    this.viewBox.x = cx - (cx - this.viewBox.x) * (newWidth / this.viewBox.width);
    this.viewBox.y = cy - (cy - this.viewBox.y) * (newHeight / this.viewBox.height);
    
    // Atualiza as dimensões do viewBox 
    this.viewBox.width = newWidth;
    this.viewBox.height = newHeight;

    this.applyViewBox();
  } // <-- zoom 
  

  // Inicio da interação com o mouse
  onMouseDown(evento) {
    const coords = obterCoordenadaSVG(evento, this.svg);
    
    if (this.isDragging) this.cleanup();
    
    
    // Botão do meio ( Reset do viebox )
    if (evento.button === 1) {
      this.resetView();
      return;
    }

    // Modo zoom padrão ('click') 
    if (this.modo === 'click') {
      if (evento.button === 0) this.zoom(0.9, coords.x, coords.y);
      if (evento.button === 2) this.zoom(1.1, coords.x, coords.y);
      return;
    } // <-- fim do modo de zoom padrão 

    // Modo zoom por seleção ('drag')
    if (this.modo === 'drag') {
      this.isDragging = true;
      this.start = coords;
      this.dragButton = evento.button;

      // Cria retangulo de seleção
      this.selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.selectionRect.setAttribute("fill", "rgba(0,0,255,0.2)");
      this.selectionRect.setAttribute("stroke", "blue");
      this.selectionRect.setAttribute("stroke-dasharray", "4");

      this.svg.appendChild(this.selectionRect); 
    } // <-- fim do modo de zoom com  seleção
  } // <-- onMouseDown
  

  // Atualiza retangulo de seleção e posiçao
  onMouseMove(evento) {
    if (!this.isDragging || this.modo !== 'drag' || !this.selectionRect) return;
    
    const expected = this.getButtonMask(this.dragButton);

    // Cancela se botão foi solto
    if ((evento.buttons & expected) === 0) {
      this.cleanup();
      return;
    } 

    const coords = obterCoordenadaSVG(evento, this.svg);

    const x = Math.min(this.start.x, coords.x);
    const y = Math.min(this.start.y, coords.y);
    const width = Math.abs(coords.x - this.start.x);
    const height = Math.abs(coords.y - this.start.y);

    this.selectionRect.setAttribute("x", x);
    this.selectionRect.setAttribute("y", y);
    this.selectionRect.setAttribute("width", width);
    this.selectionRect.setAttribute("height", height);
  } // <-- onMouseMove


  // Finaliza seleção e aplica zoom
  onMouseUp(evento) {
    evento.preventDefault();
    if (!this.isDragging || this.modo !== 'drag') return;
    if (evento.button !== this.dragButton) {
      this.cleanup();
      return;
    }

    const coords = obterCoordenadaSVG(evento,this.svg);

    const x = Math.min(this.start.x, coords.x);
    const y = Math.min(this.start.y, coords.y);
    const width = Math.abs(coords.x - this.start.x);
    const height = Math.abs(coords.y - this.start.y);

    // Ignora seleções muito pequenas
    if (width < 5 || height < 5) {
      this.cleanup();
      return;
    }
    
    // Zoom In
    if (evento.button === 0) {
      this.viewBox = {
        x,
        y,
        width,
        height
      };
    }

    // Zoom Out 
    if (evento.button === 2) { 
      const scale = Math.max(
        this.viewBox.width / width,
        this.viewBox.height / height
      );

      const newWidth = this.viewBox.width * scale;
      const newHeight = this.viewBox.height * scale;

      this.viewBox.x = x - (newWidth - width) / 2;
      this.viewBox.y = y - (newHeight - height) / 2;
      this.viewBox.width = newWidth;
      this.viewBox.height = newHeight;
    }

    this.applyViewBox();
    this.cleanup();
  } // <-- onMouseUp


  // Remove elementos temporários e reseta o estado/modo da lupa 
  cleanup() {
    if (this.selectionRect && this.selectionRect.parentNode) {
      this.selectionRect.parentNode.removeChild(this.selectionRect);
    }
    this.selectionRect = null;
    this.isDragging = false;
    this.dragButton = null;
  } // <-- cleanup


  // Ativa ferramenta e exibe painel de opcoes do zoom
  onAtivar() { 
    const panel = document.getElementById('zoom-options');
    const btnLupa = document.querySelector('[data-ferramenta="lupa"]');

    const rect = btnLupa.getBoundingClientRect();

    panel.style.top = `${rect.top}px`;
    panel.style.left = `${rect.right + 8}px`;

    panel.classList.remove('hidden');
    
    this.renderOptions();
    this.updateUI();

    this.svg.style.cursor = this.modo === 'drag' ? 'crosshair' : 'zoom-in';
  } // <-- onAtivar


  // Desativa ferramenta e limpa UI
  onDesativar() {
    this.cleanup();
    this.svg.style.cursor = 'default';

    const panel = document.getElementById('zoom-options');
    panel.classList.add('hidden');
    panel.innerHTML = '';

    this.setModo('click'); // reseta modo
  } // <-- onDesativar
} // <-- class LupaTool



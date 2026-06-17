import { estado } from '../core/StateManager.js';

const MARGEM_VISTA = 12;
const DESLOCAMENTO_CURSOR = 2;

function isRightButton(evento) {
  return evento.button === 2 || evento.buttons === 2;
}

function criarMenuContexto() {
  const menuContexto = document.createElement('aside');
  menuContexto.id = 'menu-contexto';
  menuContexto.className = 'menu-contexto';
  menuContexto.setAttribute('role', 'menu');
  menuContexto.setAttribute('aria-label', 'Menu de contexto');
  menuContexto.setAttribute('aria-hidden', 'true');
  menuContexto.hidden = true;

  const lista = document.createElement('ul');
  lista.className = 'menu-contexto__lista';
  lista.setAttribute('role', 'none');

  // Grupo 1: Edição básica
  const items = [
    { texto: 'Copiar', atalho: 'Ctrl+C', acao: 'copiar' },
    { texto: 'Colar', atalho: 'Ctrl+V', acao: 'colar' },
    { texto: 'Duplicar', atalho: 'Ctrl+D', acao: 'duplicar' },
    { tipo: 'separador' },
    { texto: 'Excluir', atalho: 'Delete', acao: 'excluir' },
  ];

  items.forEach((item) => {
    if (item.tipo === 'separador') {
      const li = document.createElement('li');
      li.className = 'menu-contexto__separador';
      li.setAttribute('role', 'none');
      const hr = document.createElement('hr');
      li.appendChild(hr);
      lista.appendChild(li);
    } else {
      const li = document.createElement('li');
      li.className = 'menu-contexto__item';
      li.setAttribute('role', 'none');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'menu-contexto__botao';
      btn.setAttribute('role', 'menuitem');
      btn.setAttribute('data-acao', item.acao);
      btn.textContent = item.texto;
      if (item.atalho) {
        btn.setAttribute('title', item.atalho);
      }

      li.appendChild(btn);
      lista.appendChild(li);
    }
  });

  menuContexto.appendChild(lista);
  document.body.appendChild(menuContexto);

  return menuContexto;
}

export function inicializarMenuContexto(svgCanvas) {
  if (!svgCanvas) {
    return null;
  }

  const menuContexto = criarMenuContexto();

  function fecharMenuContexto() {
    menuContexto.hidden = true;
    menuContexto.setAttribute('aria-hidden', 'true');
    menuContexto.style.visibility = 'hidden';
  }

  function abrirMenuContexto(evento) {
    evento.preventDefault();

    // Cancela a ferramenta ativa se houver operação em andamento
    if (estado.ferramentaAtual && typeof estado.ferramentaAtual.onDesativar === 'function') {
      estado.ferramentaAtual.onDesativar();
    }

    menuContexto.hidden = false;
    menuContexto.setAttribute('aria-hidden', 'false');

    menuContexto.style.visibility = 'hidden';
    menuContexto.style.left = '0px';
    menuContexto.style.top = '0px';

    const largura = menuContexto.offsetWidth;
    const altura = menuContexto.offsetHeight;

    let x = evento.clientX + DESLOCAMENTO_CURSOR;
    let y = evento.clientY + DESLOCAMENTO_CURSOR;

    if (x + largura + MARGEM_VISTA > window.innerWidth) {
      x = evento.clientX - largura - DESLOCAMENTO_CURSOR;
    }

    if (y + altura + MARGEM_VISTA > window.innerHeight) {
      y = evento.clientY - altura - DESLOCAMENTO_CURSOR;
    }

    x = Math.max(MARGEM_VISTA, Math.min(x, window.innerWidth - largura - MARGEM_VISTA));
    y = Math.max(MARGEM_VISTA, Math.min(y, window.innerHeight - altura - MARGEM_VISTA));

    menuContexto.style.left = `${Math.round(x)}px`;
    menuContexto.style.top = `${Math.round(y)}px`;
    menuContexto.style.visibility = 'visible';
  }

  function bloquearBotaoDireito(evento) {
    if (!isRightButton(evento)) {
      return;
    }

    evento.preventDefault();
    evento.stopImmediatePropagation();
  }

  function fecharAoClicarFora(evento) {
    if (menuContexto.hidden) return;

    if (menuContexto.contains(evento.target)) return;

    if (evento.button === 0) {
      fecharMenuContexto();
    }
  }

  svgCanvas.addEventListener('mousedown', bloquearBotaoDireito, true);
  svgCanvas.addEventListener('mousemove', bloquearBotaoDireito, true);
  svgCanvas.addEventListener('mouseup', bloquearBotaoDireito, true);
  svgCanvas.addEventListener('contextmenu', abrirMenuContexto);
  document.addEventListener('pointerdown', fecharAoClicarFora, true);
  window.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') {
      fecharMenuContexto();
    }
  });
  menuContexto.addEventListener('pointerdown', (evento) => {
    evento.stopPropagation();
  });

  return {
    abrir: abrirMenuContexto,
    fechar: fecharMenuContexto,
  };
}

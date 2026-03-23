# Editor Vetorial — Computação Gráfica 2026

Repositório da disciplina de Computação Gráfica (UFPA, 2026).

Este projeto implementa uma versão web simplificada de um **editor vetorial** (inspirado no Inkscape), utilizando manipulação direta do DOM de um elemento `<svg>` com **Vanilla JavaScript moderno (ES6 Modules)**. Nenhuma biblioteca externa ou Canvas API baseada em pixels é utilizada.

---

## 🗂️ Arquitetura Modular

O projeto foi estruturado de forma modular para facilitar o trabalho colaborativo. Cada arquivo tem uma única responsabilidade clara:

```
/
├── index.html              # Layout principal da aplicação (barra lateral, painel superior, canvas SVG)
├── css/
│   └── style.css           # Estilização com CSS Grid e Flexbox (tema escuro estilo desktop)
├── js/
│   ├── main.js             # Ponto de entrada: inicializa estado e registra event listeners globais
│   ├── core/
│   │   └── StateManager.js # Gerenciador de estado global (ferramentaAtual, cores, elementoSelecionado)
│   ├── utils/
│   │   └── svgHelpers.js   # Funções utilitárias SVG (criarElementoSVG, obterCoordenadaSVG)
│   └── tools/
│       └── ToolBase.js     # Classe base abstrata para todas as ferramentas de desenho
└── README.md               # Este arquivo
```

### Fluxo de Dados

```
Usuário interage com a UI
        │
        ▼
   main.js (event listeners)
        │
        ├──▶ StateManager.js  (atualiza estado global: ferramenta, cores, seleção)
        │
        └──▶ ToolBase (e subclasses)  (onMouseDown / onMouseMove / onMouseUp)
                        │
                        ▼
               svgHelpers.js  (cria/manipula elementos SVG no DOM)
```

### Módulos Principais

| Arquivo | Responsabilidade |
|---|---|
| `js/main.js` | Ponto de entrada. Conecta UI ao estado e delega eventos para a ferramenta ativa. |
| `js/core/StateManager.js` | Estado centralizado: `ferramentaAtual`, `corPreenchimento`, `corBorda`, `elementoSelecionado`. |
| `js/utils/svgHelpers.js` | Utilitários reutilizáveis: `criarElementoSVG()` e `obterCoordenadaSVG()`. |
| `js/tools/ToolBase.js` | Classe base com métodos `onMouseDown`, `onMouseMove`, `onMouseUp`, `onAtivar`, `onDesativar`. |

---

## 🚀 Como Rodar Localmente

Este projeto usa **ES6 Modules**, que requerem um servidor HTTP para funcionar (por restrições de CORS do navegador ao usar o protocolo `file://`).

### Opção 1: Live Server (VSCode) — Recomendado

1. Instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) no VSCode.
2. Abra a pasta do projeto no VSCode.
3. Clique com o botão direito no `index.html` → **"Open with Live Server"**.
4. O navegador abrirá automaticamente em `http://127.0.0.1:5500`.

### Opção 2: Python (sem dependências extras)

```bash
# Python 3
python -m http.server 8080
```

Depois acesse: `http://localhost:8080`

### Opção 3: Node.js com `npx`

```bash
npx serve .
```

---

## 🤝 Como Contribuir

1. Crie uma nova ferramenta estendendo `ToolBase` em `js/tools/`.
2. Importe e registre a ferramenta em `js/main.js`.
3. Todas as interações, commits, comentários de código e Pull Requests devem estar em **Português do Brasil (pt-BR)**, conforme as instruções em `.github/copilot-instructions.md`.

---

## 📄 Licença

Projeto educacional — Disciplina de Computação Gráfica, UFPA 2026.

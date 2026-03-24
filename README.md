# Editor Vetorial — Computação Gráfica 2026

Repositório da disciplina de Computação Gráfica (UFPA, 2026).

Este projeto implementa uma versão web simplificada de um **editor vetorial** (inspirado no Inkscape), utilizando manipulação direta do DOM de um elemento `<svg>` com **Vanilla JavaScript moderno (ES6 Modules)**. Nenhuma biblioteca externa ou Canvas API baseada em pixels é utilizada.

---

## 🎮 Gamificação e Recompensas

Para tornar o nosso desenvolvimento mais dinâmico e simular um ambiente de engenharia de software de alto nível, este repositório conta com um sistema de gamificação.

As suas contribuições e Pull Requests (PRs) não valem apenas nota, mas também **Badges (Medalhas)** de prestígio.

**Como funciona?**
1. Você abre um Pull Request com o seu plugin ou melhoria.
2. O professor faz o *Code Review*. Se o seu trabalho se destacar de alguma forma, o professor concederá uma badge diretamente nos comentários da sua PR.
3. Todo domingo à noite, nosso robô invisível (GitHub Actions) varre o repositório, contabiliza as badges e atualiza o **Hall da Fama** abaixo.

**As Badges que você pode conquistar:**
* 🤝 **O Salvador da Pátria:** Ajudou os colegas em discussões, revisões ou resolveu bloqueios da turma.
* 🐛 **Bug Catcher:** Encontrou e corrigiu um erro crítico no software.
* ⭐ **Código de Ouro:** Escreveu um código limpo, elegante, bem documentado e otimizado.
* 🧠 **Lógica Brilhante:** Implementou um algoritmo complexo de forma excepcional.
* 🎨 **UI/UX Master:** Criou uma interface ou controle absurdamente fácil e bonito de usar.
* 💻 **Enter the Matrix:** Dominou aplicação ou manipulação de matrizes e álgebra linear.

---

## 🏆 Hall da Fama - Placar Semanal da Turma

> 🤖 *O robô está aquecendo os motores... O primeiro placar oficial será atualizado neste domingo à noite!*

### ⌨️ Jack Bauer do Código
*Quem mais codificou na semana (Volume total de linhas mescladas)*

![Jack Bauer](/.github/images/memes/image_5.png)

🥇 **Ainda não há registros. Faça o primeiro PR!** (0 linhas mescladas)

---

### 🤝 John Coffey do grupo
*Quem mais ganhou a badge 🤝 O Salvador da Pátria*

![John Coffey](/.github/images/memes/image_6.png)

🥇 **Ainda não há registros. Ajude um colega!** (0 badges acumuladas)

---

### 🐛 Pokemon Bug Catcher
*Quem mais ganhou a badge 🐛 Bug Catcher*

![Bug Catcher](/.github/images/memes/image_7.png)

🥇 **Ainda não há registros. Encontre um erro!** (0 badges acumuladas)

---

### ⭐ Patrick Bateman da turma
*Quem mais ganhou a badge ⭐ Código de Ouro*

![Patrick Bateman](/.github/images/memes/image_8.png)

🥇 **Ainda não há registros. Escreva um código impecável!** (0 badges acumuladas)

---

### 🧠 John Nash da turma
*Quem mais ganhou a badge 🧠 Lógica Brilhante*

![John Nash](/.github/images/memes/image_9.png)

🥇 **Ainda não há registros. Mostre sua genialidade!** (0 badges acumuladas)

---

### 🎨 Da Vinci do Front-end
*Quem mais ganhou a badge 🎨 UI/UX Master*

![Da Vinci](/.github/images/memes/image_10.png)

🥇 **Ainda não há registros. Capriche na interface!** (0 badges acumuladas)

---

### 💻 Neo da turma
*Quem dominou o uso de matrizes e álgebra linear (Badge 💻 Enter the Matrix)*

![Neo](/.github/images/memes/image_11.png)

🥇 **Ainda não há registros. Manipule a matriz!** (0 badges acumuladas)

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

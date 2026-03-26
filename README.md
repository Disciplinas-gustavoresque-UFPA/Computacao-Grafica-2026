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

## 📌 Fluxo de Trabalho (Issues e PRs)

Para manter o repositório organizado, evitar conflitos e simular um ambiente real de desenvolvimento, temos duas formas de contribuir. Você é livre para propor melhorias em qualquer parte do código (interface, motor gráfico, estado, etc.), mas o fluxo abaixo deve ser sempre respeitado:

### Fluxo 1: Resolvendo uma Tarefa do Professor
1. **Escolha uma Issue e assuma a tarefa:** Vá na aba *Issues* do repositório, escolha uma tarefa e **deixe um comentário com o seu usuário (ex: "Vou desenvolver esta funcionalidade - @seu-nick")** para sinalizar que você é o responsável oficial por ela.
2. **Crie a Branch:** Crie uma branch associada a essa Issue (ex: `feature/tool-retangulo` ou `fix/bug-selecao`).
3. **Faça Commits Atômicos:** Recomendamos fortemente a prática de commits atômicos. Cada commit deve resolver um único problema ou adicionar uma única funcionalidade, sempre com uma mensagem clara e descritiva explicando a alteração.
4. **Abra um Draft PR:** Assim que fizer o seu primeiro commit, abra um Pull Request em modo **Draft** (Rascunho). Isso avisa à turma que você já está trabalhando ativamente nessa frente.
5. **Desenvolva:** Continue desenvolvendo a lógica e registrando seus avanços em novos commits atômicos.
6. **Revisão e Merge:** Quando finalizar, tire o PR do modo Draft e solicite a revisão (Review) do professor (`@gustavoresque`).

### Fluxo 2: Propondo Melhorias, UI/UX ou Correções
1. **Crie uma Issue:** Quer melhorar o CSS, otimizar o `StateManager.js` ou encontrou um bug de renderização no SVG? Abra uma nova Issue com a sua proposta e **insira o seu usuário (`@seu-nick`) na descrição.**
2. **Chame o Professor:** Mencione o professor (`@gustavoresque`) na Issue para avaliação.
3. **Aprovação:** O professor vai avaliar a viabilidade técnica e aprovar a Issue.
4. **Mão na Massa:** Com a ideia aprovada, siga os mesmos passos do Fluxo 1 (branch, commits atômicos, Draft PR, código e revisão).

---

## ⚖️ Políticas de Colaboração e Fluxo Ágil

Para garantir uma melhor organização no desenvolvimento, este repositório adota regras de colaboração baseadas em metodologias ágeis e práticas reais de projetos Open Source.

### 1. Ideação Livre (Criação de Issues)
O repositório é aberto para ideias. Qualquer aluno pode (e deve! Pois faz parte da avaliação também) abrir Issues sugerindo novos filtros, ferramentas, correções de bugs ou melhorias de interface a qualquer momento. No entanto, **abrir uma Issue não significa que você tem autorização imediata para codificá-la.**

### 2. O "Sinal Verde" (Lock e Autorização)
Você só pode criar uma branch e começar a escrever código para uma Issue após o professor aprovar e "travar" a tarefa para você.
* **Como solicitar:** Deixe um comentário na Issue dizendo *"Quero assumir esta tarefa - @seu-nick"* ou algo assim.
* **Aprovação:** O professor avaliará a solicitação e adicionará uma label (ex: `Aprovada`), atribuindo você oficialmente como o responsável (Assignee).

### 3. Propriedade e Trabalho em Equipe (Ownership)
O aluno que recebeu a autorização (Assignee) torna-se o **"Tech Lead"** daquela tarefa. 
* Outros colegas podem ajudar discutindo soluções na Issue ou até mesmo enviando commits secundários para a sua branch, mas o Assignee é o responsável final por organizar o código, fechar o escopo e solicitar a revisão do professor.

### 4. Limite Anti-Monopólio (WIP Limit = 1)
Para evitar o bloquei de threads (que um aluno pegue simultaneamente multiplas issues), adotamos um limite de Trabalho em Progresso (*Work In Progress*).
* **Regra de Ouro:** Cada aluno só pode ter **1 (uma)** branch ativa por vez.
* Você só poderá reivindicar uma nova tarefa após ter aberto o Pull Request da sua tarefa atual e solicitado a revisão (Review) do professor. Enquanto o seu código estiver em desenvolvimento, seu foco deve ser exclusivo nessa branch.

---

## 🛠️ Como Criar uma Nova Ferramenta

Embora você possa contribuir alterando a arquitetura global do projeto, a contribuição mais comum será a adição de novas ferramentas vetoriais de desenho (linhas, polígonos, elipses, etc.).

Para garantir que a sua nova ferramenta se integre perfeitamente à arquitetura do software, siga este padrão:

1. **Crie o Módulo da Ferramenta:** Na pasta `js/tools/`, crie um arquivo com o nome da sua funcionalidade (ex: `RetanguloTool.js`).
2. **Estenda a Classe Base:** O seu módulo deve importar e estender a classe abstrata `ToolBase`.
3. **Sobrescreva os Eventos de Mouse:** Implemente a sua lógica matemática e as chamadas de renderização SVG (usando o `svgHelpers.js`) sobrescrevendo os métodos principais de ciclo de vida:
   - `onMouseDown(evento, coordenadas)`: Disparado no clique inicial.
   - `onMouseMove(evento, coordenadas)`: Disparado ao arrastar o mouse.
   - `onMouseUp(evento, coordenadas)`: Disparado ao soltar o clique final.
4. **Registre a Ferramenta:** Vá no arquivo principal `js/main.js`, importe a classe que você acabou de criar e adicione-a ao seletor de ferramentas do sistema. Assim, ela passará a ouvir os eventos globais do `<svg>` quando for selecionada na interface.

---

## 📄 Licença

Projeto educacional — Disciplina de Computação Gráfica, UFPA 2026.

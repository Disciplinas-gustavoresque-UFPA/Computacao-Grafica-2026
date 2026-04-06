import os
import re
import requests
from datetime import datetime, timedelta
from collections import defaultdict

# --- CONFIGURAÇÃO ---
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
REPO_OWNER = os.getenv('GITHUB_REPOSITORY_OWNER')
REPO_NAME = os.getenv('GITHUB_REPOSITORY').split('/')[1]
PROFESSOR_USER = "gustavoresque" # Seu usuário exato do GitHub

BASE_URL = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

CONFIG_RANKINGS = {
    "volume": {"titulo": "⌨️ Jack Bauer do Código", "desc": "Volume total de linhas mescladas", "imagem": "/.github/images/memes/image_5.png", "badge": None},
    "salvador": {"titulo": "🤝 John Coffey do grupo", "desc": "Badge 🤝 O Salvador da Pátria", "imagem": "/.github/images/memes/image_6.png", "badge": "🤝 O Salvador da Pátria"},
    "bug": {"titulo": "🐛 Pokemon Bug Catcher", "desc": "Badge 🐛 Bug Catcher", "imagem": "/.github/images/memes/image_7.png", "badge": "🐛 Bug Catcher"},
    "ouro": {"titulo": "⭐ Patrick Bateman da turma", "desc": "Badge ⭐ Código de Ouro", "imagem": "/.github/images/memes/image_8.png", "badge": "⭐ Código de Ouro"},
    "logica": {"titulo": "🧠 John Nash da turma", "desc": "Badge 🧠 Lógica Brilhante", "imagem": "/.github/images/memes/image_9.png", "badge": "🧠 Lógica Brilhante"},
    "uiux": {"titulo": "🎨 Da Vinci do Front-end", "desc": "Badge 🎨 UI/UX Master", "imagem": "/.github/images/memes/image_10.png", "badge": "🎨 UI/UX Master"},
    "matrix": {"titulo": "💻 Neo da turma", "desc": "Badge 💻 Enter the Matrix", "imagem": "/.github/images/memes/image_11.png", "badge": "💻 Enter the Matrix"},
    
    # NOVAS BADGES DE CODE REVIEW
    "gandalf": {"titulo": "🧙‍♂️ O Gandalf do Code Review", "desc": "Badge 🛡️ Guardião do Merge", "imagem": "/.github/images/memes/image_12.png", "badge": "🛡️ Guardião do Merge"},
    "sherlock": {"titulo": "🕵️ O Sherlock Holmes da Turma", "desc": "Badge 🔎 Detetive do Código", "imagem": "/.github/images/memes/image_13.png", "badge": "🔎 Detetive do Código"},
    "heimdall": {"titulo": "👁️ O Heimdall do Repositório", "desc": "Badge 🌉 Guardião da Bifrost", "imagem": "/.github/images/memes/image_14.png", "badge": "🌉 Guardião da Bifrost"},
    "edna": {"titulo": "👓 A Edna Moda do Código", "desc": "Badge 📐 Revisor Implacável", "imagem": "/.github/images/memes/image_15.png", "badge": "📐 Revisor Implacável"}
}

REGEX_BADGE = r"@(\w+)\s+ganhou\s+uma\s+badge\s+de\s+(.*)"

def buscar_prs_recentes():
    uma_semana_atras = (datetime.now() - timedelta(days=7)).isoformat()
    url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/pulls"
    params = {"state": "all", "sort": "updated", "direction": "desc", "per_page": 100}
    prs = []
    response = requests.get(url, headers=HEADERS, params=params)
    if response.status_code == 200:
        for pr in response.json():
            if pr['updated_at'] >= uma_semana_atras:
                prs.append(pr)
    return prs

def processar_contribuicoes(prs):
    data = defaultdict(lambda: defaultdict(int))
    for pr in prs:
        author = pr['user']['login']
        pr_number = pr['number']
        
        # 1. Volume de Código
        if pr.get('merged_at'):
            pr_detail_url = pr['_links']['self']['href']
            res_detail = requests.get(pr_detail_url, headers=HEADERS)
            if res_detail.status_code == 200:
                linhas = res_detail.json().get('additions', 0) + res_detail.json().get('deletions', 0)
                data["volume"][author] += linhas

        todos_comentarios = []

        # 2a. Comentários Gerais (Conversation)
        comments_url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues/{pr_number}/comments"
        res_comments = requests.get(comments_url, headers=HEADERS)
        if res_comments.status_code == 200:
            todos_comentarios.extend(res_comments.json())
        
        # 2b. Comentários Inline (Files changed)
        review_comments_url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/pulls/{pr_number}/comments"
        res_review = requests.get(review_comments_url, headers=HEADERS)
        if res_review.status_code == 200:
            todos_comentarios.extend(res_review.json())

        # 3. Processa e conta badges
        for comment in todos_comentarios:
            if comment.get('user', {}).get('login') == PROFESSOR_USER:
                body = comment.get('body', '')
                match = re.search(REGEX_BADGE, body)
                if match:
                    aluno_premiado = match.group(1)
                    badge_texto = match.group(2).strip()
                    for ranking_id, config in CONFIG_RANKINGS.items():
                        if config['badge'] == badge_texto:
                            data[ranking_id][aluno_premiado] += 1
                            break
    return data

def gerar_markdown_readme(data):
    md = f"> 🤖 *Placar atualizado automaticamente em: {datetime.now().strftime('%d/%m/%Y %H:%M')}*\n\n"
    for ranking_id, config in CONFIG_RANKINGS.items():
        # A imagem e o título são gerados sempre
        md += f"### {config['titulo']}\n*{config['desc']}*\n\n![{config['titulo']}]({config['imagem']})\n\n"
        
        ranking_alunos = data[ranking_id]
        if not ranking_alunos:
            # Se ninguém ganhou, mostra a mensagem e passa para o próximo
            md += "🥇 **Ainda não há registros nesta semana.**\n\n---\n\n"
            continue
            
        sorted_alunos = sorted(ranking_alunos.items(), key=lambda item: item[1], reverse=True)
        top_aluno, top_score = sorted_alunos[0]
        score_str = f"{top_score} linhas mescladas" if ranking_id == "volume" else f"{top_score} badges acumuladas"

        md += f"🥇 **@{top_aluno}** ({score_str})\n\n"
        
        if len(sorted_alunos) > 1:
            md += "<details><summary>Ver Top 3 completo</summary>\n\n"
            for i, (aluno, score) in enumerate(sorted_alunos[:3]):
                medal = "🥇" if i == 0 else "🥈" if i == 1 else "🥉"
                md += f"{medal} @{aluno} ({score})\n"
            md += "\n</details>\n\n"
        md += "---\n\n"
    return md

def atualizar_readme(novo_conteudo):
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()
    pattern = re.compile(r"(\n)(.*)(\n)", re.DOTALL)
    novo_readme = pattern.sub(f"\\1\n{novo_conteudo}\\3", readme)
    
    # Fallback caso os comentários não existam
    if novo_readme == readme:
       pattern = re.compile(r"(> 🤖 \*O robô está aquecendo os motores.*?)(?=\n## 📌 Fluxo de Trabalho)", re.DOTALL)
       novo_readme = pattern.sub(f"{novo_conteudo}", readme)

    with open("README.md", "w", encoding="utf-8") as f:
        f.write(novo_readme)
    print("README.md atualizado!")

def atualizar_historico(data):
    """Grava o registro completo de todos os alunos da semana fazendo um append no MD."""
    data_formatada = datetime.now().strftime('%d/%m/%Y')
    
    # Verifica se alguém pontuou para não encher o histórico de semanas vazias
    teve_pontuacao = any(len(alunos) > 0 for alunos in data.values())
    if not teve_pontuacao:
        print("Nenhuma pontuação nesta semana. Histórico não alterado.")
        return

    md_historico = f"\n## 📅 Semana de {data_formatada}\n\n"
    
    for ranking_id, config in CONFIG_RANKINGS.items():
        ranking_alunos = data[ranking_id]
        if not ranking_alunos:
            continue
            
        md_historico += f"### {config['titulo']}\n"
        sorted_alunos = sorted(ranking_alunos.items(), key=lambda item: item[1], reverse=True)
        
        for posicao, (aluno, score) in enumerate(sorted_alunos, start=1):
            score_str = "linhas" if ranking_id == "volume" else "badges"
            md_historico += f"{posicao}. **@{aluno}** - {score} {score_str}\n"
        md_historico += "\n"

    arquivo_existe = os.path.exists("HISTORICO_PLACAR.md")
    with open("HISTORICO_PLACAR.md", "a", encoding="utf-8") as f:
        if not arquivo_existe:
            f.write("# 📚 Histórico Completo do Placar Semanal\n\n")
            f.write("Registro contínuo de todas as pontuações e badges atribuídas durante a disciplina.\n")
        f.write(md_historico)
    print("HISTORICO_PLACAR.md atualizado com sucesso!")

# --- EXECUÇÃO ---
if __name__ == "__main__":
    prs = buscar_prs_recentes()
    contribuicoes = processar_contribuicoes(prs)
    
    markdown_readme = gerar_markdown_readme(contribuicoes)
    atualizar_readme(markdown_readme)
    atualizar_historico(contribuicoes)
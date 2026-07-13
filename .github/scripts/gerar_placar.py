import os
import re
import requests
from datetime import datetime, timedelta
from collections import defaultdict

# --- CONFIGURAÇÃO ---
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
REPO_OWNER = os.getenv('GITHUB_REPOSITORY_OWNER')
REPO_NAME = os.getenv('GITHUB_REPOSITORY').split('/')[1]
PROFESSOR_USER = "gustavoresque"

# Lista de usuários que NÃO devem aparecer no placar ou nas métricas
IGNORE_USERS = {"gustavoresque", "copilot", "github-actions[bot]"}

def deve_ignorar(login):
    return login.lower() in IGNORE_USERS

BASE_URL = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

CONFIG_RANKINGS = {
    "volume": {"titulo": "⌨️ Jack Bauer do Código", "badge": None},
    "salvador": {"titulo": "🤝 John Coffey do grupo", "badge": "🤝 O Salvador da Pátria"},
    "bug": {"titulo": "🐛 Pokemon Bug Catcher", "badge": "🐛 Bug Catcher"},
    "ouro": {"titulo": "⭐ Patrick Bateman da turma", "badge": "⭐ Código de Ouro"},
    "logica": {"titulo": "🧠 John Nash da turma", "badge": "🧠 Lógica Brilhante"},
    "uiux": {"titulo": "🎨 Da Vinci do Front-end", "badge": "🎨 UI/UX Master"},
    "matrix": {"titulo": "💻 Neo da turma", "badge": "💻 Enter the Matrix"},
    "gandalf": {"titulo": "🧙‍♂️ O Gandalf do Code Review", "badge": "🛡️ Guardião do Merge"},
    "sherlock": {"titulo": "🕵️ O Sherlock Holmes da Turma", "badge": "🔎 Detetive do Código"},
    "heimdall": {"titulo": "👁️ O Heimdall do Repositório", "badge": "🌉 Guardião da Bifrost"},
    "edna": {"titulo": "👓 A Edna Moda do Código", "badge": "📐 Revisor Implacável"}
}

# Coleta automaticamente os nomes exatos de todas as badges configuradas (ignorando as que são None)
lista_badges = [re.escape(config["badge"]) for config in CONFIG_RANKINGS.values() if config["badge"]]
padrao_badges = "|".join(lista_badges)

# Regex Dinâmica: @nickname + (qualquer coisa ou nada) + Nome Exato da Badge
# re.DOTALL permite que o "qualquer coisa" (.*?) inclua quebras de linha
REGEX_BADGE = re.compile(rf"@([\w-]+).*?({padrao_badges})", re.DOTALL)

def buscar_atividades_recentes():
    """Busca TODAS as Issues e PRs que tiveram alguma atividade na última semana."""
    uma_semana_atras = (datetime.now() - timedelta(days=7)).isoformat()
    # A API de issues traz tanto Issues quanto PRs
    url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues"
    params = {"state": "all", "since": uma_semana_atras, "per_page": 100}
    
    atividades = []
    page = 1
    while True:
        params['page'] = page
        res = requests.get(url, headers=HEADERS, params=params)
        if res.status_code != 200 or not res.json():
            break
        atividades.extend(res.json())
        page += 1
        
    return atividades, uma_semana_atras

def processar_dados(atividades, uma_semana_atras):
    data_badges = defaultdict(lambda: defaultdict(int))
    # Dicionário para capturar as novas métricas de engajamento
    engajamento = defaultdict(lambda: {"issues": 0, "prs": 0, "com_proprio": 0, "com_outros": 0, "com_review": 0})
    
    for item in atividades:
        numero = item['number']
        autor_item = item['user']['login']
        eh_pr = 'pull_request' in item
        
        # 1. Conta criação de Issue ou PR (apenas se foi criado nos últimos 7 dias)
        if item['created_at'] >= uma_semana_atras and not deve_ignorar(autor_item):
            if eh_pr:
                engajamento[autor_item]["prs"] += 1
            else:
                engajamento[autor_item]["issues"] += 1
                
        # 2. Se for PR e foi merged na última semana, conta linhas de código
        if eh_pr and item.get('pull_request', {}).get('merged_at'):
            pr_url = item['pull_request']['url']
            res_pr = requests.get(pr_url, headers=HEADERS)
            if res_pr.status_code == 200:
                pr_data = res_pr.json()
                if pr_data.get('merged_at') and pr_data['merged_at'] >= uma_semana_atras:
                    if not deve_ignorar(autor_item):
                        linhas = pr_data.get('additions', 0) + pr_data.get('deletions', 0)
                        data_badges["volume"][autor_item] += linhas

        # 3. Busca comentários gerais na Issue/PR
        comments_url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/issues/{numero}/comments"
        res_comments = requests.get(comments_url, headers=HEADERS, params={"since": uma_semana_atras})
        
        if res_comments.status_code == 200:
            for comment in res_comments.json():
                autor_comentario = comment['user']['login']
                
                # Checa se é o professor dando badge
                if autor_comentario == PROFESSOR_USER:
                    match = re.search(REGEX_BADGE, comment.get('body', ''))
                    if match:
                        aluno_premiado = match.group(1)
                        if not deve_ignorar(aluno_premiado):
                            badge_texto = match.group(2).strip()
                            for ranking_id, config in CONFIG_RANKINGS.items():
                                if config['badge'] == badge_texto:
                                    data_badges[ranking_id][aluno_premiado] += 1
                                    break
                
                # Conta métricas de comentário (próprio vs outros)
                if not deve_ignorar(autor_comentario):
                    if autor_comentario == autor_item:
                        engajamento[autor_comentario]["com_proprio"] += 1
                    else:
                        engajamento[autor_comentario]["com_outros"] += 1

        # 4. Busca comentários de Review de Código (Apenas se for PR)
        if eh_pr:
            review_comments_url = f"{BASE_URL}/repos/{REPO_OWNER}/{REPO_NAME}/pulls/{numero}/comments"
            res_review = requests.get(review_comments_url, headers=HEADERS, params={"since": uma_semana_atras})
            
            if res_review.status_code == 200:
                for comment in res_review.json():
                    autor_comentario = comment['user']['login']
                    
                    # Checa badges do professor no review
                    if autor_comentario == PROFESSOR_USER:
                        match = re.search(REGEX_BADGE, comment.get('body', ''))
                        if match:
                            aluno_premiado = match.group(1)
                            if not deve_ignorar(aluno_premiado):
                                badge_texto = match.group(2).strip()
                                for ranking_id, config in CONFIG_RANKINGS.items():
                                    if config['badge'] == badge_texto:
                                        data_badges[ranking_id][aluno_premiado] += 1
                                        break
                    
                    # Conta comentário como Code Review
                    if not deve_ignorar(autor_comentario):
                        engajamento[autor_comentario]["com_review"] += 1

    return data_badges, engajamento

def _detectar_newline(path):
    """Detecta se o arquivo usa CRLF ou LF, pra preservar o estilo na escrita."""
    with open(path, "rb") as f:
        amostra = f.read(8192)
    return "\r\n" if b"\r\n" in amostra else "\n"

def ler_acumulado_historico():
    """Lê o HISTORICO_PLACAR.md e retorna o total acumulado por aluno em cada ranking."""
    acumulado = defaultdict(lambda: defaultdict(int))
    if not os.path.exists("HISTORICO_PLACAR.md"):
        return acumulado

    titulo_para_id = {config["titulo"]: rid for rid, config in CONFIG_RANKINGS.items()}

    with open("HISTORICO_PLACAR.md", "r", encoding="utf-8") as f:
        conteudo = f.read()

    ranking_atual = None
    for linha in conteudo.split("\n"):
        linha_strip = linha.strip()
        m_titulo = re.match(r"^####\s+(.+)$", linha_strip)
        if m_titulo:
            ranking_atual = titulo_para_id.get(m_titulo.group(1).strip())
            continue
        if re.match(r"^#{1,3}\s", linha_strip):
            ranking_atual = None
            continue
        if ranking_atual:
            m = re.match(r"^\d+\.\s+\*\*@([\w-]+)\*\*\s+-\s+(\d+)", linha_strip)
            if m:
                acumulado[ranking_atual][m.group(1)] += int(m.group(2))

    return acumulado

def atualizar_readme(acumulado):
    """Atualiza o README com o ranking acumulado lido do histórico completo."""
    newline_readme = _detectar_newline("README.md")
    with open("README.md", "r", encoding="utf-8") as f:
        readme = f.read()

    data_atual = datetime.now().strftime('%d/%m/%Y %H:%M')
    readme = re.sub(
        r"(> 🤖 \*).*?(?=\*)",
        f"\\g<1>Placar atualizado automaticamente em: {data_atual}",
        readme
    )

    for ranking_id, config in CONFIG_RANKINGS.items():
        ranking_alunos = acumulado[ranking_id]
        titulo = config["titulo"]

        if not ranking_alunos:
            texto_vencedores = "🥇 **Ainda não há registros.**"
        else:
            sorted_alunos = sorted(ranking_alunos.items(), key=lambda item: item[1], reverse=True)
            top_aluno, top_score = sorted_alunos[0]
            score_str = f"{top_score} linhas mescladas" if ranking_id == "volume" else f"{top_score} badges acumuladas"

            texto_vencedores = f"🥇 **@{top_aluno}** ({score_str})"

            if len(sorted_alunos) > 1:
                texto_vencedores += "\n\n<details><summary>Ver Top 3 completo</summary>\n\n"
                for i, (aluno, score) in enumerate(sorted_alunos[:3]):
                    medal = "🥇" if i == 0 else "🥈" if i == 1 else "🥉"
                    texto_vencedores += f"{medal} @{aluno} ({score})\n"
                texto_vencedores += "\n</details>"

        padrao = re.compile(rf"(### {re.escape(titulo)}.*?\n!\[.*?\]\(.*?\)\n+)(.*?)(?=\n+---)", re.DOTALL)
        readme = padrao.sub(f"\\g<1>{texto_vencedores}", readme)

    with open("README.md", "w", encoding="utf-8", newline=newline_readme) as f:
        f.write(readme)
    print("README.md atualizado com sucesso!")

def atualizar_historico(data_badges, engajamento):
    """Adiciona/atualiza a seção da semana atual no HISTORICO_PLACAR.md (idempotente)."""
    data_formatada = datetime.now().strftime('%d/%m/%Y')

    teve_pontuacao = any(len(alunos) > 0 for alunos in data_badges.values())
    teve_engajamento = len(engajamento) > 0

    if not teve_pontuacao and not teve_engajamento:
        print("Nenhuma atividade nesta semana. Histórico não alterado.")
        return

    md_secao = f"## 📅 Semana de {data_formatada}\n\n"

    if teve_engajamento:
        md_secao += "### 📊 Métricas de Engajamento da Semana\n"
        md_secao += "| Aluno | Issues Abertas | PRs Abertos | Comentários (Próprios) | Comentários (Outros) | Code Reviews |\n"
        md_secao += "| :--- | :---: | :---: | :---: | :---: | :---: |\n"
        eng_ordenado = sorted(engajamento.items(), key=lambda x: sum(x[1].values()), reverse=True)
        for aluno, stats in eng_ordenado:
            md_secao += f"| **@{aluno}** | {stats['issues']} | {stats['prs']} | {stats['com_proprio']} | {stats['com_outros']} | {stats['com_review']} |\n"
        md_secao += "\n---\n\n"

    if teve_pontuacao:
        md_secao += "### 🏆 Badges Conquistadas\n"
        for ranking_id, config in CONFIG_RANKINGS.items():
            ranking_alunos = data_badges[ranking_id]
            if not ranking_alunos:
                continue
            md_secao += f"#### {config['titulo']}\n"
            sorted_alunos = sorted(ranking_alunos.items(), key=lambda item: item[1], reverse=True)
            for posicao, (aluno, score) in enumerate(sorted_alunos, start=1):
                score_str = "linhas" if ranking_id == "volume" else "badges"
                md_secao += f"{posicao}. **@{aluno}** - {score} {score_str}\n"
            md_secao += "\n"

    cabecalho = (
        "# 📚 Histórico Completo do Placar Semanal\n\n"
        "Registro contínuo das métricas de engajamento, pontuações e badges atribuídas.\n"
    )

    if os.path.exists("HISTORICO_PLACAR.md"):
        newline_hist = _detectar_newline("HISTORICO_PLACAR.md")
        with open("HISTORICO_PLACAR.md", "r", encoding="utf-8") as f:
            conteudo = f.read()
        # Remove seção existente da mesma data, se houver, pra manter idempotência
        padrao_existente = re.compile(
            rf"\n*## 📅 Semana de {re.escape(data_formatada)}\n.*?(?=\n## 📅 Semana de |\Z)",
            re.DOTALL
        )
        conteudo = padrao_existente.sub("", conteudo)
        conteudo = conteudo.rstrip() + "\n\n" + md_secao
    else:
        newline_hist = _detectar_newline("README.md") if os.path.exists("README.md") else "\n"
        conteudo = cabecalho + "\n" + md_secao

    with open("HISTORICO_PLACAR.md", "w", encoding="utf-8", newline=newline_hist) as f:
        f.write(conteudo)
    print("HISTORICO_PLACAR.md atualizado com sucesso!")

# --- EXECUÇÃO ---
if __name__ == "__main__":
    atividades, uma_semana_atras = buscar_atividades_recentes()
    data_badges, engajamento = processar_dados(atividades, uma_semana_atras)

    atualizar_historico(data_badges, engajamento)
    acumulado = ler_acumulado_historico()
    atualizar_readme(acumulado)
import json
from pathlib import Path
from datetime import datetime

# Caminhos
pasta_base = Path(r"C:\Users\Administrator\Desktop\script_imagens\atualizar_produtos\New folder")
saida_dir = pasta_base / "produtos"
saida_dir.mkdir(exist_ok=True)
index_path = pasta_base / "produtos_index.json"

json_novos_path = pasta_base / "produtos_novos.json"

# Tamanho dos blocos
TAMANHO_BLOCO = 50000

# Determina o dia
hoje = datetime.now()
sabado = hoje.weekday() == 3

# Carrega produtos novos
with open(json_novos_path, "r", encoding="utf-8") as f:
    novos = json.load(f)

# ===============================
# CARREGAR BASE ANTIGA (SE NÃO FOR SÁBADO)
# ===============================
antigos = []
if not sabado:
    print("📂 Carregando base antiga...")
    pasta_produtos = saida_dir
    arquivos_antigos = sorted(pasta_produtos.glob("produtos_*.json"))
    for arquivo in arquivos_antigos:
        with open(arquivo, "r", encoding="utf-8") as f:
            antigos += json.load(f)
else:
    print("🗑️ Sábado: base antiga será ignorada, criando nova base apenas com produtos novos.")

# ===============================
# MAPA CLASSIFICAÇÃO → CATEGORIA
# ===============================
mapa_classificacao_categoria = {}
for item in antigos:
    if "Classificacao" in item and "Categoria" in item:
        prefixo = item["Classificacao"][:7]
        if prefixo not in mapa_classificacao_categoria:
            mapa_classificacao_categoria[prefixo] = item["Categoria"]

# ===============================
# CONVERTE NOVOS PRODUTOS
# ===============================
novos_convertidos = []
for item in novos:
    prefixo = item["CLASSIFICACAO"][:7]
    categoria = mapa_classificacao_categoria.get(prefixo)
    if sabado or categoria:  # no sábado, categoria pode ser vazia
        novos_convertidos.append({
            "Referencia": item["ITEM"],
            "Descricao": item["DESCRICAO"],
            "Categoria": categoria or "",
            "Classificacao": item["CLASSIFICACAO"]
        })

# ===============================
# JUNTAR TUDO
# ===============================
atualizado = antigos + novos_convertidos
print(f"📦 Total de produtos após merge: {len(atualizado)}")

# ===============================
# DIVIDIR EM ARQUIVOS
# ===============================
arquivos = []
for i in range(0, len(atualizado), TAMANHO_BLOCO):
    bloco = atualizado[i:i + TAMANHO_BLOCO]
    nome_arquivo = f"produtos_{i//TAMANHO_BLOCO:03}.json"
    caminho = saida_dir / nome_arquivo
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(bloco, f, ensure_ascii=False, indent=2)
    arquivos.append(nome_arquivo)
    print(f"✅ Gerado {nome_arquivo} ({len(bloco)} itens)")

# ===============================
# GERAR INDEX
# ===============================
index = {"arquivos": arquivos}
with open(index_path, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print(f"\n📑 Index criado: {index_path}")
print(f"🧮 Itens novos adicionados: {len(novos_convertidos)}")
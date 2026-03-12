import json
from pathlib import Path

# Caminhos dos arquivos
json_antigo_path = Path(r"C:\Users\Administrator\Desktop\script_imagens\atualizar_produtos\New folder\produtos.json")
json_novos_path = Path(r"C:\Users\Administrator\Desktop\script_imagens\atualizar_produtos\produtos_novos.json")

# Pasta de saída
saida_dir = Path(r"C:\Users\Administrator\Desktop\script_imagens\atualizar_produtos\New folder\produtos")
saida_dir.mkdir(exist_ok=True)

index_path = Path(r"C:\Users\Administrator\Desktop\script_imagens\atualizar_produtos\New folder\produtos_index.json")

# Quantos produtos por arquivo
TAMANHO_BLOCO = 50000

# Carrega os dados antigos
with open(json_antigo_path, "r", encoding="utf-8") as f:
    antigos = json.load(f)

# Carrega os dados novos
with open(json_novos_path, "r", encoding="utf-8") as f:
    novos = json.load(f)

# Cria um mapa classificação → categoria
mapa_classificacao_categoria = {}
for item in antigos:
    if "Classificacao" in item and "Categoria" in item:
        prefixo = item["Classificacao"][:7]
        if prefixo not in mapa_classificacao_categoria:
            mapa_classificacao_categoria[prefixo] = item["Categoria"]

# Converte os novos itens
novos_convertidos = []

for item in novos:
    prefixo = item["CLASSIFICACAO"][:7]
    categoria = mapa_classificacao_categoria.get(prefixo)

    if categoria:
        novos_convertidos.append({
            "Referencia": item["ITEM"],
            "Descricao": item["DESCRICAO"],
            "Categoria": categoria,
            "Classificacao": item["CLASSIFICACAO"]
        })

# Junta tudo
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
        json.dump(bloco, f, ensure_ascii=False)

    arquivos.append(nome_arquivo)

    print(f"✅ Gerado {nome_arquivo} ({len(bloco)} itens)")

# ===============================
# GERAR INDEX
# ===============================

index = {
    "arquivos": arquivos
}

with open(index_path, "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False)

print(f"\n📑 Index criado: {index_path}")
print(f"🧮 Itens novos adicionados: {len(novos_convertidos)}")
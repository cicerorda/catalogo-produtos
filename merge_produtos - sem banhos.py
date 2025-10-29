import json
import shutil
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# Caminhos dos arquivos
json_antigo_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\produtos.json")
json_novos_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\produtos_novos.json")
json_saida_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\produtos.json")

# ===== Filtro de prefixos permitidos =====
ALLOWED_PREFIXES_4 = {"4040", "4020", "3090", "3040", "3050", "3060", "3075", "3080"}

# ===== Utils =====
def safe_str(v, default=""):
    return v if isinstance(v, str) else default

def class_prefix(cls, n=7):
    cls = safe_str(cls)
    return cls[:n] if len(cls) >= n else cls

def extrair_blocos_aa_bb_ccc(cls: str):
    cls = safe_str(cls)
    aa = cls[0:2] if len(cls) >= 2 else ""
    bb = cls[2:4] if len(cls) >= 4 else ""
    ccc = cls[4:7] if len(cls) >= 7 else ""
    return aa, bb, ccc

def gerar_categoria_prefixo7_mais_descricao(cls: str, descricao: str) -> str:
    """ Monta 'AA_BB_CCC_<DESCRICAO>' """
    aa, bb, ccc = extrair_blocos_aa_bb_ccc(cls)
    return f"{aa}_{bb}_{ccc}_{descricao.strip()}"

def contem_palavra_chave(desc: str) -> bool:
    """Retorna True se 'BRUTA' ou 'BANHO' estiver na descrição."""
    desc_upper = safe_str(desc).upper()
    return "BRUTA" in desc_upper or "BANHO" in desc_upper

# ===== Carrega =====
with open(json_antigo_path, "r", encoding="utf-8") as f:
    antigos = json.load(f)

with open(json_novos_path, "r", encoding="utf-8") as f:
    novos = json.load(f)

# ===== Backup =====
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = json_antigo_path.with_name(f"{json_antigo_path.stem}.backup-{timestamp}{json_antigo_path.suffix}")
shutil.copy(json_antigo_path, backup_path)

# ===== Limpa o JSON antigo: mantém só BRUTA/BANHO =====
antigos_filtrados = []
for it in antigos:
    if contem_palavra_chave(it.get("Descricao", "")):
        antigos_filtrados.append(it)
antigos = antigos_filtrados

# ===== Mapa prefixo(7) -> Categoria =====
por_prefixo7 = defaultdict(list)
for it in antigos:
    cls_ant = safe_str(it.get("Classificacao"))
    cat_ant = safe_str(it.get("Categoria"))
    if cls_ant and cat_ant:
        por_prefixo7[class_prefix(cls_ant, 7)].append(cat_ant)

mapa_classificacao_categoria = {}
for pref7, cats in por_prefixo7.items():
    mapa_classificacao_categoria[pref7] = Counter(cats).most_common(1)[0][0]

# ===== Índice por Referencia =====
antigos_by_ref = {}
for it in antigos:
    ref = safe_str(it.get("Referencia"))
    if ref:
        antigos_by_ref[ref] = it

# ===== Processamento dos novos =====
novos_convertidos = []
skip_sem_campos = 0
skip_prefixo_nao_permitido = 0
skip_desc_sem_palavra_chave = 0
skip_duplicado_sem_mudanca = 0
atualizados = 0
categorias_criadas = set()

for raw in novos:
    cls = safe_str(raw.get("CLASSIFICACAO"))
    ref = safe_str(raw.get("ITEM"))
    desc = safe_str(raw.get("DESCRICAO"))

    if not (cls and ref and desc):
        skip_sem_campos += 1
        continue

    # filtro por descrição
    if not contem_palavra_chave(desc):
        skip_desc_sem_palavra_chave += 1
        continue

    # filtro por prefixo
    if cls[:4] not in ALLOWED_PREFIXES_4:
        skip_prefixo_nao_permitido += 1
        continue

    # categoria
    pref7 = class_prefix(cls, 7)
    categoria = mapa_classificacao_categoria.get(pref7)
    if not categoria:
        categoria = gerar_categoria_prefixo7_mais_descricao(cls, desc)
        categorias_criadas.add(categoria)
        mapa_classificacao_categoria[pref7] = categoria

    convertido = {
        "Referencia": ref,
        "Descricao": desc,
        "Categoria": categoria,
        "Classificacao": cls
    }

    if ref in antigos_by_ref:
        base = antigos_by_ref[ref]
        changed = False
        if desc and desc != safe_str(base.get("Descricao")):
            base["Descricao"] = desc
            changed = True
        if cls and cls != safe_str(base.get("Classificacao")):
            base["Classificacao"] = cls
            changed = True
        if categoria and categoria != safe_str(base.get("Categoria")):
            base["Categoria"] = categoria
            changed = True
        if changed:
            atualizados += 1
        else:
            skip_duplicado_sem_mudanca += 1
    else:
        novos_convertidos.append(convertido)
        antigos_by_ref[ref] = convertido

# ===== Resultado =====
atualizado = list(antigos_by_ref.values())

with open(json_saida_path, "w", encoding="utf-8") as f:
    json.dump(atualizado, f, ensure_ascii=False, indent=2)

# ===== Relatório =====
print(f"✅ Arquivo mesclado salvo em: {json_saida_path}")
print(f"💾 Backup criado: {backup_path}")
print(f"🧹 Itens removidos do antigo sem 'BRUTA'/'BANHO': {len(antigos_filtrados)}")
print(f"➕ Itens novos adicionados: {len(novos_convertidos)}")
print(f"♻️  Itens atualizados: {atualizados}")
print(f"🔁 Duplicados sem mudança: {skip_duplicado_sem_mudanca}")
print(f"🚫 Ignorados por prefixo não permitido: {skip_prefixo_nao_permitido}")
print(f"🧹 Ignorados por descrição sem 'BRUTA'/'BANHO': {skip_desc_sem_palavra_chave}")
print(f"⚠️  Ignorados por falta de campos: {skip_sem_campos}")
print(f"🆕 Categorias criadas (prefixo7 + descrição): {len(categorias_criadas)}")
if categorias_criadas:
    print('   →', ', '.join(sorted(categorias_criadas)))
print(f"📊 Total final: {len(atualizado)} itens")

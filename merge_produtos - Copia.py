import json
import shutil
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

# Caminhos dos arquivos
json_antigo_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\catalogo-produtos\produtos.json")
json_novos_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\catalogo-produtos\produtos_novos.json")
json_saida_path = Path(r"C:\Users\Usuario\Desktop\BACKUP\Documents\codigos faculdade\Nova pasta\scripts atualizar\Nova pasta\catalogo-produtos\catalogo-produtos\produtos.json")

# ===== Config do filtro de prefixos (4 primeiros dígitos da CLASSIFICACAO) =====
allowed_prefixes_4 = {"4040", "4020", "3090", "3040", "3050", "3060", "3075", "3080"}

# ===== Util =====
def safe_get(d, key, default=""):
    v = d.get(key, default)
    return v if isinstance(v, str) else default

def class_prefix(cls: str, n=7) -> str:
    return (cls or "")[:n]

# ===== Carrega =====
with open(json_antigo_path, "r", encoding="utf-8") as f:
    antigos = json.load(f)

with open(json_novos_path, "r", encoding="utf-8") as f:
    novos = json.load(f)

# ===== Backup do antigo =====
timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup_path = json_antigo_path.with_name(f"{json_antigo_path.stem}.backup-{timestamp}{json_antigo_path.suffix}")
shutil.copy(json_antigo_path, backup_path)

# ===== Mapa prefixo(7) -> Categoria (pega a mais frequente por prefixo) =====
from collections import defaultdict, Counter
por_prefixo = defaultdict(list)
for it in antigos:
    cls = safe_get(it, "Classificacao")
    cat = safe_get(it, "Categoria")
    if cls and cat:
        por_prefixo[class_prefix(cls)].append(cat)

mapa_classificacao_categoria = {}
for pref, cats in por_prefixo.items():
    mapa_classificacao_categoria[pref] = Counter(cats).most_common(1)[0][0]

# ===== Índice por Referencia para evitar duplicados (e permitir atualização) =====
antigos_by_ref = {}
for it in antigos:
    ref = safe_get(it, "Referencia")
    if ref:
        antigos_by_ref[ref] = it

# ===== Converte + mescla novos (respeitando filtro de prefixo 4) =====
novos_convertidos = []
skip_sem_categoria = 0
skip_sem_campos = 0
skip_prefixo_nao_permitido = 0
skip_duplicado = 0
atualizados = 0

for raw in novos:
    cls = safe_get(raw, "CLASSIFICACAO")
    ref = safe_get(raw, "ITEM")
    desc = safe_get(raw, "DESCRICAO")

    # validações básicas
    if not (cls and ref and desc):
        skip_sem_campos += 1
        continue

    # filtro: só processa se começar com um dos prefixos permitidos (4 dígitos)
    if cls[:4] not in allowed_prefixes_4:
        skip_prefixo_nao_permitido += 1
        continue

    pref7 = class_prefix(cls, 7)
    categoria = mapa_classificacao_categoria.get(pref7)
    if not categoria:
        skip_sem_categoria += 1
        continue

    convertido = {
        "Referencia": ref,
        "Descricao": desc,
        "Categoria": categoria,
        "Classificacao": cls
    }

    if ref in antigos_by_ref:
        # Atualiza campos do item existente (apenas para os que passaram no filtro)
        base = antigos_by_ref[ref]
        changed = False
        if desc and desc != safe_get(base, "Descricao"):
            base["Descricao"] = desc
            changed = True
        if cls and cls != safe_get(base, "Classificacao"):
            base["Classificacao"] = cls
            changed = True
        if categoria and categoria != safe_get(base, "Categoria"):
            base["Categoria"] = categoria
            changed = True
        if changed:
            atualizados += 1
        else:
            skip_duplicado += 1
    else:
        novos_convertidos.append(convertido)
        antigos_by_ref[ref] = convertido  # evita duplicar dentro do lote

# ===== Resultado final =====
atualizado = list(antigos_by_ref.values())

with open(json_saida_path, "w", encoding="utf-8") as f:
    json.dump(atualizado, f, ensure_ascii=False, indent=2)

# ===== Relatório =====
print(f"✅ Arquivo mesclado salvo em: {json_saida_path}")
print(f"💾 Backup criado: {backup_path}")
print(f"➕ Itens novos adicionados (após filtro): {len(novos_convertidos)}")
print(f"♻️  Itens existentes atualizados (que passaram no filtro): {atualizados}")
print(f"🔁 Itens ignorados por serem duplicados (sem mudança): {skip_duplicado}")
print(f"🚫 Itens ignorados por prefixo não permitido: {skip_prefixo_nao_permitido}")
print(f"❓ Itens ignorados sem categoria mapeada (prefixo 7): {skip_sem_categoria}")
print(f"⚠️  Itens ignorados por falta de campos: {skip_sem_campos}")
print(f"📊 Total final: {len(atualizado)} itens")

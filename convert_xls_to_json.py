import pandas as pd
import json
import os
import unicodedata

# Definir a pasta onde estão os arquivos XLS/XLSX
pasta_arquivos = "Nova pasta"

# Verificar se a pasta existe
if not os.path.exists(pasta_arquivos):
    print(f"❌ Erro: A pasta '{pasta_arquivos}' não existe.")
    exit()

# Lista todos os arquivos XLS/XLSX na pasta
arquivos_encontrados = [f for f in os.listdir(pasta_arquivos) if f.endswith(".xls") or f.endswith(".xlsx")]

if not arquivos_encontrados:
    print("❌ Nenhum arquivo Excel encontrado na pasta.")
    exit()

print("📂 Arquivos encontrados:", arquivos_encontrados)

# Lista para armazenar os dados de todos os arquivos
produtos = []

# Função para normalizar os nomes das colunas
def normalizar_coluna(nome):
    nome = unicodedata.normalize('NFKD', nome).encode('ASCII', 'ignore').decode('ASCII')
    return (
        nome.strip()
        .lower()
        .replace(" ", "_")
        .replace(".", "")
        .replace("/", "_")
    )

# Ajustando os nomes das colunas para corresponder aos arquivos
mapeamento_colunas = {
    "referencia": "Referencia",
    "descricao": "Descricao",
    "categoria": "Categoria",
    "classificacao": "Classificacao",
    "tipo_produto": "Tipo_Produto",
}

# Percorre todos os arquivos na pasta
for arquivo in arquivos_encontrados:
    caminho_arquivo = os.path.join(pasta_arquivos, arquivo)
    
    # Define o engine correto
    engine = "xlrd" if arquivo.endswith(".xls") else "openpyxl"
    
    try:
        # Lendo o arquivo Excel
        df = pd.read_excel(caminho_arquivo, engine=engine)

        # 🚨 Exibir cabeçalhos reais do arquivo
        print(f"\n📄 Colunas originais do arquivo {arquivo}:")
        print(df.columns.tolist())

        # Padroniza os nomes das colunas
        df.columns = [normalizar_coluna(col) for col in df.columns]

        # Exibir os nomes das colunas normalizadas
        print("\n🔍 Colunas normalizadas do arquivo:", arquivo)
        print(df.columns.tolist())

        # Garantir que a coluna 'referencia' exista
        if "referencia" not in df.columns:
            print(f"⚠️ A coluna 'referencia' não foi encontrada no arquivo {arquivo}. Pulando este arquivo.")
            continue

        # Ajusta os nomes das colunas reais baseados na saída acima
        colunas_validas = {col: mapeamento_colunas[col] for col in mapeamento_colunas if col in df.columns}
        
        if not colunas_validas:
            print(f"⚠️ Nenhuma coluna relevante encontrada em {arquivo}. Pulando este arquivo.")
            continue

        df = df[list(colunas_validas.keys())]  # Apenas seleciona as colunas
        df = df.rename(columns=colunas_validas)  # Renomeia as colunas para padrão JSON

        # 🚨 Exibir amostra do DataFrame para verificar dados na coluna 'referencia'
        print(f"\n🔍 Amostra de dados do arquivo {arquivo}:")
        print(df.head())

        # 🚨 Verifica valores nulos antes do `dropna()`
        print(f"\n🔍 Verificando valores nulos no arquivo {arquivo}:")
        print(df.isnull().sum())

        print(f"📊 Antes de remover valores nulos, temos {len(df)} linhas.")
        
        # Remover apenas linhas onde TODAS as colunas principais estão vazias
        df = df.dropna(subset=["Referencia", "Descricao", "Categoria"], how="all")

        print(f"📊 Depois de remover valores nulos, temos {len(df)} linhas.")

        # 🔧 Substituir NaN por None antes de exportar para JSON
        df = df.where(pd.notna(df), None)

        # Converte o DataFrame para dicionário e adiciona à lista
        produtos_extraidos = df.to_dict(orient="records")
        produtos.extend(produtos_extraidos)

        print(f"✅ {len(produtos_extraidos)} produtos extraídos de {arquivo}.")

    except Exception as e:
        print(f"❌ Erro ao processar {arquivo}: {e}")

print(f"\n✅ Total de {len(produtos)} produtos extraídos.")

# Salva o JSON se houver dados
if produtos:
    with open("produtos.json", "w", encoding="utf-8") as json_file:
        json.dump(produtos, json_file, ensure_ascii=False, indent=4)
    print("\n✅ Conversão concluída! Arquivo 'produtos.json' criado com sucesso.")
else:
    print("\n⚠️ Nenhum dado válido foi extraído dos arquivos.")

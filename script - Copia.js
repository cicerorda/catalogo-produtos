let produtos = [];
let paginaAtual = 1;
const itensPorPagina = 25;
let categoriasSelecionadas = new Set();
let termoBusca = "";
let grupoAtual = 1;
const botoesPorGrupo = 10;
let totalPaginas = 0;
let categoriasMap = new Map();
const CATEGORIA_COMPONENTES = "COMPONENTES";

let listaImagens = [];
let mapaImagemPorNomeLimpo = new Map();
let itensExcluidosDoDownload = new Set(
  JSON.parse(localStorage.getItem("itensExcluidosDoDownload") || "[]")
);

const MAPA_SUBCATEGORIAS = {
  "30_40_010": "ARGOLAS",
  "30_40_020": "MEIAS ARGOLAS",
  "30_40_030": "QUADROS",
  "30_40_040": "REGULADORES",
  "30_40_050": "FIVELAS",
  "30_40_060": "PASSADORES",
  "30_40_070": "PINOS",
  "30_40_110": "ENFEITES",

  "30_50_010": "FIVELAS",
  "30_50_020": "PONTEIRAS",
  "30_50_030": "PASSADORES",
  "30_50_040": "ARGOLAS",
  "30_50_050": "PUXADORES",
  "30_50_060": "PINGENTES",
  "30_50_070": "TACHAS E PREGOS",
  "30_50_080": "MEIAS ARGOLAS",
  "30_50_090": "BOTÕES",
  "30_50_100": "ILHÓS",
  "30_50_110": "ACESSÓRIOS",
  "30_50_120": "PLACAS",
  "30_50_130": "MANUSCRITOS",
  "30_50_140": "CONTRA CHAPAS",
  "30_50_150": "BRIDÕES",
  "30_50_160": "CORRENTES",
  "30_50_170": "BATOQUES",
  "30_50_180": "PIERCING",

  "30_60_020": "TUBOS",

  "30_75_010": "PEÇAS EM LATÃO",

  "30_80_010": "BOTÕES",
  "30_80_020": "ARGOLAS (AR)",
  "30_80_030": "CRAVOS",
  "30_80_040": "ILHÓS E ARRUELAS",
  "30_80_050": "PINOS",
  "30_80_060": "GARRAS",
  "30_80_070": "REBOQUES",
  "30_80_080": "MOSQUETÕES",
  "30_80_100": "REBITE CABEÇA",
  "30_80_110": "REBITE PÉ",
  "30_80_120": "CORRENTES",
  "30_80_130": "BRINCOS",
  "30_80_140": "TUBOS",
  "30_80_150": "ACESSÓRIOS",
  "30_80_160": "CURSORES (DESLIZADORES)",
  "30_80_170": "HASTES",

  "40_20_010": "FIVELA PINO BRUTA",
  "40_20_020": "ETIQ. TRIÂNGULO",
  "40_20_030": "ENF. CONJ. ARG. CORRENTE",
  "40_20_040": "ENF. PONTEIRA",

  "40_40_010": "CONJ. FIV",
  "40_40_020": "CONJ. PIRÂMIDE",
  "40_40_030": "PLACA BIMETAL",

  "30_90_CLASSIFICAR": "CLASSIFICAR"
};

const MAPA_CATEGORIAS = {
  "30_20": "BORRACHAS",
  "30_40": "PEÇAS EM ARAME",
  "30_50": "PEÇAS EM ZAMAC",
  "30_60": "PEÇAS EM AÇO",
  "30_75": "PEÇAS EM LATÃO",
  "30_80": "COMPONENTES BANHADOS",
  "30_90": "CLASSIFICAR",

  "40_20": "ENFEITES",
  "40_40": "CONJUNTOS"
};

const BASE_IMAGEKIT_URL = "https://ik.imagekit.io/t7590uzhp/imagens/";
const URL_SEM_IMAGEM = "https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg";

// Cache de variantes e imagem
const cacheVariantes = new Map();
const cacheImagemPorRef = new Map();

// Paginação
let listaFiltradaAtual = [];
let listaFiltradaSemDuplicatas = [];

// Limpa localStorage apenas uma vez
localStorage.removeItem("itensExcluidosDoDownload");
itensExcluidosDoDownload.clear();

console.log("✅ script.js carregado!");

// ----------------- VARIANTES E IMAGEM -----------------
function gerarVariantesComCache(ref) {
  if (cacheVariantes.has(ref)) return cacheVariantes.get(ref);
  const variantes = gerarVariantes(ref);
  cacheVariantes.set(ref, variantes);
  return variantes;
}

function limparTexto(texto) {
  return (texto || "").toLowerCase().replace(/[.\s\-_]/g, "");
}

function removerSufixoDeVariacao(ref) {
  return (ref ?? "").toString().split(/[-_]/)[0];
}

function baseDoisBlocos(ref) {
  const s = (ref ?? "").toString().toLowerCase().trim();
  const partes = s.split(".");
  return partes.length >= 2 ? `${partes[0]}.${partes[1]}` : s;
}

function removerZerosEsquerdaPrimeiroBloco(refDoisBlocos) {
  const [a, b] = refDoisBlocos.split(".");
  const aSemZero = (a || "").replace(/^0+/, "") || "0";
  return `${aSemZero}.${b}`;
}

function gerarVariantes(ref) {
  const variantes = new Set();
  const crua = limparTexto(ref);
  variantes.add(crua);

  const doisBlocos = baseDoisBlocos(ref);
  variantes.add(limparTexto(doisBlocos));

  const doisBlocosSemZeros = removerZerosEsquerdaPrimeiroBloco(doisBlocos);
  variantes.add(limparTexto(doisBlocosSemZeros));

  let tmp = (ref ?? "").toString();
  while (/\.(?:0{1,3})$/.test(tmp)) {
    tmp = tmp.replace(/\.(?:0{1,3})$/, "");
    variantes.add(limparTexto(tmp));
    const db = baseDoisBlocos(tmp);
    variantes.add(limparTexto(db));
  }

  const semSufixo = limparTexto(removerSufixoDeVariacao(ref));
  variantes.add(semSufixo);

  if (semSufixo.endsWith("00") && semSufixo.length > 6) {
    variantes.add(semSufixo.slice(0, -2));
  }

  const m = ref.match(/^E0(\d{5})\.(\d{2})/i);
  if (m) {
    const bloco1 = m[1], bloco2 = m[2];
    variantes.add(`e${bloco1}${bloco2}`);
    variantes.add(limparTexto(`e.${bloco1}.${bloco2}`));
    variantes.add(`e.${bloco1}.${bloco2}`);
  }

  return Array.from(variantes);
}

function encontrarImagem(ref) {
  if (!ref) return URL_SEM_IMAGEM;

  if (cacheImagemPorRef.has(ref)) return cacheImagemPorRef.get(ref);

  const variantes = gerarVariantesComCache(ref);
  let urlEncontrada = URL_SEM_IMAGEM;
  for (const v of variantes) {
    const url = mapaImagemPorNomeLimpo.get(v);
    if (url) {
      urlEncontrada = url;
      break;
    }
  }

  cacheImagemPorRef.set(ref, urlEncontrada);
  return urlEncontrada;
}

// ----------------- CARREGAMENTO DE IMAGENS -----------------
fetch("imagens.json")
  .then(res => res.json())
  .then(imagensData => {
    listaImagens = imagensData.map(img => ({
      ...img,
      nome_limpo: processarNomeImagem(img.nome)
    }));

    mapaImagemPorNomeLimpo = new Map();
    listaImagens.forEach(img => {
      if (img.nome_limpo) mapaImagemPorNomeLimpo.set(img.nome_limpo, img.url);
    });

    console.log("🔍 Imagens carregadas:", listaImagens);
    imagensCarregadas = true;

    if (produtosCarregados) atualizarProdutos();
  })
  .catch(err => console.error("❌ Erro ao carregar imagens.json:", err));

function processarNomeImagem(nome) {
  let nomeBase = nome.toLowerCase().split("_")[0];
  if (nome.includes("_") && /^[a-z]+$/.test(nomeBase)) nomeBase += nome.split("_")[1];
  return nomeBase.replace(/[\.\s\-_]/g, "");
}

// ----------------- CARREGAMENTO DE PRODUTOS -----------------
function processarCategoria(categoriaRaw) {
  if (!categoriaRaw) return null;
  const primeira = categoriaRaw.split(",")[0].trim();
  const partes = primeira.split("_");
  const codigoSub = partes.slice(0, 3).join("_");
  const codigoCat = partes.slice(0, 2).join("_");

  return {
    codigo: codigoSub,
    codigoCategoria: codigoCat,
    nomeCategoria: MAPA_CATEGORIAS[codigoCat] || codigoCat
  };
}

async function carregarProdutos() {
  try {
    const index = await fetch("produtos_index.json").then(r => r.json());
    let todosProdutos = [];
    for (const arquivo of index.arquivos) {
      const data = await fetch(`produtos/${arquivo}`).then(r => r.json());
      todosProdutos = todosProdutos.concat(data);
    }

    produtos = todosProdutos;
    categoriasMap.clear();

    produtos.forEach(produto => {
      if (!produto.Categoria) return;
      const cat = processarCategoria(produto.Categoria);
      produto.CategoriaNome = cat.nomeCategoria;
      produto.CategoriaCodigo = cat.codigo;
      produto.CategoriaPai = cat.codigoCategoria;

      if (!categoriasMap.has(produto.CategoriaNome)) {
        categoriasMap.set(produto.CategoriaNome, new Set());
      }
      categoriasMap.get(produto.CategoriaNome).add(produto.CategoriaCodigo);
    });

    criarListaDeCategorias();
    produtosCarregados = true;

    if (imagensCarregadas) atualizarProdutos();
  } catch (err) {
    console.error("❌ Erro ao carregar produtos:", err);
  }
}
carregarProdutos();

// ----------------- FILTRO UNIFICADO -----------------
async function obterProdutosFiltrados() {
  const filtrarComponentes = categoriasSelecionadas.has(CATEGORIA_COMPONENTES);
  let listaBase = termoBusca ? await carregarProdutosPorPrefixos([...new Set(termoBusca.split(/\s+/).map(t => t.slice(0, 4)))]) : produtos;

  return listaBase.filter(produto => {
    const ehComponente = produto.Descricao?.toUpperCase().includes("COMP.");
    if (!filtrarComponentes && ehComponente) return false;

    const passaCategoria = categoriasSelecionadas.size === 0 || categoriasSelecionadas.has(produto.CategoriaCodigo);
    const passaBusca = !termoBusca || limparTexto(produto.Referencia).includes(limparTexto(termoBusca)) || limparTexto(produto.Descricao).includes(limparTexto(termoBusca));

    return passaCategoria && passaBusca;
  });
}

async function carregarProdutosPorPrefixos(prefixos) {
  if (!prefixos.length) return [];
  const blocos = await Promise.all(prefixos.map(p => fetch(`produtos/${p}.json`).then(r => r.json())));
  return blocos.flat();
}

// ----------------- ATUALIZAÇÃO DE PRODUTOS -----------------
async function atualizarProdutos() {
  categoriasSelecionadas.clear();
  document.querySelectorAll(".categoria-checkbox:checked").forEach(cb => categoriasSelecionadas.add(cb.value));
  paginaAtual = 1;

  listaFiltradaAtual = await obterProdutosFiltrados();
  const urlsVistas = new Set();
  listaFiltradaSemDuplicatas = listaFiltradaAtual.filter(p => {
    const url = encontrarImagem(p.Referencia);
    if (urlsVistas.has(url)) return false;
    urlsVistas.add(url);
    return true;
  });

  exibirProdutos(listaFiltradaSemDuplicatas);
  criarPaginacao(listaFiltradaSemDuplicatas);
}

// ----------------- EXIBIÇÃO DE PRODUTOS -----------------
function exibirProdutos(lista) {
  const container = document.getElementById("products");
  container.innerHTML = "";
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const produtosPagina = lista.slice(inicio, inicio + itensPorPagina);

  if (!produtosPagina.length) {
    container.innerHTML = `<p class="mensagem-nenhum-produto">Nenhum produto encontrado.</p>`;
    return;
  }

  produtosPagina.forEach(produto => {
    const card = document.createElement("div");
    card.classList.add("card");
    const ref = produto.Referencia;
    const marcado = !itensExcluidosDoDownload.has(ref);
    const caminhoImagem = encontrarImagem(ref);

    card.innerHTML = `
      <div class="image-container">
        <img src="${caminhoImagem}" alt="Imagem do produto" onerror="this.src='${URL_SEM_IMAGEM}'">
      </div>
      <div class="container">
        <h5>${ref || "Sem Referência"}</h5>
        <p>${produto.Descricao || "Sem Descrição"}</p>
        <h6>Categoria: ${produto.Categoria || "Sem Categoria"}</h6>
        <div class="download-flag">
          <label>
            <input type="checkbox" ${marcado ? "checked" : ""} onchange="toggleDownload('${ref}')"> Incluir no PDF
          </label>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// ----------------- PAGINAÇÃO -----------------
function criarPaginacao(lista) {
  totalPaginas = Math.ceil(lista.length / itensPorPagina);
  const paginacaoContainer = document.getElementById("pagination");
  paginacaoContainer.innerHTML = "";

  const inicioGrupo = (grupoAtual - 1) * botoesPorGrupo + 1;
  const fimGrupo = Math.min(inicioGrupo + botoesPorGrupo - 1, totalPaginas);

  if (grupoAtual > 1) paginacaoContainer.appendChild(criarBotao("⟨", () => mudarGrupo(grupoAtual - 1)));
  for (let i = inicioGrupo; i <= fimGrupo; i++) {
    const btn = criarBotao(i, () => mudarPagina(i));
    if (i === paginaAtual) btn.classList.add("active");
    paginacaoContainer.appendChild(btn);
  }
  if (fimGrupo < totalPaginas) paginacaoContainer.appendChild(criarBotao("⟩", () => mudarGrupo(grupoAtual + 1)));
}

function criarBotao(texto, funcao) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.classList.add("pagina-btn");
  btn.addEventListener("click", funcao);
  return btn;
}

function mudarGrupo(novoGrupo) {
  grupoAtual = novoGrupo;
  criarPaginacao(listaFiltradaSemDuplicatas);
}

function mudarPagina(pagina) {
  paginaAtual = pagina;
  exibirProdutos(listaFiltradaSemDuplicatas);
  criarPaginacao(listaFiltradaSemDuplicatas);
}

// ----------------- TOGGLE DOWNLOAD -----------------
function toggleDownload(referencia) {
  if (itensExcluidosDoDownload.has(referencia)) itensExcluidosDoDownload.delete(referencia);
  else itensExcluidosDoDownload.add(referencia);

  localStorage.setItem("itensExcluidosDoDownload", JSON.stringify([...itensExcluidosDoDownload]));
}

// ----------------- PDF -----------------
function baixarPesquisaEmPDF() {
  let baseLista = (listaFiltradaSemDuplicatas.length ? listaFiltradaSemDuplicatas : listaFiltradaAtual)
                    .filter(p => !itensExcluidosDoDownload.has(p.Referencia));
  if (!baseLista.length) return alert("Nenhum item selecionado para download.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const urlsVistas = new Set();
  const listaSemDuplicatas = [];
  for (const produto of baseLista) {
    const urlImg = encontrarImagem(produto.Referencia);
    if (!urlsVistas.has(urlImg)) {
      urlsVistas.add(urlImg);
      listaSemDuplicatas.push(produto);
    }
  }

  if (!listaSemDuplicatas.length) return alert("Nenhum item encontrado.");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Catálogo de Produtos", 10, 15);

  let x = 10, y = 25;
  const larguraCard = 62, alturaCard = 62;
  const imgMaxLargura = 50, imgMaxAltura = 30;
  const espacamentoX = 3, espacamentoY = 3;
  const colunas = 3;

  const promessas = listaSemDuplicatas.map(produto => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve({ produto, img });
    img.onerror = () => resolve({ produto, img: null });
    img.src = encontrarImagem(produto.Referencia);
  }));

  Promise.all(promessas).then(resultados => {
    resultados.forEach(({ produto, img }, index) => {
      doc.setFillColor(245,245,245);
      doc.roundedRect(x,y,larguraCard,alturaCard,3,3,"FD");

      if (img) {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext("2d").drawImage(img,0,0);
        const base64 = canvas.toDataURL("image/jpeg");
        const escala = Math.min(imgMaxLargura/img.width,imgMaxAltura/img.height);
        doc.addImage(base64,"JPEG",x+(larguraCard-img.width*escala)/2,y+5,img.width*escala,img.height*escala);
      }

      const textoY = y + imgMaxAltura + 12;
      doc.setFontSize(9);
      doc.setFont("helvetica","bold");
      doc.text(produto.Referencia || "Sem Referência", x+5, textoY);
      doc.setFont("helvetica","normal");
      const desc = doc.splitTextToSize(produto.Descricao || "Sem Descrição", larguraCard-10);
      doc.text(desc, x+5, textoY+5);

      if ((index+1)%colunas===0) { x=10; y+=alturaCard+espacamentoY; }
      else x+=larguraCard+espacamentoX;
      if (y+alturaCard>295) { doc.addPage(); y=25; x=10; }
    });
    doc.save("catalogo_produtos.pdf");
  });
}

// ----------------- RELATÓRIO SEM IMAGEM -----------------
function gerarRelatorioSemImagem() {
  const semImagem = produtos.filter(p => encontrarImagem(p.Referencia).includes("sem-imagem.jpg"));
  console.warn(`🔍 Total produtos sem imagem: ${semImagem.length}`);
  console.table(semImagem.map(p => ({ Referencia:p.Referencia, Descricao:p.Descricao, Categoria:p.Categoria })));
}
setTimeout(() => { if(produtos.length && listaImagens.length) gerarRelatorioSemImagem(); },2000);

// ----------------- EVENTOS -----------------
document.addEventListener("DOMContentLoaded",()=>{
  const btnDownload = document.getElementById("download-pdf");
  if(btnDownload) btnDownload.addEventListener("click",()=>baixarPesquisaEmPDF());

  const inputBusca = document.getElementById("search-input");
  if(inputBusca){
    const debounce = (func,delay)=>{
      let timeout;
      return function(...args){ clearTimeout(timeout); timeout=setTimeout(()=>func.apply(this,args),delay); };
    };
    inputBusca.addEventListener("input",debounce(e=>{
      termoBusca=e.target.value.trim();
      paginaAtual=1;
      atualizarProdutos();
    },300));
  }

  document.querySelector(".filter-header")?.addEventListener("click",()=>{
    document.getElementById("category-filter")?.classList.toggle("active");
  });
});
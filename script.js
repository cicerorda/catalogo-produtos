let produtos = [];
let paginaAtual = 1;
const itensPorPagina = 27;
let categoriasUnicas = new Set();
let categoriasSelecionadas = new Set();
let termoBusca = "";
let grupoAtual = 1;
const botoesPorGrupo = 10;
let totalPaginas = 0;
let listaImagens = [];
const BASE_IMAGEKIT_URL = "https://ik.imagekit.io/t7590uzhp/imagens/";

console.log("✅ script.js foi carregado!");

const cacheVariantes = new Map();

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
  if (partes.length >= 2) return `${partes[0]}.${partes[1]}`;
  return s;
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

  // 🔧 CASO ESPECIAL: e.20530.15 para E020530.15.000
  if (/^e0?\d{5}\.\d{2}\.000$/i.test(ref)) {
    const vMatch = ref.match(/^e0?(\d{5})\.(\d{2})\.000$/i);
    if (vMatch) {
      const vCustom = `e.${parseInt(vMatch[1], 10)}.${vMatch[2]}`;
      variantes.add(limparTexto(vCustom));
    }
  }

  return Array.from(variantes);
}

function encontrarImagem(ref, imagens = listaImagens) {
  const variantes = gerarVariantesComCache(ref);
  for (const v of variantes) {
    const img = imagens.find((img) =>
      limparTexto(img.nome) === v ||
      (img.nome_limpo && img.nome_limpo === v)
    );
    if (img) return img.url;
  }
  return "https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg";
}

let imagensCarregadas = false;
let produtosCarregados = false;

function processarNomeImagem(nome) {
  return limparTexto(removerSufixoDeVariacao(nome));
}

// Carrega imagens.json
fetch("imagens.json")
  .then(res => {
    console.log("📂 Status imagens.json:", res.status);
    if (!res.ok) throw new Error("Erro ao carregar imagens.json");
    return res.json();
  })
  .then(imagensData => {
    listaImagens = imagensData.map(img => ({
      ...img,
      nome_limpo: processarNomeImagem(img.nome)
    }));
    imagensCarregadas = true;
    console.log("✅ Imagens carregadas:", listaImagens.length);

    if (produtosCarregados) {
      console.log("📦 Chamando atualizarProdutos()");
      atualizarProdutos();
    } else {
      console.log("⌛ Aguardando produtos serem carregados...");
    }
  })
  .catch(err => console.error("❌ Erro ao carregar imagens.json:", err));

// Carrega produtos.json
fetch("produtos.json")
  .then(res => {
    console.log("📂 Status produtos.json:", res.status);
    if (!res.ok) throw new Error("Erro ao carregar produtos.json");
    return res.json();
  })
  .then(produtosData => {
    produtos = produtosData;

    produtos.forEach(produto => {
      if (produto.Categoria) {
        const partes = produto.Categoria.split("_");
        const categoriaLimpa = partes[partes.length - 1];
        produto.CategoriaLimpa = categoriaLimpa;
        categoriasUnicas.add(categoriaLimpa);
      }
    });

    criarListaDeCategorias();
    produtosCarregados = true;
    console.log("✅ Produtos carregados:", produtos.length);

    if (imagensCarregadas) {
      console.log("📦 Chamando atualizarProdutos()");
      atualizarProdutos();
    } else {
      console.log("⌛ Aguardando imagens serem carregadas...");
    }
  })
  .catch(err => console.error("❌ Erro ao carregar produtos.json:", err));

// 🔹 Criar lista de categorias com checkboxes invisíveis e clique no nome
function criarListaDeCategorias() {
    const listaCategorias = document.getElementById("category-list");
    listaCategorias.innerHTML = "";

    categoriasUnicas.forEach(categoria => {
        const item = document.createElement("li");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("categoria-checkbox");
        checkbox.value = categoria;
        checkbox.checked = categoriasSelecionadas.has(categoria);

        const label = document.createElement("label");
        label.textContent = categoria;
        label.addEventListener("click", () => {
            checkbox.checked = !checkbox.checked;
            atualizarFiltroCategorias();
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        listaCategorias.appendChild(item);
    });

    // Adiciona um único evento para toda a lista de categorias
    listaCategorias.addEventListener("change", atualizarFiltroCategorias);
}

// Atualiza a lista de categorias selecionadas
function atualizarFiltroCategorias() {
    categoriasSelecionadas = new Set(
        [...document.querySelectorAll(".categoria-checkbox:checked")].map(cb => cb.value)
    );
    paginaAtual = 1;
    atualizarProdutos();
}

// 🔹 Atualiza a seleção de categorias e recarrega produtos
function toggleCategoria(categoria, selecionado) {
    selecionado ? categoriasSelecionadas.add(categoria) : categoriasSelecionadas.delete(categoria);
    paginaAtual = 1;
    atualizarProdutos();
}

function obterProdutosFiltrados() {
    return produtos
        .filter(p =>
            categoriasSelecionadas.size === 0 ||
            categoriasSelecionadas.has(p.CategoriaLimpa)
        )
        .filter(p => {
            const ref = String(p.Referencia ?? "").toLowerCase();
            const desc = String(p.Descricao ?? "").toLowerCase();
            const termo = termoBusca.toLowerCase().trim();

            if (!termo) return true;

            return ref.includes(termo) || desc.includes(termo);
        });
}

function atualizarProdutos() {
  let listaFiltrada = obterProdutosFiltrados();
  console.log("🔁 Entrou em atualizarProdutos()");
  console.log("📦 Total de produtos:", produtos.length);

  // 🔹 Remove duplicados pela imagem, mas mantém produtos sem imagem
  const vistos = new Set();
  listaFiltrada = listaFiltrada.filter(p => {
    const url = encontrarImagem(p.Referencia);
    if (!url || url.includes("sem-imagem")) return true; // mantém se não houver imagem válida
    if (vistos.has(url)) return false; // já vimos essa imagem → descarta
    vistos.add(url);
    return true;
  });


  totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina);
  grupoAtual = Math.ceil(paginaAtual / botoesPorGrupo);

  exibirProdutos(listaFiltrada);
  criarPaginacao(listaFiltrada);
}

// 🔹 Buscar categorias
function filtrarCategorias() {
    let termoBuscaCategoria = document.getElementById("search-category").value.toLowerCase();

    // Verifica todas as categorias existentes
    let categoriasFiltradas = [...categoriasUnicas].filter(cat => 
        cat.toLowerCase().includes(termoBuscaCategoria)
    );

    const listaCategorias = document.getElementById("category-list");
    listaCategorias.innerHTML = "";

    if (categoriasFiltradas.length === 0) {
        listaCategorias.innerHTML = `<p class="mensagem-nenhum-produto">Nenhuma categoria encontrada.</p>`;
        return;
    }

    categoriasFiltradas.forEach(cat => {
        const item = document.createElement("li");
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = cat;
        checkbox.checked = categoriasSelecionadas.has(cat);
        checkbox.addEventListener("change", () => toggleCategoria(cat, checkbox.checked));

        const label = document.createElement("label");
        label.textContent = cat;
        label.addEventListener("click", () => {
            checkbox.checked = !checkbox.checked;
            toggleCategoria(cat, checkbox.checked);
        });

        item.appendChild(checkbox);
        item.appendChild(label);
        listaCategorias.appendChild(item);
    });
}

// 🔹 Criar botões de paginação
function criarPaginacao(lista) {
    totalPaginas = Math.ceil(lista.length / itensPorPagina);
    const paginacaoContainer = document.getElementById("pagination");
    paginacaoContainer.innerHTML = "";

    const inicioGrupo = (grupoAtual - 1) * botoesPorGrupo + 1;
    const fimGrupo = Math.min(inicioGrupo + botoesPorGrupo - 1, totalPaginas);

    if (grupoAtual > 1) {
        paginacaoContainer.appendChild(criarBotao("⟨", () => mudarGrupo(grupoAtual - 1)));
    }

    for (let i = inicioGrupo; i <= fimGrupo; i++) {
        const btn = criarBotao(i, () => mudarPagina(i));
        if (i === paginaAtual) btn.classList.add("active");
        paginacaoContainer.appendChild(btn);
    }

    if (fimGrupo < totalPaginas) {
        paginacaoContainer.appendChild(criarBotao("⟩", () => mudarGrupo(grupoAtual + 1)));
    }
}

// 🔹 Criar botão reutilizável
function criarBotao(texto, funcao) {
    const btn = document.createElement("button");
    btn.textContent = texto;
    btn.classList.add("pagina-btn");
    btn.addEventListener("click", funcao);
    return btn;
}

// 🔹 Mudar grupo de páginas
function mudarGrupo(novoGrupo) {
    grupoAtual = novoGrupo;
    criarPaginacao(obterProdutosFiltrados());
}

// 🔹 Mudar de página mantendo filtros ativos
function mudarPagina(pagina) {
    paginaAtual = pagina;
    atualizarProdutos();
}

// 🔹 Toggle da lista de categorias
document.querySelector(".filter-header").addEventListener("click", () => {
    const filterContent = document.getElementById("category-filter");
    filterContent.classList.toggle("active");
});

let listaDeCompras = [];

// 🔹 Função para adicionar um produto à lista de compras
function adicionarAoCarrinho(referencia) {
    // Busca o produto na lista de produtos pelo código de referência
    const produto = produtos.find(p => p.Referencia === referencia);
    
    if (!produto) return;

    // Obtém a quantidade informada pelo usuário
    const quantidadeInput = document.getElementById(`quantidade-${referencia}`);
    const quantidade = parseInt(quantidadeInput.value);

    if (quantidade <= 0 || isNaN(quantidade)) {
        alert("Por favor, insira uma quantidade válida.");
        return;
    }

    // Verifica se o produto já está no carrinho
    const produtoNoCarrinho = listaDeCompras.find(item => item.Referencia === referencia);

    if (produtoNoCarrinho) {
        // Se já existir, apenas aumenta a quantidade
        produtoNoCarrinho.Quantidade += quantidade;
    } else {
        // Se não existir, adiciona ao carrinho
        listaDeCompras.push({ ...produto, Quantidade: quantidade });
    }

    atualizarCarrinho();
}

function exibirProdutos(produtos) {
  const container = document.getElementById("produtos-container");
  container.innerHTML = "";

  produtos.forEach((produto) => {
    const card = document.createElement("div");
    card.classList.add("card");

    const imagemUrl = encontrarImagem(produto.Referencia, listaImagens);
    const img = document.createElement("img");
    img.alt = produto.Referencia;

    if (imagemUrl) {
      img.src = imagemUrl;
    } else {
      img.src = "https://via.placeholder.com/150x100?text=Sem+Imagem";
      card.style.border = "2px dashed red"; // opcional: destacar cards sem imagem
    }

    const ref = document.createElement("h3");
    ref.textContent = produto.Referencia;

    const desc = document.createElement("p");
    desc.textContent = produto.Descricao;

    card.appendChild(img);
    card.appendChild(ref);
    card.appendChild(desc);
    container.appendChild(card);
  });
}

// ✅ Exibir produtos na tela
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
  
      const caminhoImagem = encontrarImagem(produto.Referencia);
  
      card.innerHTML = `
        <div class="image-container">
          <img src="${caminhoImagem}" alt="Imagem do produto"
            onerror="console.error('❌ Imagem não encontrada:', this.src); this.src='https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg?updatedAt=1745112243066'">

        </div>
        <div class="container">
          <h5>${produto.Referencia || "Sem Referência"}</h5>
          <p>${produto.Descricao || "Sem Descrição"}</p>
          <h6>Categoria: ${produto.Categoria || "Sem Categoria"}</h6>
        </div>
      `;
  
      container.appendChild(card);
    });
  }

function atualizarCarrinho() {
    const cartContainer = document.getElementById("cart-items");
    cartContainer.innerHTML = "";

    if (listaDeCompras.length === 0) {
        cartContainer.innerHTML = "<p>Nenhum item na lista.</p>";
        return;
    }

    listaDeCompras.forEach((produto, index) => {
        const item = document.createElement("li");

        item.innerHTML = `
            <span>${produto.Referencia}</span>
            
            <div>
                <input type="number" min="1" value="${produto.Quantidade}" 
                    onchange="atualizarQuantidade(${index}, this.value)">
                <button onclick="removerDoCarrinho(${index})">❌</button>
            </div>
        `;
        cartContainer.appendChild(item);
    });
}

// 🔹 Atualiza a quantidade diretamente no carrinho
function atualizarQuantidade(index, novaQuantidade) {
    novaQuantidade = parseInt(novaQuantidade);

    if (novaQuantidade > 0) {
        listaDeCompras[index].Quantidade = novaQuantidade;
        atualizarCarrinho();
    } else {
        removerDoCarrinho(index); // Se a quantidade for 0, remove o item
    }
}

// 🔹 Remove um item do carrinho
function removerDoCarrinho(index) {
    listaDeCompras.splice(index, 1);
    atualizarCarrinho();
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const btnDownload = document.getElementById("download-pdf");

        if (btnDownload) {
            console.log("✅ Botão 'Baixar Pesquisa' encontrado!");

            btnDownload.addEventListener("click", function () {
                console.log("🎯 Botão clicado!");
                baixarPesquisaEmPDF();
            });

        } else {
            console.error("❌ Erro: Botão 'Baixar Pesquisa' NÃO encontrado no HTML.");
        }
        // 🔽 Ativa o campo de busca principal
        function debounce(func, delay) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), delay);
            };
        }

        const inputBusca = document.getElementById("search-input");
        if (inputBusca) {
            inputBusca.addEventListener("input", debounce((event) => {
                termoBusca = event.target.value.trim();
                console.log("🔎 termoBusca atualizado:", termoBusca);
                paginaAtual = 1;
                atualizarProdutos();
            }, 300)); // você pode ajustar esse tempo se quiser
        }
    }, 1000); // Espera 1 segundo para garantir que o DOM foi carregado
});

function baixarPesquisaEmPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    let listaFiltrada = obterProdutosFiltrados();
    if (!listaFiltrada.length) {
        alert("Nenhum item encontrado.");
        return;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Catálogo de Produtos", 10, 15);

    let x = 10, y = 25;
    let larguraCard = 62;    
    let alturaCard = 62;
    let imgMaxLargura = 50;
    let imgMaxAltura = 30;
    let espacamentoX = 3;
    let espacamentoY = 3;
    let colunas = 3;

    const promessas = listaFiltrada.map(produto => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve({ produto, img });
            img.onerror = () => resolve({ produto, img: null });
            img.src = encontrarImagem(produto.Referencia);
        });
    });

    Promise.all(promessas).then(resultados => {
        resultados.forEach(({ produto, img }, index) => {
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(x, y, larguraCard, alturaCard, 3, 3, 'FD');

            if (img) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL("image/jpeg");

                // Proporcional
                const escala = Math.min(imgMaxLargura / img.width, imgMaxAltura / img.height);
                const imgLarguraAjustada = img.width * escala;
                const imgAlturaAjustada = img.height * escala;

                doc.addImage(
                    base64,
                    "JPEG",
                    x + (larguraCard - imgLarguraAjustada) / 2,
                    y + 5,
                    imgLarguraAjustada,
                    imgAlturaAjustada
                );
            }

            const textoY = y + imgMaxAltura + 12;
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text((produto.Referencia || "Sem Referência").toString(), x + 5, textoY);

            doc.setFont("helvetica", "normal");
            const desc = doc.splitTextToSize((produto.Descricao || "Sem Descrição").toString(), larguraCard - 10);
            doc.text(desc, x + 5, textoY + 5);

            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(`Cat: ${(produto.CategoriaLimpa || "Sem Categoria")}`, x + 5, textoY + 15);

            // Posicionamento para 3 colunas
            if ((index + 1) % colunas === 0) {
                x = 10;
                y += alturaCard + espacamentoY;
            } else {
                x += larguraCard + espacamentoX;
            }

            if (y + alturaCard > 295) {
                doc.addPage();
                y = 25;
                x = 10;
            }

            doc.setTextColor(0, 0, 0);
        });

        doc.save("catalogo_produtos.pdf");
    });
}

console.log("Verificando jsPDF:", window.jspdf);

function gerarRelatorioSemImagem() {
    const semImagem = produtos.filter(p => encontrarImagem(p.Referencia).includes("sem-imagem.jpg"));

    console.warn(`🔍 Total de produtos sem imagem: ${semImagem.length}`);
    console.table(semImagem.map(p => ({
        Referencia: p.Referencia,
        Descricao: p.Descricao,
        Categoria: p.Categoria
    })));
}

// Chamar após carregar tudo
setTimeout(() => {
    if (produtos.length > 0 && listaImagens.length > 0) {
        gerarRelatorioSemImagem();
    } else {
        console.warn("⚠️ Produtos ou imagens ainda não carregados para gerar o relatório.");
    }
}, 2000);

setTimeout(() => {
  console.log("🔍 Produtos carregados?", produtos.length);
  console.log("🔍 Exemplo:", produtos[0]);
}, 2000);

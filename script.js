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
let termoDigitos = "";

console.log("✅ script.js foi carregado!");

// ✅ Carregar imagens.json e ordenar por nomes maiores primeiro (prioridade a match mais completo)
fetch("imagens.json")
  .then(res => res.json())
  .then(data => {
    listaImagens = data
      .map(img => ({
        ...img,
        nome_limpo: img.nome.toLowerCase().replace(/\./g, "") // garante consistência
      }))
      .sort((a, b) => b.nome_limpo.length - a.nome_limpo.length); // prioriza nomes mais longos

    atualizarProdutos();
  });

// 🔹 Carregar produtos.json
// ✅ Carregar produtos.json
fetch("produtos.json")
  .then(res => res.json())
  .then(data => {
    produtos = data;
    produtos.forEach(produto => {
        if (produto.Categoria) categoriasUnicas.add(produto.Categoria);
    });
    criarListaDeCategorias();
    atualizarProdutos();
  })
  .catch(error => {
    console.error("Erro ao carregar produtos:", error);
    document.getElementById("products").innerHTML = `<p class="mensagem-nenhum-produto">Erro ao carregar os produtos.</p>`;
  });

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

// 🔹 Filtrar produtos e buscar pelo termo digitado
function obterProdutosFiltrados() {
    return produtos
        .filter(p => categoriasSelecionadas.size === 0 || categoriasSelecionadas.has(p.Categoria))
        .filter(p => {
            let buscaNome = !termoBusca.trim() || 
                (p.Referencia?.toLowerCase().includes(termoBusca.toLowerCase())) ||
                (p.Descricao?.toLowerCase().includes(termoBusca.toLowerCase()));

            let buscaDigitos = !termoDigitos.trim() || 
                (p.Descricao && p.Descricao.replace(/\D/g, "").includes(termoDigitos));

            return buscaNome && buscaDigitos;
        });
}

// 🔹 Atualizar produtos e paginação
function atualizarProdutos() {
    let listaFiltrada = obterProdutosFiltrados();
    totalPaginas = Math.ceil(listaFiltrada.length / itensPorPagina);
    grupoAtual = Math.ceil(paginaAtual / botoesPorGrupo);

    exibirProdutos(listaFiltrada);
    criarPaginacao(listaFiltrada);
}

// 🔹 Monitorar entrada do usuário na busca de produtos
// 🔥 Atualizar quando digitar no campo normal
document.getElementById("search-input").addEventListener("input", (event) => {
    termoBusca = event.target.value.trim();
    paginaAtual = 1;
    atualizarProdutos();
});

// 🔥 Atualizar quando digitar no campo só de dígitos
document.getElementById("search-digits").addEventListener("input", (event) => {
    termoDigitos = event.target.value.replace(/\D/g, ""); // mantém só números
    paginaAtual = 1;
    atualizarProdutos();
});

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

function encontrarImagem(referencia) {
    const refLimpa = referencia.toLowerCase().replace(/\./g, "");
    let match = null;
    let maiorMatch = 0;
  
    listaImagens.forEach(({ nome_limpo, url }) => {
      if (refLimpa.startsWith(nome_limpo) && nome_limpo.length > maiorMatch) {
        match = url;
        maiorMatch = nome_limpo.length;
      } else {
        for (let i = refLimpa.length; i >= 6; i--) {
          const corte = refLimpa.slice(0, i);
          if (nome_limpo === corte + "00" && (corte.length + 2) > maiorMatch) {
            match = url;
            maiorMatch = corte.length + 2;
            break;
          }
        }
      }
    });
  
    if (!match) {
      console.warn(`❌ Imagem NÃO encontrada para "${referencia}" → ${refLimpa}`);
      return "https://ik.imagekit.io/t7590uzhp/imagens/sem-imagem_Ga_BH1QVQo.jpg?updatedAt=1745112243066";
    }
  
    console.log(`✔️ Imagem encontrada para "${referencia}" → ${match}`);
    return match;
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
    }, 1000); // Espera 1 segundo para garantir que o DOM foi carregado
});

// 🔹 Limpa toda a lista de compras
document.getElementById("clear-cart").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja limpar a lista de compras?")) {
        listaDeCompras = [];
        atualizarCarrinho();
    }
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
    let larguraCard = 90, alturaCard = 70;
    let imgLargura = 40, imgAltura = 40;
    let espacamentoX = 10, espacamentoY = 10;
    let colunas = 2;

    const promessas = listaFiltrada.map(produto => {
        return new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = "anonymous"; // 🔥 necessário para permitir toDataURL()
            img.onload = () => resolve({ produto, img });
            img.onerror = () => resolve({ produto, img: null });
    
            img.src = encontrarImagem(produto.Referencia);
        });
    });

    Promise.all(promessas).then(resultados => {
        resultados.forEach(({ produto, img }, index) => {
            // Fundo do card
            doc.setFillColor(245, 245, 245); // cinza bem claro
            doc.roundedRect(x, y, larguraCard, alturaCard, 3, 3, 'FD');

            if (img) {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL("image/jpeg");

                // Imagem centralizada no topo
                doc.addImage(
                    base64,
                    "JPEG",
                    x + (larguraCard - imgLargura) / 2,
                    y + 3,
                    imgLargura,
                    imgAltura
                );
            }

            // Texto (abaixo da imagem)
            const textoY = y + imgAltura + 8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(produto.Referencia || "Sem Referência", x + 5, textoY);

            doc.setFont("helvetica", "normal");
            const desc = doc.splitTextToSize(produto.Descricao || "Sem Descrição", larguraCard - 10);
            doc.text(desc, x + 5, textoY + 6);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(120, 120, 120);
            doc.text(`Categoria: ${produto.Categoria || "Sem Categoria"}`, x + 5, textoY + 16);

            // Proximidade de colunas
            if ((index + 1) % colunas === 0) {
                x = 10;
                y += alturaCard + espacamentoY;
            } else {
                x += larguraCard + espacamentoX;
            }

            if (y + alturaCard > 280) {
                doc.addPage();
                y = 25;
                x = 10;
            }

            doc.setTextColor(0, 0, 0); // Reset
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


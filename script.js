let produtos = [];
let paginaAtual = 1;
const itensPorPagina = 27;
let categoriasUnicas = new Set();
let categoriasSelecionadas = new Set();
let termoBusca = "";
let grupoAtual = 1;
const botoesPorGrupo = 10;
let totalPaginas = 0;

console.log("✅ script.js foi carregado!");

// 🔹 Carregar produtos.json
fetch("produtos.json")
    .then(response => {
        if (!response.ok) throw new Error("Falha ao carregar os dados");
        return response.json();
    })
    .then(data => {
        produtos = data;
        produtos.forEach(produto => {
            if (produto.Categoria) categoriasUnicas.add(produto.Categoria);
        });

        criarListaDeCategorias();
        atualizarProdutos();
    })
    .catch(error => {
        console.error("❌ Erro ao carregar produtos.json:", error);
        document.getElementById("products").innerHTML = `<p class="mensagem-nenhum-produto">Erro ao carregar os produtos. Tente novamente mais tarde.</p>`;
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
        .filter(p => 
            !termoBusca.trim() || 
            (p.Referencia?.toLowerCase().includes(termoBusca.toLowerCase())) ||
            (p.Descricao?.toLowerCase().includes(termoBusca.toLowerCase()))
        );
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
document.getElementById("search-input").addEventListener("input", (event) => {
    termoBusca = event.target.value.trim();
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

// 🔹 Modifica a função de exibição de produtos para adicionar o botão "Adicionar ao Carrinho"
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

        card.innerHTML = `
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
    console.log("📄 Iniciando geração do PDF...");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait", // Modo retrato
        unit: "mm",
        format: "a4"
    });

    if (!jsPDF) {
        console.error("❌ jsPDF NÃO está carregado!");
        return;
    }

    let listaFiltrada = obterProdutosFiltrados();
    console.log("📌 Produtos filtrados:", listaFiltrada);

    if (listaFiltrada.length === 0) {
        alert("Nenhum item encontrado para baixar.");
        console.warn("⚠ Nenhum produto filtrado disponível.");
        return;
    }

    // Configurações iniciais
    let x = 10, y = 20; // Posição inicial
    let larguraCard = 90; // Largura dos cards
    let alturaCard = 30; // Altura fixa dos cards
    let espacamentoX = 10; // Espaço entre os cards horizontalmente
    let espacamentoY = 10; // Espaço entre os cards verticalmente
    let colunas = 2; // Quantidade de colunas no PDF

    // Definição do título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Catálogo de Produtos", 10, 10);

    // Define fonte e tamanho padrão para os produtos
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    listaFiltrada.forEach((produto, index) => {
        // Criando os "cards" no PDF
        doc.roundedRect(x, y, larguraCard, alturaCard, 3, 3); // Borda arredondada

        // Escrevendo o código de referência
        doc.setFont("helvetica", "bold");
        doc.text(`${produto.Referencia || "Sem Referência"}`, x + 5, y + 8);

        // Escrevendo a descrição
        doc.setFont("helvetica", "normal");
        let descricao = doc.splitTextToSize(`${produto.Descricao || "Sem Descrição"}`, larguraCard - 10);
        doc.text(descricao, x + 5, y + 14);

        // Escrevendo a categoria
        doc.setFont("helvetica", "bold");
        doc.setTextColor(120, 120, 120); // Cor cinza para a categoria
        doc.text(`Categoria: ${produto.Categoria || "Sem Categoria"}`, x + 5, y + 26);

        // Ajustando a posição dos próximos produtos
        if ((index + 1) % colunas === 0) {
            // Se for a última coluna, pula linha
            x = 10;
            y += alturaCard + espacamentoY;
        } else {
            // Senão, move para a próxima coluna
            x += larguraCard + espacamentoX;
        }

        // Verifica se chegou ao fim da página e precisa criar uma nova
        if (y + alturaCard > 280) {
            doc.addPage();
            y = 20;
            x = 10;
        }

        // Reseta a cor do texto para preto
        doc.setTextColor(0, 0, 0);
    });

    console.log("✅ PDF gerado com layout de catálogo!");
    doc.save("catalogo_produtos.pdf");
}

console.log("Verificando jsPDF:", window.jspdf);

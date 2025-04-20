// gerar-imagens-imagekit.js
const fs = require("fs");
const ImageKit = require("imagekit");



let todasImagens = [];

async function buscarTodas(skip = 0) {
    console.log(`🔍 Buscando arquivos a partir de ${skip}...`);

    const arquivos = await imagekit.listFiles({
        limit: 1000,
        skip: skip
    });

    if (arquivos.length > 0) {
        const imagensConvertidas = arquivos.map(arq => {
            const nomeCompleto = arq.name.toLowerCase().trim();
            const url = arq.url;

            const indiceUltimoUnderscore = nomeCompleto.lastIndexOf("_");
            const nomeBase = nomeCompleto
                .substring(0, indiceUltimoUnderscore)
                .replace(/\\./g, "")
                .replace(/\s/g, "");

            return {
                nome: nomeBase,
                url: url
            };
        });

        todasImagens.push(...imagensConvertidas);
        await buscarTodas(skip + arquivos.length);
    }
}

buscarTodas().then(() => {
    fs.writeFileSync("imagens.json", JSON.stringify(todasImagens, null, 2));
    console.log(`✅ imagens.json gerado com ${todasImagens.length} arquivos.`);
}).catch(err => {
    console.error("❌ Erro ao buscar arquivos:", err);
});
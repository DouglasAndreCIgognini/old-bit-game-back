import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_FOLDER = path.join(__dirname, "..", "roms");
const CACHE_FILE = path.join(__dirname, "..", "cache.json");

let cache = {};

let totalFiles = 0;
let totalGames = 0;

/**
 * Carrega cache
 */
async function loadCache() {
  try {
    const data = await fs.readFile(
      CACHE_FILE,
      "utf8"
    );

    cache = JSON.parse(data);

    console.log(
      `📦 Cache carregado (${Object.keys(cache).length} jogos)`
    );
  } catch {
    cache = {};
    console.log(
      "📦 Cache não encontrado. Criando novo."
    );
  }
}

/**
 * Salva cache
 */
async function saveCache() {
  await fs.writeFile(
    CACHE_FILE,
    JSON.stringify(cache, null, 2)
  );
}

/**
 * Limpa o nome do jogo
 */
function normalizeTitle(title) {
  return title
    .replace(/\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[-–—]\s*$/g, "")
    .trim();
}

/**
 * Busca jogo na IGDB
 */
async function searchGame(title) {
  try {
    const response = await fetch(
      "https://api.igdb.com/v4/games",
      {
        method: "POST",
        headers: {
          "Client-ID":
            process.env.IGDB_CLIENT_ID,
          Authorization:
            `Bearer ${process.env.IGDB_TOKEN}`,
          "Content-Type":
            "text/plain"
        },
        body: `
          search "${title}";
          fields
            name,
            summary,
            genres.name,
            cover.image_id;
          limit 1;
        `
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `HTTP ${response.status} - ${errorText}`
      );
    }

    const data =
      await response.json();

    if (!data.length) {
      console.log(
        `⚠️ Nenhum resultado encontrado para "${title}"`
      );

      return null;
    }

    return data[0];
  } catch (err) {
    console.error(
      `❌ Erro buscando "${title}"`
    );

    console.error(err);

    return null;
  }
}

/**
 * Converte retorno da IGDB
 */
function mapGameData(game) {
  if (!game) {
    return {
      description: "",
      category: [],
      image_url: null
    };
  }

  return {
    description:
      game.summary || "",

    category:
      game.genres?.map(
        genre => genre.name
      ) || [],

    image_url:
      game.cover?.image_id
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : null
  };
}

/**
 * Consulta cache
 */
async function getGameInfo(title) {
  if (cache[title]) {
    console.log(
      `📦 Cache: ${title}`
    );

    return cache[title];
  }

  console.log(
    `🔎 Buscando: ${title}`
  );

  const game =
    await searchGame(title);

  const result =
    mapGameData(game);

  cache[title] = result;

  await saveCache();

  // Evita rate limit
  await new Promise(resolve =>
    setTimeout(resolve, 300)
  );

  return result;
}

/**
 * Enriquece arquivo
 */
async function enrichFile(filePath) {
  console.log(
    "\n================================="
  );

  console.log(
    `📄 PROCESSANDO: ${filePath}`
  );

  console.log(
    "================================="
  );

  try {
    const content =
      await fs.readFile(
        filePath,
        "utf8"
      );

    let games;

    try {
      games =
        JSON.parse(content);
    } catch (err) {
      console.error(
        `❌ JSON inválido: ${filePath}`
      );

      return;
    }

    if (!Array.isArray(games)) {
      console.error(
        `❌ Arquivo não é array: ${filePath}`
      );

      return;
    }

    console.log(
      `🎮 Jogos encontrados: ${games.length}`
    );

    let updated = false;

    for (const game of games) {
      totalGames++;

      console.log(
        `➡️ ${game.title}`
      );

      const cleanTitle =
        normalizeTitle(
          game.title
        );

      const info =
        await getGameInfo(
          cleanTitle
        );

      game.description =
        info.description;

      game.category =
        info.category;

      game.image_url =
        info.image_url;

      updated = true;
    }

    if (updated) {
      await fs.writeFile(
        filePath,
        JSON.stringify(
          games,
          null,
          2
        ),
        "utf8"
      );

      console.log(
        `✅ ARQUIVO SALVO: ${filePath}`
      );
    } else {
      console.log(
        `ℹ️ Nada alterado: ${filePath}`
      );
    }
  } catch (err) {
    console.error(
      `❌ Erro no arquivo ${filePath}`
    );

    console.error(err);
  }
}

/**
 * Percorre diretórios
 */
async function walk(dir) {
  console.log(
    `\n📁 Entrando em ${dir}`
  );

  const entries =
    await fs.readdir(dir, {
      withFileTypes: true
    });

  for (const entry of entries) {
    const fullPath =
      path.join(
        dir,
        entry.name
      );

    if (entry.isDirectory()) {
      console.log(
        `📂 Diretório: ${fullPath}`
      );

      await walk(fullPath);

      continue;
    }

    console.log(
      `📄 Encontrado: ${fullPath}`
    );

    if (
      entry.isFile() &&
      entry.name.endsWith(".json")
    ) {
      totalFiles++;

      await enrichFile(
        fullPath
      );
    }
  }
}

/**
 * Main
 */
(async () => {
  try {
    console.log(
      "🚀 Iniciando processamento"
    );

    console.log(
      "Client ID:",
      process.env.IGDB_CLIENT_ID
        ? "OK"
        : "NÃO ENCONTRADO"
    );

    console.log(
      "Token:",
      process.env.IGDB_TOKEN
        ? "OK"
        : "NÃO ENCONTRADO"
    );

    await loadCache();

    await walk(ROOT_FOLDER);

    console.log(
      "\n🏁 Terminou walk()"
    );

    await saveCache();

    console.log(
      "\n🎉 Concluído"
    );

    console.log(
      `📄 Arquivos processados: ${totalFiles}`
    );

    console.log(
      `🎮 Jogos processados: ${totalGames}`
    );
  } catch (err) {
    console.error(
      "❌ Erro fatal"
    );

    console.error(err);
  }
})();
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("../src/generated/prisma/client");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const adapter = new adapter_pg_1.PrismaPg({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new client_1.PrismaClient({
    adapter,
});
const ROMS_PATH = node_path_1.default.resolve(process.cwd(), 'roms');
const cores = {
    'atari-2600': 'stella2014',
    'atari-5200': 'a5200',
    'atari-7800': 'prosystem',
    'atari-jaguar': 'virtualjaguar',
    'atari-lynx': 'handy',
    'bandai-wonderswan': 'mednafen_wswan',
    colecovision: 'gearcoleco',
    'commodore-64': 'vice_x64sc',
    'commodore-amiga': 'puae',
    'gce-vectrex': '',
    'microsoft-msx': 'msx',
    'nec-pc-engine-cd-turbografx-cd': 'mednafen_pce',
    'nec-pc-engine-supergrafx': 'mednafen_pce',
    'nec-pc-engine-turbografx-16': 'mednafen_pce',
    'nintendo-64': 'mupen64plus_next',
    'nintendo-ds': 'melonds',
    'nintendo-fds': 'nes',
    'nintendo-gameboy': 'gambatte',
    'nintendo-gameboy-advance': 'mgba',
    'nintendo-gameboy-color': 'gambatte',
    'nintendo-nes': 'fceumm',
    'nintendo-snes': 'snes9x',
    'nintendo-virtualboy': 'beetle_vb',
    'panasonic-3do': 'opera',
    ps1: 'pcsx_rearmed',
    'sega-32x': 'picodrive',
    'sega-cd': 'genesis_plus_gx',
    'sega-gamegear': 'genesis_plus_gx',
    'sega-genesis': 'genesis_plus_gx',
    'sega-saturn': 'yabause',
    'sega-sg1000': 'genesis_plus_gx',
    'sega-sms': 'smsplus',
    'snk-ngpc': 'mednafen_ngp',
};
async function getJsonFiles(platformPath) {
    const files = await promises_1.default.readdir(platformPath, {
        withFileTypes: true,
    });
    return files
        .filter((file) => file.isFile() && file.name.toLowerCase().endsWith('.json'))
        .map((file) => node_path_1.default.join(platformPath, file.name));
}
async function main() {
    console.log('======================================');
    console.log('      IMPORTAÇÃO DOS JOGOS');
    console.log('======================================');
    const platforms = await promises_1.default.readdir(ROMS_PATH, {
        withFileTypes: true,
    });
    let totalGames = 0;
    let totalCategories = 0;
    let totalRelations = 0;
    for (const platformEntry of platforms) {
        if (!platformEntry.isDirectory()) {
            continue;
        }
        const platform = platformEntry.name;
        const core = cores[platform];
        if (!core) {
            console.warn(`\n⚠️ Plataforma ignorada: ${platform}`);
            continue;
        }
        const platformPath = node_path_1.default.join(ROMS_PATH, platform);
        console.log(`\n🎮 Plataforma: ${platform}`);
        console.log(`⚙️ Core: ${core}`);
        const jsonFiles = await getJsonFiles(platformPath);
        console.log(`📄 Arquivos encontrados: ${jsonFiles.length}`);
        for (const jsonFile of jsonFiles) {
            console.log(`   → ${node_path_1.default.basename(jsonFile)}`);
            let content;
            try {
                content = await promises_1.default.readFile(jsonFile, 'utf-8');
            }
            catch (error) {
                console.error(`❌ Erro ao ler ${jsonFile}`, error);
                continue;
            }
            let games;
            try {
                games = JSON.parse(content);
            }
            catch (error) {
                console.error(`❌ JSON inválido: ${jsonFile}`, error);
                continue;
            }
            if (!Array.isArray(games)) {
                console.error(`❌ O arquivo não contém um array: ${jsonFile}`);
                continue;
            }
            for (const gameData of games) {
                if (!gameData.title || !gameData.link) {
                    console.warn(`⚠️ Jogo ignorado por dados incompletos:`, gameData);
                    continue;
                }
                try {
                    const game = await prisma.game.upsert({
                        where: {
                            link: gameData.link,
                        },
                        update: {
                            title: gameData.title,
                            platform: core,
                            description: gameData.description ?? null,
                            image_url: gameData.image_url ?? null,
                        },
                        create: {
                            title: gameData.title,
                            link: gameData.link,
                            platform: core,
                            description: gameData.description ?? null,
                            image_url: gameData.image_url ?? null,
                        },
                    });
                    totalGames++;
                    const categories = gameData.category ?? [];
                    for (const categoryName of categories) {
                        if (!categoryName?.trim()) {
                            continue;
                        }
                        const normalizedCategory = categoryName.trim();
                        const category = await prisma.category.upsert({
                            where: {
                                name: normalizedCategory,
                            },
                            update: {},
                            create: {
                                name: normalizedCategory,
                            },
                        });
                        totalCategories++;
                        await prisma.categoryGame.upsert({
                            where: {
                                game_id_category_id: {
                                    game_id: game.id,
                                    category_id: category.id,
                                },
                            },
                            update: {},
                            create: {
                                game_id: game.id,
                                category_id: category.id,
                            },
                        });
                        totalRelations++;
                    }
                }
                catch (error) {
                    console.error(`❌ Erro importando: ${gameData.title}`);
                    console.error(error);
                }
            }
        }
    }
    console.log('\n======================================');
    console.log('          IMPORTAÇÃO FINALIZADA');
    console.log('======================================');
    console.log(`🎮 Jogos processados: ${totalGames}`);
    console.log(`🏷️ Categorias processadas: ${totalCategories}`);
    console.log(`🔗 Relações processadas: ${totalRelations}`);
}
main()
    .catch((error) => {
    console.error('❌ Erro durante a importação:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
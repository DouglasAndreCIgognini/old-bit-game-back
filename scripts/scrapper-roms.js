import * as cheerio from 'cheerio'
import fs from 'fs/promises'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function scrapperRomsEdgeEmu(platform, letter) {
    const baseUrl = 'https://edgeemu.net'

    try {
        const response = await fetch(
            `${baseUrl}/browse/${platform}/${letter}`
        )

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        const roms = []

        $('div.item').each((index, element) => {
            const title = $(element)
                .find('details summary')
                .text()
                .trim()

            const relativeLink = $(element)
                .find('details p a')
                .attr('href')

            if (!relativeLink) return

            roms.push({
                title,
                link: baseUrl + relativeLink
            })
        })

        await fs.mkdir(`../roms/${platform}`, {
            recursive: true
        })

        await fs.writeFile(
            `../roms/${platform}/${letter}.json`,
            JSON.stringify(roms, null, 2),
            'utf-8'
        )

        console.log(
            `[OK] ${platform} - ${letter} -> ${roms.length} ROMs`
        )

    } catch (error) {
        console.error(
            `Erro em ${platform} - ${letter}:`,
            error.message
        )
    }
}

const letters = [
    '1',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z'
]

for (const letter of letters) {
    await scrapperRomsEdgeEmu(
        'commodore-64',
        letter
    )
}
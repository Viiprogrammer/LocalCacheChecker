import {bestTitleSimilarity} from './matcher.js'

export async function enrichRelease(
    release,
    client
) {
    const queries = [
        release.originalName,
        release.title
    ].filter(Boolean)

    let candidates = []

    for (const query of queries) {
        const results = await client.search(query)

        candidates.push(...results)
    }

    candidates = candidates.map(item => ({
        item,
        score:
            bestTitleSimilarity(
                queries,
                [
                    item.title?.english,
                    item.title?.romaji,
                    item.title?.native,
                    ...(item.synonyms || [])
                ]
            )
    }))

    candidates.sort((a, b) =>
        b.score - a.score
    )

    const best = candidates[0]

    if (!best || best.score < 0.72) {
        return null
    }

    return {
        id: best.item.id,
        titles: best.item.title,
        synonyms: best.item.synonyms,
        description: best.item.description,
        year: best.item.startDate?.year,
        format: best.item.format,
        genres: best.item.genres,
        score: best.score
    }
}

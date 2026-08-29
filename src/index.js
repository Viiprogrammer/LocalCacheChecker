import fsp from 'node:fs/promises'
import path from 'node:path'
import PQueue from 'p-queue'
import { chunkArray, fileSize } from './utils.js'

import {
    fetchAgeRatings,
    fetchCatalog,
    fetchFranchise,
    fetchFranchises,
    fetchGenres,
    fetchReleases,
    fetchSchedule,
    fetchSeasons, fetchTypes
} from './api.js'

import {
    transformAge,
    transformFranchise,
    transformRelease,
    transformSchedule,
    transformSeasons,
    transformTypes
} from './transformers.js'
import { enrichRelease } from "./anilist/enrich.js"
import { AniListClient } from "./anilist/client.js"

const queue = new PQueue({ concurrency: 5 });

const cacheDir = 'cache'

function gitifyJSONArray(arr, key) {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
        return '[\n]';
    }

    const sortedArr = [...arr].sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return aValue - bValue;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return aValue.localeCompare(bValue);
        }

        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;
        return 0;
    });

    return '[\n' + sortedArr.map(x => JSON.stringify(x)).join(',\n') + '\n]' + '\n';
}

async function main() {
    console.time('releases')
    const episodes = []
    const torrents = []

    const releases = await fetchFullCatalog()
    const transformedReleases = []

    const releasesChunks = chunkArray([...releases.values()].sort((a, b) => a.id - b.id), 50)
    let totalFetched = 0

    const missing = new Set()

    for (let i = 0; i < releasesChunks.length; i++) {
        const ids = releasesChunks[i]
        await queue.add(async () => {

            const missingLocal = new Set()

            const chunkData = await fetchReleases(ids)
            const fetchedCount = chunkData.data?.length || 0
            totalFetched += fetchedCount

            const receivedIds = new Set(chunkData.data?.map(r => r.id) || [])
            const missingFromThisChunk = ids.filter(id => !receivedIds.has(id))
            missingFromThisChunk.forEach(id => missingLocal.add(id))

            console.log(`Fetched releases ${fetchedCount} / ${ids.length} (Total ${releases.size})`)

            const successCount = totalFetched
            const missingCount = missingLocal.size
            const totalProcessed = successCount + missingCount
            const ratio = successCount / releases.size

            console.log(`Progress: (${successCount} fetched - ${missingCount} missing) / ${releases.size} = ${ratio.toFixed(4)} (${(ratio * 100).toFixed(2)}%)`)

            for (const r of chunkData.data) {
                const { release, releaseEpisodes, releaseTorrents} = transformRelease(r)


                episodes.push(releaseEpisodes)
                torrents.push(...releaseTorrents)
                transformedReleases.push(release)
            }

            if (missingFromThisChunk.length > 0) {
                console.log(`Some releases missing in list responses`, missingFromThisChunk.join(','))
            }

            missingLocal.forEach(id => missing.add(id))
        })
    }

    const totalReleases = transformedReleases.length
    const successRate = (totalFetched / totalReleases * 100).toFixed(2)
    const lossRate = (missing.size / totalReleases * 100).toFixed(2)

    console.log(`\n--------------------------\n`)
    console.log(`Total releases in catalog: ${totalReleases}`)
    console.log(`Successfully fetched: ${totalFetched} (${successRate}%)`)
    console.log(`Missing (errors/problems): ${missing.size} (${lossRate}%)`)

    if (missing.size > 0) {
        console.log(`Missing release IDs: ${[...missing].join(',')}`)
        await fsp.writeFile(path.join(cacheDir, 'missing_releases.json'), JSON.stringify({
            count: missing.size,
            ids: [...missing],
            timestamp: new Date().toISOString()
        }, null, 2))
    }

    const releasesChunksResult = chunkArray(transformedReleases, 300)
    for (let i = 0; i < releasesChunksResult.length; i++) {
        await fsp.writeFile(path.join(cacheDir, 'releases' + i + '.json'), gitifyJSONArray(releasesChunksResult[i], 'id'))
    }

    const episodesChunksResult = chunkArray(episodes.sort((a, b) => a.releaseId - a.releaseId), 200)
    for (let i = 0; i < episodesChunksResult.length; i++) {
        await fsp.writeFile(path.join(cacheDir, 'episodes' + i + '.json'), gitifyJSONArray(episodesChunksResult[i], 'releaseId'))
    }

    await fsp.writeFile(path.join(cacheDir, 'torrents.json'), gitifyJSONArray(torrents, 'releaseId'))

    await fsp.writeFile(path.join(cacheDir, 'ignored.json'), '[]')

    await fsp.writeFile(path.join(cacheDir, 'metadata'), JSON.stringify({
        "lastReleaseTimeStamp": Math.floor(new Date().getTime() / 1000),
        "countEpisodes": episodesChunksResult.length,
        "countReleases": releasesChunksResult.length
    }))

    console.timeEnd('releases')

    console.time('franchises')

    const transformedFranchises = []

    const franchisesIds = await fetchFranchises()
        .then(x => [...new Set([...x.map(y => y.id)]).values()])

    const chunks = chunkArray(franchisesIds, 50)

    console.log('Fetched', franchisesIds.length, 'franchises')

    for (const chunk of chunks) {
        for (const fid of chunk) {
            console.log('Fetching franchise', fid)
            const franchise = await fetchFranchise(fid)

            transformedFranchises.push(transformFranchise(franchise))
        }

        await new Promise(resolve => setTimeout(resolve, 4000))
    }

    await fsp.writeFile(path.join(cacheDir, 'releaseseries.json'), gitifyJSONArray(transformedFranchises, 'title'))

    console.timeEnd('franchises')

    console.time('schedule')

    const transformedSchedule = []
    const schedule = await fetchSchedule()

    console.log('Fetched schedule', schedule.length)

    for (const item of schedule) {
        transformedSchedule.push(transformSchedule(item))
    }

    console.timeEnd('schedule')

    await fsp.writeFile(path.join(cacheDir, 'schedule.json'), JSON.stringify(transformedSchedule))

    const [
        ageRatings,
        genres,
        seasons,
        types
    ] = await Promise.all([
        fetchAgeRatings(),
        fetchGenres(),
        fetchSeasons(),
        fetchTypes()
    ])

    console.log('Fetched ', ageRatings.length, 'age ratings')
    console.log('Fetched ', genres.length, 'genres')
    console.log('Fetched ', seasons.length, 'seasons')
    console.log('Fetched ', types.length, 'types')

    await fsp.writeFile(path.join(cacheDir, 'types.json'), JSON.stringify({
        ageRatings: ageRatings.map(transformAge),
        genres,
        seasons: seasons.map(transformSeasons),
        types: types.map(transformTypes)
    }))

    /*console.time('anilist')

    const anilistFilesList = await fsp.readdir(cacheDir);
    const anilistFiles = anilistFilesList.filter(f => f.startsWith('anilist') && f.endsWith('.json'));
    const anilistCache = new Map();

    for (const file of anilistFiles) {
        const data = await fsp.readFile(path.join(cacheDir, file), 'utf-8')
            .then(x => JSON.parse(x))

        for (const item of data) {
            anilistCache.set(item.id, item);
        }
    }

    const anilibriaIdToCache = new Map();
    for (const item of anilistCache.values()) {
        if (item.anilibria_id) {
            anilibriaIdToCache.set(item.anilibria_id, item);
        }
    }

    const missingAnilistReleases = transformedReleases.filter(release => {
        return !anilibriaIdToCache.has(release.id);
    });

    console.log(`Total releases (anilibria): ${transformedReleases.length}`);
    console.log(`Already cached (anilibris - anilist): ${transformedReleases.length - missingAnilistReleases.length}`);
    console.log(`Missing (anilist): ${missingAnilistReleases.length}`);

    const anilistClient = new AniListClient()

    for (const release of missingAnilistReleases) {
        const enriched = await enrichRelease(
            release,
            anilistClient,
            anilistCache
        )

        if (enriched) {
            console.log(
                'AniList enrich',
                release.id,
                release.title,
                '→',
                enriched.titles.english ||
                enriched.titles.romaji
            )

            enriched.anilibria_id = release.id
            anilistCache.set(enriched.id, enriched)
        } else {
            console.log(
                'AniList enrich',
                release.id,
                release.title,
                '| not found'
            )
        }
    }

    const enrichedReleases = [...anilistCache.values()].sort((a, b) => a.id - b.id)
    const enrichedReleasesChunksResult = chunkArray(enrichedReleases, 300)

    for (let i = 0; i < enrichedReleasesChunksResult.length; i++) {
        await fsp.writeFile(path.join(cacheDir, 'anilist' + i + '.json'), gitifyJSONArray(enrichedReleasesChunksResult[i], 'id'))
    }

    console.timeEnd('anilist')*/

    const dirFiles = await fsp.readdir(cacheDir)

    const table = []

    for (const file of dirFiles) {
        const stats = await fsp.stat(path.join(cacheDir, file))
        table.push([file, fileSize(stats.size)])
    }

    console.table(table)
}

main()

/**
 * Fetches full catalog from API
 * @returns {Promise<Set<string>>}
 */
async function fetchFullCatalog() {
    let totalReleaseLast = 0
    const allReleases = new Set()

    const firstPage = await fetchCatalog(1)

    const totalPages = firstPage.meta.pagination.total_pages

    console.log(`Total releases: ${firstPage.meta.pagination.total}`)
    console.log(`Total pages: ${totalPages}`)

    for (let page = 1; page <= totalPages; page++) {
        console.log(`Fetch page ${page} / ${totalPages}`)

        const releases = await fetchCatalog(page)

        for (const release of releases.data) {
            allReleases.add(release.id)
        }

        totalReleaseLast = firstPage.meta.pagination.total
    }

    console.log(`Total ${allReleases.size}. Total in catalog ${totalReleaseLast}`)

    return allReleases
}


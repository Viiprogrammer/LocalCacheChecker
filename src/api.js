import { Agent, RetryAgent } from 'undici'

const ua = 'LocalCacheCheckerNd/1.0.0 (github.com/AnimeHaze/LocalCacheCheckerNd)'
const endpoint = 'https://anilibria.top'

const agent = new RetryAgent(new Agent(), {
  maxRetries: 5,
  minTimeout: 3000,
  timeoutFactor: 2,
})



export async function fetchFranchises () {
    const url = new URL('/api/v1/anime/franchises', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchFranchise(id) {
    const url = new URL('/api/v1/anime/franchises/' + id, endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchCatalog (page) {
    page = page ? page : 1

    const url = new URL('/api/v1/anime/catalog/releases', endpoint)

    url.searchParams.set('page', page)
    url.searchParams.set('limit', '50')
    url.searchParams.set('f[sorting]', 'FRESH_AT_DESC')
console.log(url)
    return await fetch(url, {
        dispatcher: agent,
        method: 'POST',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchReleases (ids, page) {
    page = page ? page : 1

    const url = new URL('/api/v1/anime/releases/list', endpoint)

    url.searchParams.set('ids', ids.join(','))
    url.searchParams.set('page', page)
    url.searchParams.set('limit', '50')

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchSchedule () {
    const url = new URL('/api/v1/anime/schedule/week', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchAgeRatings () {
    const url = new URL('/api/v1/anime/catalog/references/age-ratings', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchGenres () {
    const url = new URL('/api/v1/anime/catalog/references/genres', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchSeasons () {
    const url = new URL('/api/v1/anime/catalog/references/seasons', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

export async function fetchTypes () {
    const url = new URL('/api/v1/anime/catalog/references/types', endpoint)

    return await fetch(url, {
        dispatcher: agent,
        method: 'GET',
        keepalive: true,
        headers: {
            'user-agent': ua
        }
    })
        .then(x => x.json())
}

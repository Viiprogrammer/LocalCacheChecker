import { Agent, RetryAgent, request } from 'undici'

const ua = 'LocalCacheCheckerNd/1.0.0 (github.com/AnimeHaze/LocalCacheCheckerNd)'
const endpoint = 'https://anilibria.top'

const agent = new RetryAgent(new Agent(), {
  maxRetries: 5,
  minTimeout: 3000,
  timeoutFactor: 2,
})

async function makeRequest(url, options = {}) {
  const { statusCode, body, headers } = await request(url, {
    ...options,
    dispatcher: agent,
    headers: {
      'user-agent': ua,
      ...options.headers,
    },
  })

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Request failed with status ${statusCode}`)
  }

  return await body.json()
}

export async function fetchFranchises() {
  const url = new URL('/api/v1/anime/franchises', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchFranchise(id) {
  const url = new URL('/api/v1/anime/franchises/' + id, endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchCatalog(page) {
  page = page || 1

  const url = new URL('/api/v1/anime/catalog/releases', endpoint)
  url.searchParams.set('page', page)
  url.searchParams.set('limit', '50')
  url.searchParams.set('f[sorting]', 'FRESH_AT_DESC')

  return await makeRequest(url, {
    method: 'POST',
    keepalive: true,
  })
}

export async function fetchReleases(ids, page) {
  page = page || 1

  const url = new URL('/api/v1/anime/releases/list', endpoint)
  url.searchParams.set('ids', ids.join(','))
  url.searchParams.set('page', page)
  url.searchParams.set('limit', '50')

  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchSchedule() {
  const url = new URL('/api/v1/anime/schedule/week', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchAgeRatings() {
  const url = new URL('/api/v1/anime/catalog/references/age-ratings', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchGenres() {
  const url = new URL('/api/v1/anime/catalog/references/genres', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchSeasons() {
  const url = new URL('/api/v1/anime/catalog/references/seasons', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}

export async function fetchTypes() {
  const url = new URL('/api/v1/anime/catalog/references/types', endpoint)
  return await makeRequest(url, {
    method: 'GET',
    keepalive: true,
  })
}
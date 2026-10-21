import PQueue from 'p-queue'

const ENDPOINT = 'https://graphql.anilist.co'

const QUERY = `
query ($search: String) {
  Page(perPage: 5) {
    media(search: $search, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      synonyms
      description(asHtml: false)
      startDate {
        year
      }
      format
      genres
    }
  }
}
`

export class AniListClient {
    constructor(fetchImpl = fetch) {
        this.fetch = fetchImpl

        this.queue = new PQueue({
            concurrency: 1,
            intervalCap: 15,
            interval: 55
        })
    }

    async search(query) {
        return this.queue.add(async () => {

            while (true) {
                try {
                    await new Promise(resolve =>
                        setTimeout(resolve, 1500)
                    )

                    const response = await this.fetch(ENDPOINT, {
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json',
                            accept: 'application/json'
                        },
                        body: JSON.stringify({
                            query: QUERY,
                            variables: { search: query }
                        })
                    })

                    if (response.status === 429) {
                        const retryAfter =
                            Number(
                                response.headers.get('retry-after') || 5
                            )

                        console.log(
                            `AniList ratelimited. Sleeping ${retryAfter}s`
                        )

                        await new Promise(resolve =>
                            setTimeout(resolve, retryAfter * 1000)
                        )

                        continue
                    }

                    if (!response.ok) {
                        throw new Error(
                            `AniList ${response.status}`
                        )
                    }

                    const json = await response.json()

                    return json.data?.Page?.media || []

                } catch (error) {

                    console.error(
                        'AniList request failed:',
                        error.message
                    )

                    await new Promise(resolve =>
                        setTimeout(resolve, 5000)
                    )
                }
            }
        })
    }
}
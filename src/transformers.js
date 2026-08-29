import { removeUrlSearchParams } from "./utils.js";

export function transformRelease(release) {
    const releaseEpisodes = {
        releaseId: release.id,
        items: release.episodes ? release.episodes.map(transformEpisode) : []
    }

    const releaseTorrents = release.torrents ? release.torrents.map(x => transformTorrent(release, x)) : []

    return {
        release: {
            announce: release.notification ?? "",
            code: release.alias,
            countTorrents: releaseTorrents.length,
            countVideos: releaseEpisodes.items.length,
            description: release.description ?? "",
            genres: release.genres.map(x => x.name).join(', '),
            id: release.id,
            timestamp: new Date(release.fresh_at).getTime() / 1000,
            originalName: release.name?.english ?? "",
            title: release.name?.main ?? "",
            poster: release.poster.src,
            rating: release.added_in_users_favorites,
            season: release.season.description, // maybe need to sync with seasons.json
            series: /*item.EpisodesAreUnknown ? */ `(${release.episodes_total ?? 0})`,
            status: release.is_in_production ? "Сейчас в озвучке" : "Озвучка завершена",
            isOngoing: release.is_ongoing ?? false,
            type: release.type?.description ?? "",
            voices: "",
            team: "",
            year: release.year?.toString(),
            ageRating: release.age_rating?.description ?? "",
        },
        releaseEpisodes,
        releaseTorrents
    }
}

export function transformEpisode(ep, index) {
    return {
        id: ep.id,
        name: ep.name ?? "",
        nameEnglish: ep.name_english ?? "",
        updatedAt: ep.updated_at,
        ordinal: ep.ordinal,
        sortOrder: ep.sort_order,
        hls_480: removeUrlSearchParams(ep.hls_480),
        hls_720: removeUrlSearchParams(ep.hls_720),
        hls_1080: removeUrlSearchParams(ep.hls_1080),
        duration: ep.duration,
        rutubeId: ep.rutube_id,
        youtubeId: ep.youtube_id,
        opening: ep.opening,
        ending: ep.ending,
        preview: {
            src: ep.preview?.preview
        }
    }
}

export function transformTorrent(release, t) {
    return {
        releaseId: release.id,
        time: new Date(t.updated_at).getTime() / 1000,
        hash: t.hash,
        id: t.id,
        magnet: t.magnet,
        filename: t.filename,
        description: t.description ?? "",
        quality: t.quality,
        codec: t.codec,
        type: t.type,
        size: t.size ?? 0,
        seeders: t.seeders ?? 0,
    }
}

export function transformFranchise(f) {
    const releases = f.franchise_releases.sort((a, b) => a.sort_order - b.sort_order);

    return {
        countReleases: releases.length,
        poster: f.image.preview,
        posters: releases.map(x => x.release.poster.src),
        releasesIds: releases.map(x => x.release_id),
        titles: releases.map(x => x.release.name?.main || x.release.name?.english),
        title: f.name,
        sec: f.total_duration_in_seconds,
        eps: f.total_episodes,
        rat: f.rating ?? 0
    }
}

export function transformSchedule (item) {
    return { [item.release.id]: item.release.publish_day.value }
}

export function transformSeasons(season) {
    return {
        value: season.value,
        description: season.description,
        label: season.label ?? ''
    }
}

export function transformTypes(typ) {
    return {
        value: typ.value,
        description: typ.description,
        label: typ.label ?? ''
    }
}

export function transformAge (age) {
    return {
        value: age.value,
        description: age.description,
        label: age.label ?? ''
    }
}
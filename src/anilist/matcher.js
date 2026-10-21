export function normalizeWhitespace (value) {
    if (typeof value !== 'string') {
        return ''
    }

    return value.replace(/\s+/g, ' ').trim()
}

export function normalizeTitle (value) {
    return normalizeWhitespace(value)
        .toLowerCase()
        .replace(/[()[\]{}'"`.,!?/\\|:;~@#$%^&*_+=-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function tokenizeTitle (value) {
    const normalized = normalizeTitle(value)
    return normalized ? normalized.split(' ').filter(Boolean) : []
}

export function bigrams (value) {
    const normalized = normalizeTitle(value).replace(/\s/g, '')

    if (normalized.length < 2) {
        return normalized ? [normalized] : []
    }

    const pairs = []
    for (let index = 0; index < normalized.length - 1; index++) {
        pairs.push(normalized.slice(index, index + 2))
    }

    return pairs
}

export function diceCoefficient (left, right) {
    const leftPairs = bigrams(left)
    const rightPairs = bigrams(right)

    if (!leftPairs.length || !rightPairs.length) {
        return 0
    }

    const rightCounts = new Map()
    rightPairs.forEach(pair => {
        rightCounts.set(pair, (rightCounts.get(pair) || 0) + 1)
    })

    let matches = 0
    leftPairs.forEach(pair => {
        const count = rightCounts.get(pair) || 0
        if (count > 0) {
            matches += 1
            rightCounts.set(pair, count - 1)
        }
    })

    return (2 * matches) / (leftPairs.length + rightPairs.length)
}

export function tokenOverlap (left, right) {
    const leftTokens = new Set(tokenizeTitle(left))
    const rightTokens = new Set(tokenizeTitle(right))

    if (!leftTokens.size || !rightTokens.size) {
        return 0
    }

    let matches = 0
    leftTokens.forEach(token => {
        if (rightTokens.has(token)) {
            matches += 1
        }
    })

    return matches / Math.max(leftTokens.size, rightTokens.size)
}

export function bestTitleSimilarity (inputs, candidates) {
    let bestScore = 0

    inputs.filter(Boolean).forEach(input => {
        candidates.filter(Boolean).forEach(candidate => {
            const normalizedInput = normalizeTitle(input)
            const normalizedCandidate = normalizeTitle(candidate)

            if (!normalizedInput || !normalizedCandidate) {
                return
            }

            if (normalizedInput === normalizedCandidate) {
                bestScore = Math.max(bestScore, 1)
                return
            }

            if (
                normalizedInput.includes(normalizedCandidate) ||
                normalizedCandidate.includes(normalizedInput)
            ) {
                bestScore = Math.max(bestScore, 0.92)
            }

            bestScore = Math.max(
                bestScore,
                diceCoefficient(input, candidate),
                tokenOverlap(input, candidate)
            )
        })
    })

    return bestScore
}

/**
 * Slice array to chunks with size
 * @param {Array} arr
 * @param {number} [size=300]
 * @returns {Array}
 */
export function chunkArray(arr, size = 300) {
    const chunks = []

    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size))
    }

    return chunks
}

/**
 * Prints human-readable file size
 * @param {number} bytes
 * @returns {string}
 */
export function fileSize (bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    if (bytes === 0) return 'n/a'
    const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))))
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i]
}

/**
 * Remove URLSearchParams from URL if exists. Returns null / undefined if url is null / undefined
 * @param {string} url
 * @returns {string|undefined|null}
 */
export function removeUrlSearchParams(url) {
    return url?.split('?')[0]
}

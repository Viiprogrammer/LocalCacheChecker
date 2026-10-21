import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function getAllFiles(dirPath, arrayOfFiles = []) {
    if (!fs.existsSync(dirPath)) return arrayOfFiles

    const files = fs.readdirSync(dirPath)

    files.forEach(file => {
        const fullPath = path.join(dirPath, file)
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles)
        } else {
            arrayOfFiles.push(fullPath)
        }
    });

    return arrayOfFiles
}

function getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath)
    const hashSum = crypto.createHash('sha256')
    hashSum.update(fileBuffer)

    return hashSum.digest('hex')
}

function trackCacheFiles() {
    const cachePath = 'cache'
    const cacheFiles = {}

    console.log(`Scanning cache directory: ${cachePath}`)

    if (fs.existsSync(cachePath)) {
        let allCacheFiles = getAllFiles(cachePath)

        allCacheFiles.sort((a, b) => path.basename(a).localeCompare(path.basename(b)))

        console.log(`Found ${allCacheFiles.length} files`)

        allCacheFiles.forEach(file => {
            const hash = getFileHash(file)
            const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/')
            cacheFiles[relativePath] = hash.toUpperCase()
        })
    } else {
        console.log('Cache directory does not exist')
    }

    const trackingData = {
        sync_timestamp: new Date().toISOString(),
        generated_at: new Date().toLocaleString('ru-RU', { timeZone: 'UTC' })
            .replace(',', '')
            .replace(/\./g, '-'),
        cache_files: cacheFiles
    };

    fs.writeFileSync('sync_tracking.json', JSON.stringify(trackingData, null, 2))
    console.log(`Tracked ${Object.keys(cacheFiles).length} cache files with hashes`)
    console.log(`Tracking data saved to sync_tracking.json`)
}

trackCacheFiles();
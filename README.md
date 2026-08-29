# LocalCacheCheckerNd

# Running the Project

## Local Run

> **[Node.js](https://nodejs.org/) 20.0.0 or newer is required**  

Install dependencies and start:

```bash
npm install
npm start
```

The generated cache files will be stored in the `cache/` directory.

---

## Run with Docker

Build and run:

```bash
docker compose up --build
```

Or using plain Docker:

```bash
docker build -t local-cachechecker-nd .
docker run --rm -v $(pwd)/cache:/app/cache local-cachechecker-nd
```

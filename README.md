# Golf Course App

A Nuxt 4 web application that allows users to search for golf clubs and courses by name or ID, with detailed tee data for men and women.

## Tech Stack

- **[Nuxt 4](https://nuxt.com/)** — Vue-based full-stack framework
- **[Vue 3](https://vuejs.org/)** — UI framework
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[ESLint](https://eslint.org/)** — Linting via `@nuxt/eslint`
- **[Docker](https://www.docker.com/)** — Containerised development and production builds
- **[Yarn](https://yarnpkg.com/)** — Package manager
- **[Golf Course API](https://golfcourseapi.com/)** — Course data source

## Project Structure

```
GolfCourseApp/
├── docker-compose.yml
└── app/
    ├── Dockerfile
    └── webapp/
        ├── .env                        # Local env vars (gitignored)
        ├── .env.dist                   # Env var template — copy to .env
        ├── eslint.config.mjs
        ├── nuxt.config.ts
        ├── package.json
        └── app/
            ├── app.vue
            ├── types/
            │   └── index.ts            # Shared TypeScript interfaces
            ├── pages/
            │   └── index.vue
            └── components/
                └── CourseListing/
                    └── CourseListing.vue
        └── server/
            └── api/
                └── courses/
                    ├── search.get.ts   # GET /api/courses/search?q=
                    └── [id].get.ts     # GET /api/courses/:id
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v24+
- [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) (for containerised setup)
- A [Golf Course API](https://golfcourseapi.com/) key

### Environment Setup

Copy the env template and add your API key:

```bash
cp app/webapp/.env.dist app/webapp/.env
```

Then edit `.env`:

```env
GOLF_COURSE_API_KEY=your_api_key_here
```

### Local Development (without Docker)

```bash
cd app/webapp
yarn install
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Docker Development

Start the development server:

```bash
docker compose up
```

Stop and remove the containers:

```bash
docker compose down
```

The app will be available at [http://golfcourseapp.local](http://golfcourseapp.local).

Hot-reloading is enabled — changes to files in `app/webapp` are reflected immediately via the mounted volume.

### Production Build (Docker)

```bash
docker build --target production -t golf-course-app ./app
docker run -p 3000:3000 golf-course-app
```

## Available Scripts

| Command          | Description                          |
|------------------|--------------------------------------|
| `yarn dev`       | Start the development server         |
| `yarn build`     | Build for production                 |
| `yarn lint`      | Run ESLint across the project        |
| `yarn test`      | Run the test suite once              |
| `yarn test:watch`| Run tests in watch mode              |

## Testing

Tests live in `app/webapp/tests/` and mirror the `server/` directory structure.

```
tests/
└── api/
    └── courses/
        ├── search.get.spec.ts   # Tests for GET /api/courses/search
        └── id.get.spec.ts       # Tests for GET /api/courses/:id
```

The suite uses [Vitest](https://vitest.dev/) with a plain `node` environment — no Nuxt instance is required to run them.

### Approach

Each spec imports the route handler directly and stubs all H3/Nuxt server globals (`$fetch`, `useRuntimeConfig`, `getQuery`, `getRouterParam`, `createError`, `defineEventHandler`) using `vi.stubGlobal` before each test. This keeps tests fast, isolated, and free of external HTTP calls.

`vi.resetModules()` is called in `beforeEach` so the handler module is re-evaluated fresh with the current stubs on every test.

### Running the tests

```bash
# Single run (CI)
docker compose run app yarn test

# Watch mode (local development)
docker compose run app yarn test:watch
```

## API Routes

| Route                       | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `GET /api/courses/search`   | Search courses by name. Requires `?q=` query param.      |
| `GET /api/courses/:id`      | Fetch a single course by numeric ID.                     |

Both routes proxy to [golfcourseapi.com](https://golfcourseapi.com/) — the API key is kept server-side and never exposed to the browser.

## Environment Variables

| Variable              | Required | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `GOLF_COURSE_API_KEY` | Yes      | API key for [golfcourseapi.com](https://golfcourseapi.com/) |
| `NODE_ENV`            | No       | Node environment (default: `development`)        |
| `NUXT_HOST`           | No       | Host the Nuxt server binds to (default: `0.0.0.0`) |
| `NUXT_PORT`           | No       | Port the Nuxt server listens on (default: `3000`) |

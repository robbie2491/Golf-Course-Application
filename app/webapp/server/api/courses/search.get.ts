/**
 * GET /api/courses/search
 *
 * Proxies a course name search to the Golf Course API.
 * Requires query param: q (search string)
 * Auth is handled server-side via runtimeConfig — the API key is never exposed to the client.
 */
import type { GolfCourseSearchResponse } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { q } = getQuery(event)

  // Validate that a non-empty search string was provided
  if (!q || typeof q !== 'string' || q.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query parameter: q',
    })
  }

  // Forward the search query to the upstream Golf Course API
  const response = await $fetch<GolfCourseSearchResponse>(
    'https://api.golfcourseapi.com/v1/search',
    {
      query: { search_query: q },
      headers: {
        Authorization: `Key ${config.golfCourseApiKey}`,
      },
    },
  )

  return response
})

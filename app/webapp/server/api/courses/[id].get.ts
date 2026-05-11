/**
 * GET /api/courses/:id
 *
 * Fetches a single golf course by its numeric ID from the Golf Course API.
 * Auth is handled server-side via runtimeConfig — the API key is never exposed to the client.
 */
import type { GolfCourseIdResponse } from '~/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Extract the dynamic :id segment from the route
  const id = getRouterParam(event, 'id')

  // Validate that an ID was provided
  if (!id || id.trim() === '') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required route parameter: id',
    })
  }

  try {
    // Fetch the course from the upstream Golf Course API
    const response = await $fetch<GolfCourseIdResponse>(
      `https://api.golfcourseapi.com/v1/courses/${id}`,
      {
        headers: {
          Authorization: `Key ${config.golfCourseApiKey}`,
        },
      },
    )

    return response
  }
  catch (e: unknown) {
    // Return a clean 404 if the upstream API reports the course does not exist
    const status = (e as { status?: number })?.status
    if (status === 404) {
      throw createError({ statusCode: 404, statusMessage: `No course found with ID ${id}` })
    }
    throw e
  }
})

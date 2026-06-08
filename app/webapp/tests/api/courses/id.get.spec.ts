/**
 * Unit tests for GET /api/courses/:id
 *
 * Uses @nuxt/test-utils mockNuxtImport to mock $fetch and useRuntimeConfig
 * so no real HTTP calls are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GolfCourseIdResponse } from '../../../app/types'

// ---------- mocks ----------

// H3/Nuxt server globals — stubbed before each handler import so the
// freshly-loaded module picks up the stubs rather than the real runtime.
let mockFetch: ReturnType<typeof vi.fn>
let mockUseRuntimeConfig: ReturnType<typeof vi.fn>

function stubServerGlobals() {
  mockFetch = vi.fn()
  vi.stubGlobal('$fetch', mockFetch)

  mockUseRuntimeConfig = vi.fn(() => ({ golfCourseApiKey: 'test-api-key' }))
  vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)

  vi.stubGlobal('getRouterParam', (_event: unknown, key: string) => {
    return (_event as { context: { params: Record<string, string> } }).context.params[key]
  })

  vi.stubGlobal('createError', (opts: object) => opts)

  vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
}

// ---------- helpers ----------

/**
 * Builds a minimal H3 event with an optional :id route param.
 */
function makeEvent(id?: string) {
  return {
    context: {
      params: id !== undefined ? { id } : {},
    },
  } as Parameters<typeof import('h3')['getRouterParam']>[0]
}

// ---------- fixture ----------

const mockCourse: GolfCourseIdResponse = {
  course: {
    id: 1,
    club_name: 'Augusta National Golf Club',
    course_name: 'Augusta National',
    location: {
      address: '2604 Washington Rd',
      city: 'Augusta',
      state: 'GA',
      country: 'US',
      latitude: 33.5021,
      longitude: -82.0232,
    },
    tees: { female: [], male: [] },
  },
}

// ---------- tests ----------

describe('GET /api/courses/:id', () => {
  // Import the handler lazily so mocks are applied first
  let handler: Awaited<typeof import('../../../server/api/courses/[id].get')>['default']

  beforeEach(async () => {
    vi.resetModules()
    stubServerGlobals()
    handler = (await import('../../../server/api/courses/[id].get')).default as typeof handler
  })

  it('returns course data for a valid id', async () => {
    mockFetch.mockResolvedValueOnce(mockCourse)

    const result = await handler(makeEvent('1'))

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/courses/1',
      expect.objectContaining({
        headers: { Authorization: 'Key test-api-key' },
      }),
    )
    expect(result).toEqual(mockCourse)
  })

  it('throws 400 when id is missing', async () => {
    await expect(handler(makeEvent(''))).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Missing required route parameter: id',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws 400 when id is whitespace only', async () => {
    await expect(handler(makeEvent('   '))).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 404 when upstream API returns 404', async () => {
    mockFetch.mockRejectedValueOnce({ status: 404 })

    await expect(handler(makeEvent('9999'))).rejects.toMatchObject({
      statusCode: 404,
      statusMessage: 'No course found with ID 9999',
    })
  })

  it('re-throws non-404 upstream errors', async () => {
    const upstreamError = { status: 503, message: 'Service Unavailable' }
    mockFetch.mockRejectedValueOnce(upstreamError)

    await expect(handler(makeEvent('1'))).rejects.toEqual(upstreamError)
  })
})

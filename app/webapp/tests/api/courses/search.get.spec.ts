/**
 * Unit tests for GET /api/courses/search
 *
 * Stubs H3/Nuxt server globals directly with vi.stubGlobal so no real
 * HTTP calls are made and no Nuxt instance is required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GolfCourseSearchResponse } from '../../../app/types'

// ---------- mocks ----------

let mockFetch: ReturnType<typeof vi.fn>
let mockGetQuery: ReturnType<typeof vi.fn>

function stubServerGlobals() {
  mockFetch = vi.fn()
  vi.stubGlobal('$fetch', mockFetch)

  vi.stubGlobal('useRuntimeConfig', () => ({ golfCourseApiKey: 'test-api-key' }))

  mockGetQuery = vi.fn()
  vi.stubGlobal('getQuery', mockGetQuery)

  vi.stubGlobal('createError', (opts: object) => opts)

  vi.stubGlobal('defineEventHandler', (fn: (event: unknown) => unknown) => fn)
}

// ---------- helpers ----------

/** Minimal H3 event — query params are provided via the getQuery mock */
const fakeEvent = {} as Parameters<typeof import('h3')['getQuery']>[0]

// ---------- fixture ----------

const mockSearchResponse: GolfCourseSearchResponse = {
  courses: [
    {
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
    {
      id: 2,
      club_name: 'Augusta Municipal Golf Course',
      course_name: 'Augusta Municipal',
      location: {
        address: '1 Municipal Dr',
        city: 'Augusta',
        state: 'GA',
        country: 'US',
        latitude: 33.47,
        longitude: -82.01,
      },
      tees: { female: [], male: [] },
    },
  ],
}

// ---------- tests ----------

describe('GET /api/courses/search', () => {
  let handler: Awaited<typeof import('../../../server/api/courses/search.get')>['default']

  beforeEach(async () => {
    vi.resetModules()
    stubServerGlobals()
    handler = (await import('../../../server/api/courses/search.get')).default as typeof handler
  })

  it('returns matching courses for a valid query', async () => {
    mockGetQuery.mockReturnValueOnce({ q: 'Augusta' })
    mockFetch.mockResolvedValueOnce(mockSearchResponse)

    const result = await handler(fakeEvent)

    expect(mockFetch).toHaveBeenCalledOnce()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.golfcourseapi.com/v1/search',
      expect.objectContaining({
        query: { search_query: 'Augusta' },
        headers: { Authorization: 'Key test-api-key' },
      }),
    )
    expect(result).toEqual(mockSearchResponse)
  })

  it('throws 400 when q param is missing', async () => {
    mockGetQuery.mockReturnValueOnce({})

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Missing required query parameter: q',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws 400 when q param is an empty string', async () => {
    mockGetQuery.mockReturnValueOnce({ q: '' })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when q param is whitespace only', async () => {
    mockGetQuery.mockReturnValueOnce({ q: '   ' })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('throws 400 when q param is not a string', async () => {
    mockGetQuery.mockReturnValueOnce({ q: 42 })

    await expect(handler(fakeEvent)).rejects.toMatchObject({
      statusCode: 400,
    })
  })

  it('returns an empty courses array when no results match', async () => {
    mockGetQuery.mockReturnValueOnce({ q: 'NoSuchCourse' })
    mockFetch.mockResolvedValueOnce({ courses: [] })

    const result = await handler(fakeEvent)

    expect(result).toEqual({ courses: [] })
  })

  it('propagates upstream fetch errors', async () => {
    mockGetQuery.mockReturnValueOnce({ q: 'Augusta' })
    const upstreamError = new Error('Network error')
    mockFetch.mockRejectedValueOnce(upstreamError)

    await expect(handler(fakeEvent)).rejects.toThrow('Network error')
  })
})

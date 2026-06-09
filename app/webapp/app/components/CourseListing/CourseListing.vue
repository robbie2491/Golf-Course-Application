<script setup lang="ts">
/**
 * CourseListing
 *
 * Displays a searchable, expandable grid of golf courses.
 * Accepts a free-text query — if the input is a numeric ID it first attempts
 * a direct course lookup, falling back to a name search if not found.
 */
import type { GolfCourse, GolfCourseIdResponse, GolfCourseSearchResponse } from '~/types'

// ── State ─────────────────────────────────────────────────────────────────────

const searchQuery = ref('')

const courses = ref<GolfCourse[]>([])
const isLoading = ref(false)
const fetchError = ref<string | null>(null)
const hasSearched = ref(false)

// ID of the currently expanded card (null = all collapsed)
const selectedCourseId = ref<number | null>(null)

// ── Watchers ──────────────────────────────────────────────────────────────────

// Clear results immediately when the search field is emptied
watch(searchQuery, (val) => {
  if (val.trim() === '') {
    courses.value = []
    fetchError.value = null
    hasSearched.value = false
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Toggle the expanded state of a card. Clicking an open card collapses it. */
function selectCourse(courseId: number) {
  selectedCourseId.value = selectedCourseId.value === courseId ? null : courseId
}

/** Returns true if the given course card is currently expanded. */
function isSelected(courseId: number) {
  return selectedCourseId.value === courseId
}

// ── Search ────────────────────────────────────────────────────────────────────

async function onSearch() {
  const query = searchQuery.value.trim()
  if (!query) return

  isLoading.value = true
  fetchError.value = null
  hasSearched.value = true
  selectedCourseId.value = null
  courses.value = []

  try {
    // If the query is purely numeric, attempt a direct ID lookup first
    if (/^\d+$/.test(query)) {
      try {
        const idResponse = await $fetch<GolfCourseIdResponse>(`/api/courses/${query}`)
        courses.value = [idResponse.course]
        return
      }
      catch {
        // ID not found — fall through to name search below
      }
    }

    // Name-based search via the search endpoint
    const searchResponse = await $fetch<GolfCourseSearchResponse>('/api/courses/search', {
      query: { q: query },
    })
    courses.value = searchResponse.courses ?? []
  }
  catch (e: unknown) {
    fetchError.value = e instanceof Error ? e.message : 'An unexpected error occurred'
  }
  finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="max-w-[1100px] mx-auto px-4 py-8 font-sans">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-3xl font-bold text-[#1a3c2e] m-0">
        Golf Courses
      </h2>
    </div>

    <!-- Search form: accepts a course name or numeric ID -->
    <form
      class="mb-8 flex items-end gap-2 flex-wrap"
      @submit.prevent="onSearch"
    >
      <div class="flex gap-2 flex-1 flex-wrap">
        <div class="flex flex-col gap-1 flex-1 min-w-40">
          <label
            for="course-search"
            class="text-xs font-medium text-gray-700"
          >Search by name or ID</label>
          <input
            id="course-search"
            v-model="searchQuery"
            type="search"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 outline-offset-2 focus:outline-2 focus:outline-green-600 disabled:opacity-50"
            placeholder="e.g. St Andrews or 12795"
            :disabled="isLoading"
          >
        </div>
      </div>
      <button
        type="submit"
        class="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg border-none cursor-pointer transition-colors duration-200 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isLoading || searchQuery.trim() === ''"
      >
        {{ isLoading ? 'Searching…' : 'Search' }}
      </button>
    </form>

    <!-- Error state -->
    <p
      v-if="fetchError"
      class="text-center text-red-700 mt-8"
      role="alert"
    >
      Something went wrong: {{ fetchError }}
    </p>

    <!-- Loading state -->
    <p
      v-else-if="isLoading"
      class="text-center text-gray-500 mt-8"
      aria-live="polite"
    >
      Loading courses…
    </p>

    <!-- Empty state: shown only after a search has been submitted -->
    <p
      v-else-if="hasSearched && !isLoading && courses.length === 0"
      class="text-center text-gray-500 mt-8"
    >
      No courses found.
    </p>

    <!-- Results grid: 3 cols desktop → 2 tablet → 1 mobile -->
    <ul
      v-else-if="courses.length"
      class="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <li
        v-for="course in courses"
        :key="course.id"
        class="bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
        :class="isSelected(course.id)
          ? 'col-span-full border-green-600 shadow-[0_4px_16px_rgba(22,163,74,0.15)]'
          : 'border-gray-200 hover:-translate-y-0.5 hover:shadow-md'"
      >
        <!-- Collapsed view: summary button -->
        <button
          v-if="!isSelected(course.id)"
          class="block w-full bg-transparent border-none p-5 text-left cursor-pointer"
          :aria-expanded="false"
          @click="selectCourse(course.id)"
        >
          <div class="flex items-start justify-between gap-2 mb-1">
            <h3 class="text-base font-bold text-[#1a3c2e] m-0 leading-snug">
              {{ course.course_name }}
            </h3>
            <span class="text-[0.7rem] text-gray-400 whitespace-nowrap pt-0.5">View tees ▾</span>
          </div>
          <p class="text-sm font-medium text-green-600 m-0 mb-0.5">
            {{ course.club_name }}
          </p>
          <p class="text-xs text-gray-500 m-0">
            <span aria-hidden="true">📍</span>
            {{ [course.location.city, course.location.state, course.location.country].filter(Boolean).join(', ') }}
          </p>
        </button>

        <!-- Expanded view: full tee data -->
        <div
          v-else
          class="p-5"
        >
          <!-- Expanded header -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="text-base font-bold text-[#1a3c2e] m-0 leading-snug">
                  {{ course.course_name }}
                </h3>
              </div>
              <p class="text-sm font-medium text-green-600 m-0 mb-0.5">
                {{ course.club_name }}
              </p>
              <p class="text-xs text-gray-500 m-0">
                <span aria-hidden="true">📍</span>
                {{ [course.location.city, course.location.state, course.location.country].filter(Boolean).join(', ') }}
              </p>
            </div>
            <!-- Close button collapses the card -->
            <button
              class="bg-transparent border border-gray-200 rounded-md px-2 py-1 text-xs text-gray-500 cursor-pointer flex-shrink-0 transition-colors duration-150 hover:bg-gray-100"
              :aria-label="`Close ${course.course_name}`"
              @click="selectCourse(course.id)"
            >
              ✕
            </button>
          </div>

          <!-- Men's and women's tees displayed side by side, stacks on mobile -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <!-- Men's tees -->
            <div
              v-if="course.tees.male?.length"
              class="border-t border-gray-100 pt-3"
            >
              <h4 class="text-[0.7rem] font-bold uppercase tracking-wider text-blue-700 m-0 mb-2">
                ♂ Men's Tees
              </h4>
              <div
                v-for="tee in course.tees.male"
                :key="tee.tee_name"
                class="flex flex-col gap-1.5 py-2 border-t border-gray-100 first:border-t-0"
              >
                <span class="text-[0.72rem] font-bold uppercase tracking-wider text-gray-700">
                  {{ tee.tee_name }}
                </span>
                <ul
                  class="list-none p-0 m-0 grid grid-cols-5 gap-1.5"
                  :aria-label="`Men's ${tee.tee_name} tee details`"
                >
                  <li
                    v-for="stat in [
                      { label: 'Holes', value: tee.number_of_holes },
                      { label: 'Par', value: tee.par_total },
                      { label: 'Rating', value: tee.course_rating },
                      { label: 'Slope', value: tee.slope_rating },
                      { label: 'Yards', value: tee.total_yards.toLocaleString() },
                    ]"
                    :key="stat.label"
                    class="flex flex-col items-center gap-0.5 bg-gray-50 rounded-md py-1.5 px-0.5"
                  >
                    <span class="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold">{{ stat.label }}</span>
                    <span class="text-[0.82rem] font-bold text-gray-900">{{ stat.value }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Women's tees -->
            <div
              v-if="course.tees.female?.length"
              class="border-t border-pink-100 pt-3"
            >
              <h4 class="text-[0.7rem] font-bold uppercase tracking-wider text-pink-800 m-0 mb-2">
                ♀ Women's Tees
              </h4>
              <div
                v-for="tee in course.tees.female"
                :key="tee.tee_name"
                class="flex flex-col gap-1.5 py-2 border-t border-gray-100 first:border-t-0"
              >
                <span class="text-[0.72rem] font-bold uppercase tracking-wider text-gray-700">
                  {{ tee.tee_name }}
                </span>
                <ul
                  class="list-none p-0 m-0 grid grid-cols-5 gap-1.5"
                  :aria-label="`Women's ${tee.tee_name} tee details`"
                >
                  <li
                    v-for="stat in [
                      { label: 'Holes', value: tee.number_of_holes },
                      { label: 'Par', value: tee.par_total },
                      { label: 'Rating', value: tee.course_rating },
                      { label: 'Slope', value: tee.slope_rating },
                      { label: 'Yards', value: tee.total_yards.toLocaleString() },
                    ]"
                    :key="stat.label"
                    class="flex flex-col items-center gap-0.5 bg-gray-50 rounded-md py-1.5 px-0.5"
                  >
                    <span class="text-[0.6rem] uppercase tracking-wider text-gray-400 font-semibold">{{ stat.label }}</span>
                    <span class="text-[0.82rem] font-bold text-gray-900">{{ stat.value }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>

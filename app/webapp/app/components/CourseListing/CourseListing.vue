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
  <section class="course-listing">
    <div class="course-listing__header">
      <h2 class="course-listing__title">
        Golf Courses
      </h2>
    </div>

    <!-- Search form: accepts a course name or numeric ID -->
    <form
      class="search-form"
      @submit.prevent="onSearch"
    >
      <div class="search-form__fields">
        <div class="search-form__field">
          <label
            for="course-search"
            class="search-form__label"
          >Search by name or ID</label>
          <input
            id="course-search"
            v-model="searchQuery"
            type="search"
            class="search-form__input"
            placeholder="e.g. St Andrews or 12795"
            :disabled="isLoading"
          >
        </div>
      </div>
      <button
        type="submit"
        class="search-form__button"
        :disabled="isLoading || searchQuery.trim() === ''"
      >
        {{ isLoading ? 'Searching…' : 'Search' }}
      </button>
    </form>

    <!-- Error state -->
    <p
      v-if="fetchError"
      class="course-listing__error"
      role="alert"
    >
      Something went wrong: {{ fetchError }}
    </p>

    <!-- Loading state -->
    <p
      v-else-if="isLoading"
      class="course-listing__status"
      aria-live="polite"
    >
      Loading courses…
    </p>

    <!-- Empty state: shown only after a search has been submitted -->
    <p
      v-else-if="hasSearched && !isLoading && courses.length === 0"
      class="course-listing__empty"
    >
      No courses found.
    </p>

    <!-- Results grid -->
    <ul
      v-else-if="courses.length"
      class="course-grid"
    >
      <li
        v-for="course in courses"
        :key="course.id"
        class="course-card"
        :class="{ 'course-card--expanded': isSelected(course.id) }"
      >
        <!-- Collapsed view: summary button -->
        <button
          v-if="!isSelected(course.id)"
          class="course-card__summary"
          :aria-expanded="false"
          @click="selectCourse(course.id)"
        >
          <div class="course-card__top">
            <h3 class="course-card__name">
              {{ course.course_name }}
            </h3>
            <span class="course-card__hint">View tees ▾</span>
          </div>
          <p class="course-card__club">
            {{ course.club_name }}
          </p>
          <p class="course-card__location">
            <span aria-hidden="true">📍</span>
            {{ [course.location.city, course.location.state, course.location.country].filter(Boolean).join(', ') }}
          </p>
        </button>

        <!-- Expanded view: full tee data -->
        <div
          v-else
          class="course-card__body"
        >
          <div class="course-card__expanded-header">
            <div>
              <div class="course-card__top">
                <h3 class="course-card__name">
                  {{ course.course_name }}
                </h3>
              </div>
              <p class="course-card__club">
                {{ course.club_name }}
              </p>
              <p class="course-card__location">
                <span aria-hidden="true">📍</span>
                {{ [course.location.city, course.location.state, course.location.country].filter(Boolean).join(', ') }}
              </p>
            </div>
            <!-- Close button collapses the card back to summary view -->
            <button
              class="course-card__close"
              :aria-label="`Close ${course.course_name}`"
              @click="selectCourse(course.id)"
            >
              ✕
            </button>
          </div>

          <!-- Men's and women's tees displayed side by side -->
          <div class="tees-grid">
            <!-- Men's tees -->
            <div
              v-if="course.tees.male?.length"
              class="tees-section"
            >
              <h4 class="tees-section__title tees-section__title--male">
                ♂ Men's Tees
              </h4>
              <div
                v-for="tee in course.tees.male"
                :key="tee.tee_name"
                class="tee-row"
              >
                <span class="tee-row__name">{{ tee.tee_name }}</span>
                <ul
                  class="stats"
                  :aria-label="`Men's ${tee.tee_name} tee details`"
                >
                  <li class="stat">
                    <span class="stat__label">Holes</span>
                    <span class="stat__value">{{ tee.number_of_holes }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Par</span>
                    <span class="stat__value">{{ tee.par_total }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Rating</span>
                    <span class="stat__value">{{ tee.course_rating }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Slope</span>
                    <span class="stat__value">{{ tee.slope_rating }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Yards</span>
                    <span class="stat__value">{{ tee.total_yards.toLocaleString() }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Women's tees -->
            <div
              v-if="course.tees.female?.length"
              class="tees-section tees-section--female"
            >
              <h4 class="tees-section__title tees-section__title--female">
                ♀ Women's Tees
              </h4>
              <div
                v-for="tee in course.tees.female"
                :key="tee.tee_name"
                class="tee-row"
              >
                <span class="tee-row__name">{{ tee.tee_name }}</span>
                <ul
                  class="stats"
                  :aria-label="`Women's ${tee.tee_name} tee details`"
                >
                  <li class="stat">
                    <span class="stat__label">Holes</span>
                    <span class="stat__value">{{ tee.number_of_holes }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Par</span>
                    <span class="stat__value">{{ tee.par_total }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Rating</span>
                    <span class="stat__value">{{ tee.course_rating }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Slope</span>
                    <span class="stat__value">{{ tee.slope_rating }}</span>
                  </li>
                  <li class="stat">
                    <span class="stat__label">Yards</span>
                    <span class="stat__value">{{ tee.total_yards.toLocaleString() }}</span>
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

<style scoped>
.course-listing {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: system-ui, sans-serif;
}

.course-listing__header {
  margin-bottom: 1.5rem;
}

.course-listing__title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a3c2e;
  margin: 0;
}

.course-listing__status,
.course-listing__empty {
  text-align: center;
  color: #6b7280;
  margin-top: 2rem;
}

.course-listing__error {
  text-align: center;
  color: #b91c1c;
  margin-top: 2rem;
}

/* Search */
.search-form {
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-form__fields {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  flex-wrap: wrap;
}

.search-form__field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 160px;
}

.search-form__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
}

.search-form__input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: #111827;
  outline-offset: 2px;
}

.search-form__input:focus {
  outline: 2px solid #16a34a;
}

.search-form__button {
  padding: 0.5rem 1.25rem;
  background-color: #16a34a;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-form__button:hover:not(:disabled) {
  background-color: #15803d;
}

.search-form__button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Grid — 3 columns desktop, 2 tablet, 1 mobile */
.course-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .course-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .course-grid {
    grid-template-columns: 1fr;
  }
}

/* Card */
.course-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

/* Lift effect on hover — only for collapsed cards */
.course-card:not(.course-card--expanded):hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Expanded card spans the full grid row */
.course-card--expanded {
  grid-column: 1 / -1;
  border-color: #16a34a;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.15);
}

/* Collapsed summary button fills the card */
.course-card__summary {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 1.25rem;
  text-align: left;
  cursor: pointer;
}

.course-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.course-card__name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a3c2e;
  margin: 0;
  line-height: 1.3;
}

.course-card__hint {
  font-size: 0.7rem;
  color: #9ca3af;
  white-space: nowrap;
  padding-top: 0.2rem;
}

.course-card__club {
  font-size: 0.85rem;
  font-weight: 500;
  color: #16a34a;
  margin: 0 0 0.2rem;
}

.course-card__location {
  font-size: 0.8rem;
  color: #6b7280;
  margin: 0;
}

/* Expanded body */
.course-card__body {
  padding: 1.25rem;
}

.course-card__expanded-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.course-card__close {
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.4rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease;
}

.course-card__close:hover {
  background-color: #f3f4f6;
}

/* Tees grid — men and women side by side, stacks on mobile */
.tees-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 2rem;
}

@media (max-width: 640px) {
  .tees-grid {
    grid-template-columns: 1fr;
  }
}

/* Tees section */
.tees-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 0.75rem;
}

.tees-section--female {
  border-top-color: #fce7f3;
}

.tees-section__title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 0.5rem;
}

.tees-section__title--male {
  color: #1d4ed8;
}

.tees-section__title--female {
  color: #9d174d;
}

/* Tee rows — one row per tee set */
.tee-row {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem 0;
  border-top: 1px solid #f3f4f6;
}

.tee-row:first-of-type {
  border-top: none;
}

.tee-row__name {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #374151;
}

/* Stats pill grid */
.stats {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.4rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  background-color: #f9fafb;
  border-radius: 0.4rem;
  padding: 0.3rem 0.2rem;
}

.stat__label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  font-weight: 600;
}

.stat__value {
  font-size: 0.82rem;
  font-weight: 700;
  color: #111827;
}
</style>

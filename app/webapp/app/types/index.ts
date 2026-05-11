/**
 * Represents a single hole on a golf course.
 */
export interface GolfCourseHole {
  par: number
  yardage: number
  handicap?: number
}

/**
 * Represents a set of tees for a specific gender and tee colour.
 */
export interface GolfCourseTee {
  tee_name: string
  course_rating: number
  slope_rating: number
  bogey_rating: number
  total_yards: number
  total_meters: number
  number_of_holes: number
  par_total: number
  front_course_rating: number
  front_slope_rating: number
  front_bogey_rating: number
  back_course_rating: number
  back_slope_rating: number
  back_bogey_rating: number
  holes: GolfCourseHole[]
}

/**
 * Groups tee sets by gender.
 */
export interface GolfCourseTees {
  female: GolfCourseTee[]
  male: GolfCourseTee[]
}

/**
 * Physical location details for a golf course.
 */
export interface GolfCourseLocation {
  address: string
  city: string
  state: string
  country: string
  latitude: number
  longitude: number
}

/**
 * Full golf course record as returned by the Golf Course API.
 */
export interface GolfCourse {
  id: number
  club_name: string
  course_name: string
  location: GolfCourseLocation
  tees: GolfCourseTees
}

/**
 * Response shape from GET /v1/courses/:id
 */
export interface GolfCourseIdResponse {
  course: GolfCourse
}

/**
 * Response shape from GET /v1/search
 */
export interface GolfCourseSearchResponse {
  courses: GolfCourse[]
}

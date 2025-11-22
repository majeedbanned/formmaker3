/**
 * Teacher Activity Scoring Weights
 * 
 * This file defines the point values for different teacher activities used in
 * teacher statistics, ranking, and pulse calculations.
 * 
 * IMPORTANT: To modify the scoring system, update the values below.
 * 
 * NOTE: MongoDB aggregations cannot use JavaScript constants directly, so
 * aggregation pipelines must use hardcoded values. Make sure to update both:
 * 1. The values in this config file
 * 2. The hardcoded values in MongoDB aggregation pipelines in:
 *    - teacher-pulse/route.ts (3 aggregation pipelines)
 * 
 * The aggregation values should match the weights defined here:
 * - PRESENCE_RECORDS: 0.5
 * - GRADES: 1.0
 * - ASSESSMENTS: 2.0
 * - COMMENTS: 2.0
 * - EVENTS: 4.0
 */
export const TEACHER_ACTIVITY_WEIGHTS = {
  /** Presence records: 0.5 points per record */
  PRESENCE_RECORDS: 0.5,
  
  /** Grades: 1 point per grade entry */
  GRADES: 1.0,
  
  /** Assessments: 2 points per assessment */
  ASSESSMENTS: 2.0,
  
  /** Comments/Notes: 2 points per comment */
  COMMENTS: 2.0,
  
  /** Events: 4 points per event */
  EVENTS: 4.0,
} as const;

/**
 * Get weights as plain object for MongoDB aggregation reference
 * Use this to verify aggregation values match the config
 */
export function getWeightsForReference() {
  return {
    PRESENCE_RECORDS: TEACHER_ACTIVITY_WEIGHTS.PRESENCE_RECORDS,
    GRADES: TEACHER_ACTIVITY_WEIGHTS.GRADES,
    ASSESSMENTS: TEACHER_ACTIVITY_WEIGHTS.ASSESSMENTS,
    COMMENTS: TEACHER_ACTIVITY_WEIGHTS.COMMENTS,
    EVENTS: TEACHER_ACTIVITY_WEIGHTS.EVENTS,
  };
}

/**
 * Get a formatted description of the scoring system (for display purposes)
 */
export function getScoringSystemDescription(): string {
  return `حضور ${TEACHER_ACTIVITY_WEIGHTS.PRESENCE_RECORDS} | نمرات ${TEACHER_ACTIVITY_WEIGHTS.GRADES} | ارزیابی ${TEACHER_ACTIVITY_WEIGHTS.ASSESSMENTS} | یادداشت ${TEACHER_ACTIVITY_WEIGHTS.COMMENTS} | رویداد ${TEACHER_ACTIVITY_WEIGHTS.EVENTS}`;
}

/**
 * Calculate weighted score from activity counts
 */
export function calculateWeightedScore(params: {
  presenceRecords: number;
  grades: number;
  assessments: number;
  comments: number;
  events: number;
}): number {
  return (
    params.presenceRecords * TEACHER_ACTIVITY_WEIGHTS.PRESENCE_RECORDS +
    params.grades * TEACHER_ACTIVITY_WEIGHTS.GRADES +
    params.assessments * TEACHER_ACTIVITY_WEIGHTS.ASSESSMENTS +
    params.comments * TEACHER_ACTIVITY_WEIGHTS.COMMENTS +
    params.events * TEACHER_ACTIVITY_WEIGHTS.EVENTS
  );
}


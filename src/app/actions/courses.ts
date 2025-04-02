'use server';

import { addPredefinedCourses } from "@/utils/courseHelpers";
import { logger } from "@/lib/logger";

export async function addPredefinedCoursesAction(schoolCode: string, maghta: string, domain: string = "localhost:3000") {
  try {
    logger.info(`Adding predefined courses for school: ${schoolCode}, maghta: ${maghta}, domain: ${domain}`);
    await addPredefinedCourses(schoolCode, maghta, domain);
    logger.info(`Successfully added predefined courses for school: ${schoolCode} in domain: ${domain}`);
    return { success: true };
  } catch (error) {
    logger.error(`Error adding predefined courses for school: ${schoolCode} in domain: ${domain}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
} 
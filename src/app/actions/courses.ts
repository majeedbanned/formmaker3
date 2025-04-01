'use server';

import { addPredefinedCourses } from "@/utils/courseHelpers";

export async function addPredefinedCoursesAction(schoolCode: string, maghta: string, domain: string = "localhost:3000") {
  try {
    await addPredefinedCourses(schoolCode, maghta, domain);
    return { success: true };
  } catch (error) {
    console.error('Error in server action:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
} 
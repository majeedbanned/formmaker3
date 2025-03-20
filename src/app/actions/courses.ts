'use server';

import { addPredefinedCourses } from "@/utils/courseHelpers";

export async function addPredefinedCoursesAction(schoolCode: string, maghta: string) {
  try {
    await addPredefinedCourses(schoolCode, maghta);
    return { success: true };
  } catch (error) {
    console.error('Error in server action:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
} 
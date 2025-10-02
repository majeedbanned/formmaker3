import { connectToDatabase } from "@/lib/mongodb";

export interface PreferencesData {
  allowStudentsToChangeProfile: boolean;
}

/**
 * Get preferences for a school
 */
export async function getSchoolPreferences(schoolCode: string, domain: string): Promise<PreferencesData> {
  try {
    const connection = await connectToDatabase(domain);
    
    const preferences = await connection.collection("preferences").findOne({
      schoolCode: schoolCode,
    });

    if (!preferences) {
      // Return default preferences if none found
      return {
        allowStudentsToChangeProfile: false,
      };
    }

    return {
      allowStudentsToChangeProfile: Boolean(preferences.allowStudentsToChangeProfile),
    };
  } catch (error) {
    console.error("Error fetching preferences:", error);
    // Return default preferences on error
    return {
      allowStudentsToChangeProfile: false,
    };
  }
}

/**
 * Check if students are allowed to change their profile for a specific school
 */
export async function canStudentsChangeProfile(schoolCode: string, domain: string): Promise<boolean> {
  try {
    const preferences = await getSchoolPreferences(schoolCode, domain);
    return preferences.allowStudentsToChangeProfile;
  } catch (error) {
    console.error("Error checking student profile permissions:", error);
    return false; // Default to false on error
  }
}


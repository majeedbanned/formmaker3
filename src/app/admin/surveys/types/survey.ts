export interface SurveyOption {
  caption: string;
  image?: string; // Optional image URL
  description?: string; // Optional description
}

export interface SurveyQuestion {
  id?: string;
  text: string;
  type: "text" | "radio" | "checkbox" | "rating";
  required?: boolean;
  options?: (string | SurveyOption)[]; // For radio and checkbox questions - support both old (string) and new (object) format
  maxRating?: number; // For rating questions (default 5)
}

export interface Survey {
  _id?: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  classTargets: string[]; // array of class codes
  teacherTargets: string[]; // array of teacher codes
  status: "draft" | "active" | "closed";
  startDate?: Date | null;
  endDate?: Date | null;
  allowAnonymous: boolean;
  showResults: boolean;
  schoolCode: string;
  creatorId: string;
  creatorType: string;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
  responseCount: number;
  // Participation status fields (only for students/teachers)
  hasParticipated?: boolean;
  isWithinDateRange?: boolean;
  canParticipate?: boolean;
}

export interface SurveyResponse {
  _id?: string;
  surveyId: string;
  responderId?: string;
  responderType: string;
  responderName: string;
  responses: {
    questionId: string | number;
    questionText: string;
    questionType: string;
    answer: unknown;
  }[];
  schoolCode: string;
  createdAt: Date | string;
}

export interface SurveyTarget {
  id: string;
  name: string;
  type: "class" | "teacher";
}

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isActive: boolean;
} 
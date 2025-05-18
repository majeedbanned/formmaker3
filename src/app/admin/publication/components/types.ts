export interface Student {
  studentCode: string;
  studentName: string;
  studentFamily: string;
  classCode?: string;
  className?: string;
}

export interface ClassInfo {
  classCode: string;
  className: string;
  students: Student[];
}

export interface Teacher {
  teacherCode: string;
  teacherName: string;
  teacherFamily: string;
}

export interface PDFOptions {
  showHeader: boolean;
  showFooter: boolean;
  showWatermark: boolean;
  showStudentInfo: boolean;
  showTitle: boolean;
  headerColor: string;
  footerText: string;
  columnsPerPage: number;
  templatesPerPage: number;
  paperSize: "A4" | "A5" | "Letter";
  orientation: "portrait" | "landscape";
  font: string;
  margin: number;
  outputFormat: "html" | "pdf";
}

export interface TemplateData {
  id: string;
  title: string;
  content: string;
  description?: string;
  createdAt: string;
  creatorId: string;
  creatorType?: string;
  originalTitle?: string;
  schoolCode?: string;
  printOptions?: PDFOptions;
}

export interface PublicationHistoryItem {
  id: string;
  title: string;
  studentCount: number;
  classCount: number;
  creatorId: string;
  creatorType: string;
  schoolCode: string;
  createdAt: string;
} 
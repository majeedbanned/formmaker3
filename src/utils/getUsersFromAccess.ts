import { ObjectId } from 'mongodb';
import { connectToDatabase } from '@/lib/mongodb';

interface AccessRecipient {
  label: string;
  value: string;
}

interface AccessObject {
  recipients: {
    students?: AccessRecipient[];
    groups?: AccessRecipient[];
    classCode?: AccessRecipient[];
    teachers?: AccessRecipient[];
  };
}

interface User {
  id: string;
  username: string;
  name: string;
  className?: string;
  role: 'student' | 'teacher';
}

interface StudentDocument {
  _id: string | ObjectId;
  data: {
    studentCode: string;
    studentName?: string;
    studentFamily?: string;
    classCode?: AccessRecipient[];
    groups?: AccessRecipient[];
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface TeacherDocument {
  _id: string | ObjectId;
  data: {
    teacherCode: string;
    teacherName?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// MongoDB query type
type MongoQuery = Record<string, unknown>;

/**
 * Retrieves a distinct list of users based on the access object
 * @param domain The domain for MongoDB connection
 * @param accessObject The access object containing recipients
 * @returns A Promise resolving to an array of User objects
 */
export async function getUsersFromAccess(domain: string, accessObject: AccessObject): Promise<User[]> {
  // Initialize result array
  const users: User[] = [];
  const processedIds = new Set<string>();

  try {
    const { recipients } = accessObject;
    
    // Process students
    if (recipients.students && recipients.students.length > 0) {
      
      const studentCodes = recipients.students.map(student => student.value);
    
      const studentsData = await fetchStudents(domain, { "data.studentCode": { $in: studentCodes } });
      studentsData.forEach((student: StudentDocument) => {
        const id = student._id.toString();
        if (!processedIds.has(id)) {
          users.push({
            id,
            username: student.data.studentCode,
            name: student.data.studentName && student.data.studentFamily 
              ? `${student.data.studentName} ${student.data.studentFamily}` 
              : student.data.studentName || student.data.studentCode,
            className: student.data.classCode && student.data.classCode.length > 0 
              ? student.data.classCode[0].label 
              : undefined,
            role: 'student'
          });
          processedIds.add(id);
        }
      });
    }

    // Process groups
    if (recipients.groups && recipients.groups.length > 0) {
      const groupIds = recipients.groups.map(group => group.value);
      
      const studentsInGroups = await fetchStudents(domain, { "data.groups.value": { $in: groupIds } });
      
      studentsInGroups.forEach((student: StudentDocument) => {
        const id = student._id.toString();
        if (!processedIds.has(id)) {
          users.push({
            id,
            username: student.data.studentCode,
            name: student.data.studentName && student.data.studentFamily 
              ? `${student.data.studentName} ${student.data.studentFamily}` 
              : student.data.studentName || student.data.studentCode,
            className: student.data.classCode && student.data.classCode.length > 0 
              ? student.data.classCode[0].label 
              : undefined,
            role: 'student'
          });
          processedIds.add(id);
        }
      });
    }

    // Process class codes
    if (recipients.classCode && recipients.classCode.length > 0) {
      const classCodes = recipients.classCode.map(cc => cc.value);
      
      const studentsInClasses = await fetchStudents(domain, { "data.classCode.value": { $in: classCodes } });
      
      studentsInClasses.forEach((student: StudentDocument) => {
        const id = student._id.toString();
        if (!processedIds.has(id)) {
          users.push({
            id,
            username: student.data.studentCode,
            name: student.data.studentName && student.data.studentFamily 
              ? `${student.data.studentName} ${student.data.studentFamily}` 
              : student.data.studentName || student.data.studentCode,
            className: student.data.classCode && student.data.classCode.length > 0 
              ? student.data.classCode[0].label 
              : undefined,
            role: 'student'
          });
          processedIds.add(id);
        }
      });
    }

    // Process teachers
    if (recipients.teachers && recipients.teachers.length > 0) {
      const teacherCodes = recipients.teachers.map(teacher => teacher.value);
      
      const teachersData = await fetchTeachers(domain, { "data.teacherCode": { $in: teacherCodes } });
      
      teachersData.forEach((teacher: TeacherDocument) => {
        const id = teacher._id.toString();
        if (!processedIds.has(id)) {
          users.push({
            id,
            username: teacher.data.teacherCode,
            name: teacher.data.teacherName || teacher.data.teacherCode,
            role: 'teacher'
          });
          processedIds.add(id);
        }
      });
    }

    return users;
  } catch (error) {
    console.error('Error retrieving users from access object:', error);
    throw error;
  }
}

/**
 * Fetches students from the database
 * @param domain The domain for MongoDB connection
 * @param query The MongoDB query
 * @returns A Promise resolving to student records
 */
async function fetchStudents(domain: string, query: MongoQuery): Promise<StudentDocument[]> {
  try {
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('students');
    // console.log("query33", query);
    return await collection.find(query).toArray() as StudentDocument[];
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
}

/**
 * Fetches teachers from the database
 * @param domain The domain for MongoDB connection
 * @param query The MongoDB query
 * @returns A Promise resolving to teacher records
 */
async function fetchTeachers(domain: string, query: MongoQuery): Promise<TeacherDocument[]> {
  try {
    const connection = await connectToDatabase(domain);
    const collection = connection.collection('teachers');
    
    return await collection.find(query).toArray() as TeacherDocument[];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
} 
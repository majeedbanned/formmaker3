import { getUsersFromAccess } from '@/utils/getUsersFromAccess';

/**
 * Example of using the getUsersFromAccess helper function
 */
async function exampleUsage() {
  // Example domain - this should be your actual MongoDB database name
  const domain = 'school-domain';

  // Example access object with recipients
  const accessObject = {
    recipients: {
      // Students referenced by studentCode
      students: [
        {
          label: "محمود - فکری",
          value: "2095845241"
        },
        {
          label: "ساشا - سبحانی",
          value: "357611"
        }
      ],
      // Student groups referenced by group value
      groups: [
        {
          label: "شورای دانش آموزی",
          value: "3"
        }
      ],
      // Class codes referenced by class value
      classCode: [
        {
          label: "دهم ۱",
          value: "34"
        }
      ],
      // Teachers referenced by teacherCode
      teachers: [
        {
          label: "محمد نیساری",
          value: "we"
        },
        {
          label: "حسن جعفری",
          value: "102"
        }
      ]
    }
  };

  try {
    // Get unique users from the access object
    const users = await getUsersFromAccess(domain, accessObject);
    
    // console.log(`Retrieved ${users.length} unique users:`);
    console.table(users);

    // Example of filtering only students
    const students = users.filter(user => user.role === 'student');
    // console.log(`Found ${students.length} students`);

    // Example of filtering only teachers
    const teachers = users.filter(user => user.role === 'teacher');
    // console.log(`Found ${teachers.length} teachers`);

    // Example of getting users by class
    const usersInClass = users.filter(user => user.className === 'دهم ۱');
    // console.log(`Found ${usersInClass.length} users in class دهم ۱`);

    return users;
  } catch (error) {
    console.error('Error in example usage:', error);
    return [];
  }
}

export default exampleUsage; 
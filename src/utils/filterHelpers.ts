import { encryptFilter } from './encryption';

export function generateFilterUrl(baseUrl: string, filter: Record<string, unknown>): string {

  const encryptedFilter = encryptFilter(filter);
  console.log('first',filter)

  const url = new URL(baseUrl);
  url.searchParams.set('filter', encryptedFilter);
  console.log(url.toString())

  return url.toString();
}

// Sample filter generators for common use cases
export const filterExamples = {
  // Filter by role
  adminUsers: () => generateFilterUrl(window.location.href, { role: "admin" }),
  activeUsers: () => generateFilterUrl(window.location.href, { isActive: true }),
  
  // Filter by multiple criteria
  activeAdmins: () => generateFilterUrl(window.location.href, { 
    role: "admin", 
    isActive: true 
  }),
  
  // Filter with nested fields
  usersInCity: (city: string) => generateFilterUrl(window.location.href, {
    "address.city": city
  }),
  
  // Filter with arrays
  usersWithSkills: (skills: string[]) => generateFilterUrl(window.location.href, {
    skills: { $in: skills }
  }),
  
  // Complex filter example
  advancedFilter: () => generateFilterUrl(window.location.href, {
    isActive: true,
    role: { $in: ["admin", "manager"] },
    "address.country": "USA",
    skills: { $all: ["react", "typescript"] },
    birthDate: { $gte: new Date("1990-01-01").toISOString() }
  })
}; 
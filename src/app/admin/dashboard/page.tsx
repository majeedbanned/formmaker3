"use client";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, isLoading, error, logout, isAuthenticated, hasPermission } =
    useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in</div>;
  }

  // Check permissions based on system name
  const canViewSchools = hasPermission("attendance", "view");
  const canEditSchools = hasPermission("attendance", "edit");
  const canDeleteSchools = hasPermission("attendance", "delete");
  const canCreateSchools = hasPermission("attendance", "list");

  // Check permissions for other systems based on user type
  const canManageTeachers = hasPermission("attendance", "groupDelete");
  const canManageStudents = hasPermission("attendance", "show");
  const canManageClasses = hasPermission("attendance", "search");
  console.log(user);
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
        <div className="space-y-2">
          <p>
            <span className="font-semibold">User Type:</span> {user.userType}
          </p>
          <p>
            <span className="font-semibold">School Code:</span>{" "}
            {user.schoolCode}
          </p>
          <p>
            <span className="font-semibold">Username:</span> {user.username}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {user.role}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Schools Access Level</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-lg border ${
              canViewSchools
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">View Schools</p>
            <p className="text-sm mt-1">
              {canViewSchools ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              canEditSchools
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Edit Schools</p>
            <p className="text-sm mt-1">
              {canEditSchools ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              canDeleteSchools
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Delete Schools</p>
            <p className="text-sm mt-1">
              {canDeleteSchools ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              canCreateSchools
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Create Schools</p>
            <p className="text-sm mt-1">
              {canCreateSchools ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Other Access Levels</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg border ${
              canManageTeachers
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Manage Teachers</p>
            <p className="text-sm mt-1">
              {canManageTeachers ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              canManageStudents
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Manage Students</p>
            <p className="text-sm mt-1">
              {canManageStudents ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg border ${
              canManageClasses
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <p className="font-semibold">Manage Classes</p>
            <p className="text-sm mt-1">
              {canManageClasses ? "✅ Allowed" : "❌ Not Allowed"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">All Permissions</h2>
        {user.permissions && user.permissions.length > 0 ? (
          <div className="space-y-4">
            {user.permissions.map((permission, index) => (
              <div key={index} className="border rounded p-4">
                <h3 className="font-semibold mb-2">
                  System: {permission.systems}
                </h3>
                <div className="pl-4">
                  <h4 className="font-medium mb-1">Access:</h4>
                  <ul className="list-disc pl-4">
                    {permission.access.map((access, idx) => (
                      <li key={idx}>{access}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No permissions assigned</p>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

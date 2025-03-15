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
  // Check permissions based on user type
  const canViewSchools = hasPermission(user.userType, "show");
  const canEditSchools = hasPermission(user.userType, "list");

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

          {canViewSchools && <div>Schools content...</div>}
          {canEditSchools && <div>Edit School</div>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Permissions</h2>
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

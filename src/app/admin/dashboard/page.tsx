"use client";
import { useAuth } from "@/hooks/useAuth";
export default function Dashboard() {
  const {
    user,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    logout,
    isAuthenticated,
  } = useAuth();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  // Check permissions based on user type
  const canViewSchools = hasPermission(user.userType, "view");
  const canEditSchools = hasPermission(user.userType, "edit");
  console.log("use", user);
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>User Type: {user.userType}</p>
      <p>School Code: {user.schoolCode}</p>
      <p>Permissions: {user?.permissions}</p>

      {/* Show content based on permissions */}
      {canViewSchools && <div>Schools content...</div>}

      {canEditSchools && <button>Edit School</button>}

      <button onClick={logout}>Logout</button>
    </div>
  );
}

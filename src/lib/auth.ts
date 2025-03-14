import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
);

// Mock user database - in a real app, this would be your database
export const users = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    role: "admin",
  },
];

export async function verifyAuth(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Invalid token");
  }
}

export async function authenticateUser(username: string, password: string) {
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    throw new Error("نام کاربری یا رمز عبور اشتباه است");
  }

  const token = await new SignJWT({
    userId: user.id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);

  return { token, user };
} 
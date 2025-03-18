# Form Maker 3

A comprehensive form management system built with Next.js, featuring dynamic CRUD operations, role-based access control, and a modern UI.

## Features

- 🔐 Role-based authentication (School, Teacher, Student)
- 📝 Dynamic form generation and management
- 🎨 Modern UI with RTL support
- 🔍 Advanced search and filtering
- 📱 Responsive design
- 🛡️ Permission-based access control

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- MongoDB
- React Hook Form
- Zod Validation

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `NEXT_PUBLIC_MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: Secret key for JWT token generation

## License

MIT

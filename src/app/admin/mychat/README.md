# FormMaker3 Chat UI

A real-time chat interface for the FormMaker3 application, built with React and Socket.IO.

## Features

- Real-time messaging with Socket.IO
- Display of existing chatrooms
- Message history
- User authentication integration
- Responsive design for mobile and desktop

## Structure

The chat UI is organized into the following components:

### Main Components

- `page.tsx` - Main page component with Suspense support
- `components/ChatLayout.tsx` - Main layout with chatroom list and chat window
- `components/ChatroomList.tsx` - List of available chatrooms with search
- `components/ChatWindow.tsx` - Chat message display and input
- `components/ChatLoadingState.tsx` - Loading indicator

### Utilities

- `lib/socket.ts` - Socket.IO connection management
- `services/api.ts` - API services for fetching data
- `types/index.ts` - TypeScript interfaces

## Usage

The chat UI is accessible at `/admin/mychat` and requires user authentication to function. Users can:

1. View all available chatrooms in the right column
2. Select a chatroom to join
3. View message history for the selected chatroom
4. Send and receive messages in real-time

## Backend Connection

This UI connects to the Node.js backend at `server/chat` using Socket.IO. Make sure the chat server is running before using the UI.

## Environment Variables

The chat UI uses the following environment variables:

- `NEXT_PUBLIC_CHAT_SERVER_URL` - URL of the chat server (default: http://localhost:3001)

## Dependencies

- socket.io-client
- axios
- React state management
- Tailwind CSS for styling

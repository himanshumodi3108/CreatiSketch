# CreatiSketch

A real-time collaborative drawing application built with Next.js, React, Redux, and Socket.io. Draw together with friends in shared rooms.

## Features

### Drawing Tools
- **Pencil Tool** - Freehand drawing with customizable colors and brush sizes
- **Eraser Tool** - Erase parts of your drawing
- **Shape Tools** - Draw rectangles, circles, and lines
- **Color Picker** - Choose from preset colors or use a custom color picker
- **Brush Size** - Adjustable brush size from 1-10 pixels

### Canvas Features
- **Undo/Redo** - Full history management for your drawings
- **Clear Canvas** - Clear the entire canvas (synced with other users in collaborative rooms)
- **Download** - Export your artwork
  - **Left-click Download Button**: Download as JPG with white background
  - **Right-click Canvas**: Download as PNG with white background
- **Drawing Persistence** - Canvas state is automatically saved to localStorage per room (not synced between users)
- **Touch Support** - Works on mobile devices with touch gestures

### Collaboration
- **Room System** - Create or join rooms for collaborative drawing
- **Real-time Synchronization** - See other users' drawings in real-time
- **User Count** - See how many users are in your room
- **User Names** - Customizable usernames (stored in localStorage)

### Connection & Status
- **Connection Status Indicator** - Visual indicator showing connection state (Connected/Connecting/Disconnected)
- **Automatic Reconnection** - Socket automatically reconnects if connection is lost
- **Error Handling** - Comprehensive error boundaries and error handling

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Environment Variables

- `NEXT_PUBLIC_SOCKET_URL` - Socket.io server URL for development
- `NEXT_PUBLIC_SOCKET_URL_PRODUCTION` - Socket.io server URL for production

## Project Structure

```
src/
├── components/
│   ├── Board/           # Main canvas drawing component
│   ├── Menu/            # Tool selection menu
│   ├── Toolbox/         # Color and brush size controls
│   ├── RoomManager/     # Room creation and management
│   ├── ConnectionStatus/# Connection status indicator
│   ├── UserName/        # User name display and editing
│   └── ErrorBoundary/   # Error handling component
├── pages/
│   ├── index.js         # Main page
│   └── _app.js          # App wrapper with Redux Provider
├── slice/
│   ├── menuSlice.js     # Menu state management
│   └── toolboxSlice.js  # Tool settings state management
├── socket.js            # Socket.io client configuration
├── store.js             # Redux store configuration
├── constants.js         # Application constants
└── timestamp.js         # Timestamp utility for file naming
```

## Technologies Used

- **Next.js 14** - React framework
- **React 18** - UI library
- **Redux Toolkit** - State management
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Styling
- **FontAwesome** - Icons

## Usage

### Drawing
1. Select a tool from the menu (Pencil, Eraser, or Shapes)
2. Choose a color from the color palette or use the color picker
3. Adjust brush size using the slider
4. Start drawing on the canvas

### Collaboration
1. Click on the room name in the top-left to open room manager
2. Create a new room or join an existing one
3. Draw together with other users in real-time

### Downloading
- **Left-click Download Button**: Save as JPG with white background
- **Right-click Canvas**: Save as PNG with white background

## License

ISC

# GEMINI.md

## Project Overview

This is a goal-tracking application named "Ascend AI Goal Tracker". It's a single-page web application built with React, TypeScript, and Vite. The application allows users to create, track, and manage their goals in a hierarchical structure. It leverages the Gemini API to provide AI-powered features like suggesting sub-goals and generating motivational messages. The application uses `localStorage` for data persistence.

The main technologies used are:
- **Frontend:** React, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (inferred from `App.tsx` class names)
- **AI:** Google Gemini API (`@google/genai`)
- **UI Components:** `lucide-react` for icons, `framer-motion` for animations

The application is structured into several components:
- `App.tsx`: The main component that manages the application state and renders the UI.
- `components/`: Contains reusable React components like `GoalItem`, `CommandBar`, and `StatsViz`.
- `services/`: Contains modules for interacting with `localStorage` (`goalService.ts`) and the Gemini API (`geminiService.ts`).

## Building and Running

To build and run the project, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set up Environment Variables:**
    Create a `.env.local` file in the root of the project and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key
    ```

3.  **Run in Development Mode:**
    ```bash
    npm run dev
    ```
    This will start the development server, typically at `http://localhost:3111`.

4.  **Build for Production:**
    ```bash
    npm run build
    ```
    This will create a `dist` directory with the production-ready files.

5.  **Preview the Production Build:**
    ```bash
    npm run preview
    ```

## Development Conventions

- **State Management:** The application uses React's built-in state management (`useState`, `useEffect`, `useMemo`, `useCallback`).
- **Data Persistence:** Goals and progress history are stored in the browser's `localStorage`.
- **Styling:** The project uses Tailwind CSS for styling, as inferred from the class names in `App.tsx`.
- **AI Integration:** The Gemini API is used for suggesting sub-goals and providing motivational messages. The `gemini-2.5-flash` model is used.
- **Code Structure:** The code is organized into components and services, promoting modularity and separation of concerns.
- **Typing:** The project uses TypeScript for static typing. The `types.ts` file likely contains the core data structures for the application.

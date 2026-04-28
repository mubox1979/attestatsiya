# Attestatsiya Test Platformasi - Frontend

This is the refactored React frontend for the Attestatsiya Test Platform.

## Technology Stack
- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** CSS (Global styles from the original project)
- **Language:** JavaScript (JSX)

## Project Structure
- `src/api.js`: Centralized API communication helper.
- `src/App.jsx`: Main entry point, manages authentication state and top-level routing.
- `src/components/`: Modular React components.
  - `Auth.jsx`: Login and Registration forms.
  - `Dashboard.jsx`: User portal with test listing, history, and top-up.
  - `AdminPanel.jsx`: Management interface for admins.
  - `EditorPanel.jsx`: Question management for editors.
  - `TestInterface.jsx`: The test-taking environment.
  - `Calculator.jsx`: In-test calculator tool.
  - `Modal.jsx`: Reusable modal component.

## Development

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Production Build

To generate a production build:
```bash
npm run build
```
The output will be in the `dist/` directory.

## Integration with Backend
The frontend is configured to communicate with the backend at `https://attestatsiya-269h.onrender.com`. You can change this in `src/api.js`.

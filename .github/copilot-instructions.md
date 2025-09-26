# Copilot Instructions for Discogs-to-Spotify

## Project Overview
- **Discogs-to-Spotify** is a two-part app:
  - **Frontend**: React (in `src/`), bootstrapped with Create React App, for uploading CSVs and interacting with Spotify.
  - **Backend**: Express (in `backend/`), handles Spotify OAuth, token management, and API endpoints for playlist creation.

## Architecture & Data Flow
- Users log in via Spotify (`/login` endpoint in backend), which redirects to Spotify's OAuth and then back to the frontend with tokens.
- Frontend uploads CSV files to the backend (`/upload` endpoint, not shown in code but implied by React code).
- Backend processes CSV, interacts with Spotify API to create playlists.
- Tokens are managed via `/callback` and `/refresh_token` endpoints in backend.
- Environment variables for Spotify credentials are required in `backend/.env`.

## Developer Workflows
- **Frontend**:
  - Start: `npm start` (from root)
  - Build: `npm run build`
  - Test: `npm test`
- **Backend**:
  - Start: `node backend/server.js` (or use Railway/Vercel for deployment)
  - Requires `.env` with `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `REDIRECT_URI`, and optionally `PORT`.

## Conventions & Patterns
- API base URL for frontend is hardcoded as `https://lucky-communication-production.up.railway.app` (update if backend URL changes).
- React state is used for file upload and messaging.
- Backend uses Express, Axios, CORS, dotenv, and querystring.
- All Spotify API calls are proxied through backend for security.
- Frontend expects backend to handle playlist creation and return status messages.

## Integration Points
- **Spotify API**: OAuth, playlist creation, token refresh.
- **CSV Parsing**: Frontend uses `papaparse` (see `package.json`), backend expected to parse uploaded CSVs.
- **Deployment**: Backend is designed for Railway/Vercel; frontend for Vercel/static hosting.

## Key Files & Directories
- `src/App.js`: Main React logic for login, file upload, and messaging.
- `backend/server.js`: Express server, Spotify OAuth, token management.
- `backend/.env`: Required for local backend development.
- `README.md`: Standard Create React App instructions.

## Example Patterns
- **OAuth Redirect**: See `/login` and `/callback` in `backend/server.js`.
- **File Upload**: See file input and upload logic in `src/App.js`.
- **API Communication**: Frontend uses Axios to POST to backend endpoints.

## Special Notes
- If adding new endpoints, update both frontend API base and backend routes.
- Always keep sensitive credentials in `.env`, never in code.
- For debugging, check Railway logs for backend errors.

---

_If any section is unclear or missing, please request clarification or provide additional context from new files._

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kiwi Fairways is a Next.js application (using Pages Router) that provides a searchable directory of New Zealand golf courses. Users can browse courses, filter by region/holes, search by location with distance calculations, and view detailed information including green fees, membership costs, and course statistics.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 15.3.3 (Pages Router)
- **React**: 19.0.0
- **UI Libraries**:
  - Mantine 8.2.4 (core components and data tables)
  - Custom CSS for styling
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth provider
- **Geocoding**: OpenStreetMap Nominatim API

## Architecture

### Data Model

The application uses three main Supabase tables:
- `course_info`: Core course data (id, name, region, website)
- `course_layouts`: Course physical details (holes, par, rating, slope, length)
- `course_stats`: Financial data (num_members, full_membership, unaffiliated_gf, affiliated_gf, date)

**Important**: There is a Supabase RPC function `courses_with_distance` that calculates distances from a user's location to all courses. This is called from src/pages/index.js:25 when `userLocation` is available.

### Authentication Flow

Authentication is managed via Supabase Auth with a React Context wrapper (`src/components/auth/AuthProvider.jsx`):
- **Secure OAuth Flow**: Users authenticate via Google OAuth, tokens are verified server-side by Supabase
- **Session Management**: Supabase manages sessions with secure httpOnly cookies (no localStorage)
- **User Object Structure**: Supabase provides user object with `id`, `email`, `user_metadata` (includes `full_name`, `avatar_url`)
- **AuthContext provides**: `user`, `login()` (async), `logout()` (async), `loading`, `isAuthenticated`

Access the auth context in any component with `useAuth()` hook. The login page (`src/pages/login.js`) initiates the OAuth flow by calling `login()`, which redirects to Google then back to the app.

**Important**: Google OAuth credentials are configured in Supabase dashboard, not in environment variables.

### Page Structure

- `src/pages/index.js`: Main page - displays filterable course table
- `src/pages/login.js`: Google OAuth login page
- `src/pages/_app.js`: App wrapper with MantineProvider and AuthProvider
- `src/pages/_document.js`: HTML document structure

### Key Components

- **CourseTable** (`src/components/CourseTable.jsx`): Data table with fixed column widths. On small screens the table scrolls horizontally. Handles sorting and distance display.
- **Filters** (`src/components/Filters.jsx`): Search, region, holes, and location filtering
- **LocationSearch** (`src/components/LocationSearch.jsx`): Geocoding integration for distance calculations
- **Header** (`src/components/Header.jsx`): Site branding and navigation

### API Routes

- `/api/geocode`: Proxies requests to OpenStreetMap Nominatim API for location search

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Note: Google OAuth credentials (Client ID and Secret) are configured in the Supabase dashboard under Authentication → Providers → Google, not in environment variables.

### Styling

- Global styles in `src/styles/styles.css`
- CourseTable module styles in `src/styles/coursetable.module.css`
- Mantine provides component styling
- Uses CSS custom properties for theming (e.g., `--table-header-hover`)

## Important Implementation Details

### Distance Calculation
When a user selects a location via LocationSearch:
1. Location state is set in `src/pages/index.js`
2. useEffect triggers a re-fetch calling `supabase.rpc('courses_with_distance', {...})`
3. RPC function returns courses with a `distance_km` field
4. CourseTable displays an additional "Distance" column and sorts by distance by default

### Course Stats Handling
- Courses may have multiple stats entries with different dates
- Latest stats are filtered client-side (index.js:52-58) when not using distance RPC
- The RPC function should handle this server-side when location is provided

### Disabled Features (Not Yet Launched)

Auth, login, scoring, and courses-played features are built but disabled for the current deployment. To re-enable:

**1. `src/components/Header.jsx`** — restore the following:
- Imports: `useAuth` from `./auth/AuthProvider`, `UserGreeting` from `./auth/UserGreeting`, `HamburgerMenu` from `./auth/HamburgerMenu`, `useRouter` from `next/router`
- Inside the component: `const { isAuthenticated } = useAuth()`, `const router = useRouter()`, and the `handleLogoClick` function (navigates to `/` if authenticated, `/login` if not)
- On the `<img>`: `onClick={handleLogoClick}` and `style={{ cursor: 'pointer' }}`
- Replace the two placeholder `<div />`s with `<UserGreeting />` (left slot) and `<HamburgerMenu />` (right slot)

**2. Pages that are built but unlinked:** `src/pages/login.js`, `src/pages/activity.js`, `src/pages/my-courses.js`

**3. Auth components** (no changes needed, already complete): `src/components/auth/AuthProvider.jsx`, `src/components/auth/UserGreeting.jsx`, `src/components/auth/HamburgerMenu.jsx`

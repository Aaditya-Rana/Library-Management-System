# Environment Variables

## Frontend Configuration

The frontend requires the following environment variable to be set:

### Required Variables

#### `NEXT_PUBLIC_API_URL`
- **Description**: The URL of the backend API server
- **Default**: `http://localhost:3000`
- **Example Values**:
  - Development: `http://localhost:3000`
  - Staging: `https://api-staging.yourdomain.com`
  - Production: `https://api.yourdomain.com`

## Setup Instructions

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update the values** in `.env.local` according to your environment

3. **Restart the development server** for changes to take effect:
   ```bash
   npm run dev
   ```

## Important Notes

- All frontend environment variables **must** be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- `.env.local` is gitignored and should not be committed
- For production deployment (Vercel, Netlify, etc.), set the environment variables in your hosting platform's dashboard

## Current Configuration

The API service (`src/services/api.ts`) is already configured to use this environment variable with a fallback to `http://localhost:3000`.

```typescript
baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
```

# Google Sign-In Setup Instructions

## Overview
Google Sign-In has been implemented using Google Identity Services. The code is ready, but you need to configure your Google OAuth Client ID.

## Steps to Enable Google Login

### 1. Get Google OAuth Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** (or Google Identity Services)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - `https://yourdomain.com` (for production)
7. Copy the **Client ID**

### 2. Add Client ID to Environment Variables

Create a `.env.local` file in the root of your project (if it doesn't exist):

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Important:** 
- The variable name must be `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the `NEXT_PUBLIC_` prefix makes it available in the browser)
- Never commit `.env.local` to git (it should be in `.gitignore`)

### 3. Restart Your Development Server

After adding the environment variable, restart your Next.js dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## How It Works

1. **Google Script**: The Google Identity Services script is loaded in `app/layout.tsx`
2. **Initialization**: Google Sign-In is initialized in `components/ui/auth-page.tsx` when the component mounts
3. **Button Rendering**: Google Sign-In buttons are automatically rendered in the sign-in and sign-up modals
4. **Callback**: When a user signs in with Google, the ID token is sent to `/api/auth/google-login`
5. **API Route**: The Next.js API route (`app/api/auth/google-login/route.ts`) proxies the request to `https://www.trendshub.link/google-login`
6. **Token Storage**: On success, the token is stored in both cookies and localStorage

## Current Implementation

- ✅ Google Identity Services script loaded
- ✅ Google Sign-In initialization
- ✅ Google button rendering in modals
- ✅ API route for `/api/auth/google-login`
- ✅ Token storage and user data management
- ⚠️ **Waiting for**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` environment variable

## Testing

Once you've added the Client ID:

1. Go to `/login` or `/signup`
2. Click the "Google" button
3. You should see the Google Sign-In popup
4. After signing in, you'll be redirected to the home page

## Troubleshooting

- **"Google Sign-In is not configured"**: Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local` and the server has been restarted
- **"Google Sign-In script failed to load"**: Check your internet connection and that the script URL is accessible
- **Button doesn't appear**: Check browser console for errors, ensure the modal is open, and wait a moment for the button to render

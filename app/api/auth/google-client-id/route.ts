import { NextResponse } from 'next/server';

/**
 * API route to serve Google Client ID from backend
 * This avoids CORS issues by serving the client ID from the same origin
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 
      '488062069123-dd7r1fu1a3tq1a5rm03mhv0kbij1f3bk.apps.googleusercontent.com';
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google Client ID not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({ clientId });
  } catch (error) {
    // console.error('Error getting Google Client ID:', error);
    return NextResponse.json(
      { error: 'Failed to get Google Client ID' },
      { status: 500 }
    );
  }
}

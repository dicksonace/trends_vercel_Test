import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.trendshub.link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Verification failed' },
        { status: response.status }
      );
    }

    // Set token in cookie if present
    const response_obj = NextResponse.json(data, { status: response.status });
    if (data.token) {
      response_obj.cookies.set('trendshub_token', data.token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
    }
    
    return response_obj;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

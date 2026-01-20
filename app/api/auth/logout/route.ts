import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE_URL = 'https://www.trendshub.link';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  cookies().get('trendshub_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    // Clear cookie
    const response_obj = NextResponse.json(data, { status: response.status });
    response_obj.cookies.delete('trendshub_token');

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Logout failed' },
        { status: response.status }
      );
    }

    return response_obj;
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

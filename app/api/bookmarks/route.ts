import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 DEBUG: Fetch bookmarks API route called');
    console.log('🔍 DEBUG: Token exists:', !!token);

    const response = await fetch('https://www.trendshub.link/api/v1/fetch-book-marks', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://172.23.0.1:3000',
        'Referer': 'http://172.23.0.1:3000/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    console.log('🔍 DEBUG: Backend response status:', response.status);
    console.log('🔍 DEBUG: Backend response ok:', response.ok);

    let data;
    let responseText;
    try {
      responseText = await response.text();
      console.log('🔍 DEBUG: Backend response text (first 200 chars):', responseText.substring(0, 200));
      
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('🔍 DEBUG: Backend returned HTML instead of JSON - likely auth error');
        return NextResponse.json({ 
          error: 'Backend returned HTML response - authentication may have failed' 
        }, { status: 401 });
      }
      
      data = JSON.parse(responseText);
      console.log('🔍 DEBUG: Backend response data:', data);
    } catch (jsonError) {
      console.error('🔍 DEBUG: JSON parse error:', jsonError);
      console.error('🔍 DEBUG: Response text:', responseText?.substring(0, 500) || 'No response text');
      return NextResponse.json({ 
        error: 'Invalid backend response - not valid JSON',
        details: responseText?.substring(0, 200) || 'No response text'
      }, { status: 500 });
    }
    
    if (!response.ok) {
      console.log('🔍 DEBUG: Backend request failed, returning error:', response.status, data);
      return NextResponse.json({ error: data.message || data.error || 'Failed to fetch bookmarks' }, { status: response.status });
    }

    console.log('🔍 DEBUG: Fetch bookmarks API route success, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 DEBUG: Unhandled error in fetch bookmarks API route:', error);
    console.error('🔍 DEBUG: Error type:', typeof error);
    console.error('🔍 DEBUG: Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('🔍 DEBUG: Error message:', error instanceof Error ? error.message : 'No message');
    console.error('🔍 DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

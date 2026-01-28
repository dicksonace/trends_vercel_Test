import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.trendshub.link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // console.log('=== CHECK USERNAME API ROUTE ===');
    // console.log('Request body received:', JSON.stringify(body, null, 2));

    let response;
    try {
      // console.log('Calling external API:', `${API_BASE_URL}/check-username`);
      // console.log('Request payload:', JSON.stringify(body, null, 2));
      
      response = await fetch(`${API_BASE_URL}/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        redirect: 'manual',
      });
      
      // console.log('External API response status:', response.status, response.statusText);
      // console.log('External API response headers:', Object.fromEntries(response.headers.entries()));
      // console.log('Response URL:', response.url);
      // console.log('Response redirected:', response.redirected);
      
      // Check for redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        // console.error('=== REDIRECT DETECTED ===');
        // console.error('Redirect status:', response.status);
        // console.error('Redirect location:', location);
        return NextResponse.json(
          { error: `API redirected to: ${location || 'unknown location'}` },
          { status: 500 }
        );
      }
    } catch (fetchError) {
      // console.error('=== FETCH ERROR ===');
      // console.error('Error type:', fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError);
      // console.error('Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      // console.error('Full error:', fetchError);
      return NextResponse.json(
        { 
          error: 'Failed to connect to authentication server',
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        },
        { status: 500 }
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        // console.log('Parsed JSON response:', JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        // console.error('=== NON-JSON RESPONSE ===');
        // console.error('Content-Type:', contentType);
        // console.error('Response Status:', response.status);
        // console.error('Response URL:', response.url);
        // console.error('Response redirected:', response.redirected);
        // console.error('Full response text:', text);
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          // console.error('API returned HTML page instead of JSON - endpoint may be incorrect or redirecting');
        }
        
        return NextResponse.json(
          { 
            error: 'API returned HTML instead of JSON. Endpoint may be incorrect.',
            details: `Status: ${response.status}, URL: ${response.url}`,
            responsePreview: text.substring(0, 500)
          },
          { status: 500 }
        );
      }
    } catch (parseError) {
      // console.error('=== PARSE ERROR ===');
      // console.error('Parse error:', parseError);
      // console.error('Response status:', response.status);
      return NextResponse.json(
        { 
          error: 'Failed to parse server response',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      // console.error('=== API ERROR RESPONSE ===');
      // console.error('Status:', response.status);
      // console.error('Error data:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: data.message || data.error || 'Check failed' },
        { status: response.status }
      );
    }

    // console.log('=== SUCCESS ===');
    // console.log('Returning data to client:', JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    // console.error('=== TOP LEVEL ERROR ===');
    // console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    // console.error('Error message:', error instanceof Error ? error.message : String(error));
    // console.error('Full error:', error);
    if (error instanceof Error) {
      // console.error('Stack trace:', error.stack);
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

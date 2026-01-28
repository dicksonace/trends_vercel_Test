import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://www.trendshub.link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // console.log('=== GOOGLE SIGNUP API ROUTE ===');
    // console.log('✅ Using /api/auth/google-signup route for Google Sign-Up');
    // console.log('Request body received:', JSON.stringify(body, null, 2));

    let response;
    try {
      // console.log('Calling external API:', `${API_BASE_URL}/google-signup`);
      // console.log('Request payload:', JSON.stringify(body, null, 2));
      
      // Get CSRF token from request headers if provided
      const csrfToken = request.headers.get('X-XSRF-TOKEN');
      const cookieHeader = request.headers.get('Cookie');
      
      // console.log('CSRF Token present:', !!csrfToken);
      // console.log('Cookie header present:', !!cookieHeader);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add CSRF token if provided
      if (csrfToken) {
        headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
        // console.log('Added X-XSRF-TOKEN header');
      }

      // Add cookies if provided
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
        // console.log('Added Cookie header');
      }
      
      // Keep id_token (snake_case) format as per user's original code
      // Ensure we're sending exactly what the backend expects
      const requestBody = body.id_token 
        ? { id_token: body.id_token }  // Keep snake_case as per original code
        : body.idToken
        ? { id_token: body.idToken }    // Convert camelCase to snake_case if needed
        : body;
      
      // Ensure id_token is a string, not an array (backend validation might be strict)
      if (requestBody.id_token && Array.isArray(requestBody.id_token)) {
        requestBody.id_token = requestBody.id_token[0];
      }
      if (requestBody.id_token) {
        requestBody.id_token = String(requestBody.id_token);
      }
      
      // console.log('Request headers:', Object.keys(headers));
      // console.log('Request body (original):', body);
      // console.log('Request body (sending to backend):', requestBody);
      // console.log('id_token type check:', typeof requestBody.id_token, 'is string:', typeof requestBody.id_token === 'string');
      
      response = await fetch(`${API_BASE_URL}/google-signup`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        redirect: 'manual',
        credentials: 'include',
      });
      
      // console.log('External API response status:', response.status, response.statusText);
      // console.log('External API response headers:', Object.fromEntries(response.headers.entries()));
      
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
        // console.error('Full response text:', text.substring(0, 500));
        
        return NextResponse.json(
          { 
            error: 'API returned HTML instead of JSON. Endpoint may be incorrect.',
            details: `Status: ${response.status}`,
            responsePreview: text.substring(0, 500)
          },
          { status: 500 }
        );
      }
    } catch (parseError) {
      // console.error('=== PARSE ERROR ===');
      // console.error('Parse error:', parseError);
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
      
      // For 422, include more details about what went wrong
      if (response.status === 422) {
        return NextResponse.json(
          { 
            error: data.message || data.error || 'Validation failed',
            details: data.details || data.errors || 'The request format was invalid',
            fullError: data
          },
          { status: response.status }
        );
      }
      
      return NextResponse.json(
        { error: data.message || data.error || 'Google signup failed' },
        { status: response.status }
      );
    }

    // console.log('=== SUCCESS ===');
    // console.log('Returning data to client:', JSON.stringify(data, null, 2));
    
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

    // Forward CSRF token from response if present
    const responseCsrfToken = response.headers.get('X-XSRF-TOKEN');
    if (responseCsrfToken) {
      response_obj.cookies.set('XSRF-TOKEN', responseCsrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
      });
    }
    
    return response_obj;
  } catch (error) {
    // console.error('=== TOP LEVEL ERROR ===');
    // console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    // console.error('Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

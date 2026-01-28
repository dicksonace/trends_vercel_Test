import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    console.log('🔍 DEBUG: React API route called');
    
    // Await the params to get the postId
    const resolvedParams = await params;
    console.log('🔍 DEBUG: Raw params:', resolvedParams);
    console.log('🔍 DEBUG: PostId from params:', resolvedParams.postId);
    console.log('🔍 DEBUG: PostId type:', typeof resolvedParams.postId);
    console.log('🔍 DEBUG: PostId length:', resolvedParams.postId.length);
    
    // Validate postId
    const postId = resolvedParams.postId;
    if (!postId || typeof postId !== 'string') {
      console.log('🔍 DEBUG: Invalid postId, returning 400');
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    console.log('🔍 DEBUG: Validated postId:', postId);
    
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    console.log('🔍 DEBUG: Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔍 DEBUG: Token exists:', !!token);
    console.log('🔍 DEBUG: Token length:', token?.length || 0);
    console.log('🔍 DEBUG: Token starts with:', token?.substring(0, 10) + '...');
    
    if (!token) {
      console.log('🔍 DEBUG: No token found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 DEBUG: Making request to backend:', `https://www.trendshub.link/api/v1/react-to-post/${postId}`);
    
    let backendResponse;
    try {
      backendResponse = await fetch(`https://www.trendshub.link/api/v1/react-to-post/${postId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Origin': 'http://172.23.0.1:3000',
          'Referer': 'http://172.23.0.1:3000/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          reactType: 'like'
        }),
      });
      console.log('🔍 DEBUG: Backend fetch completed');
    } catch (fetchError) {
      console.error('🔍 DEBUG: Fetch error:', fetchError);
      console.error('🔍 DEBUG: Fetch error type:', typeof fetchError);
      console.error('🔍 DEBUG: Fetch error message:', fetchError instanceof Error ? fetchError.message : 'No message');
      return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 500 });
    }

    console.log('🔍 DEBUG: Backend response status:', backendResponse.status);
    console.log('🔍 DEBUG: Backend response ok:', backendResponse.ok);
    console.log('🔍 DEBUG: Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    let data;
    let responseText;
    try {
      // First get the response as text to see what we actually received
      responseText = await backendResponse.text();
      console.log('🔍 DEBUG: Backend response text (first 200 chars):', responseText.substring(0, 200));
      
      // Check if it's HTML (error page) instead of JSON
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('🔍 DEBUG: Backend returned HTML instead of JSON - likely auth error');
        return NextResponse.json({ 
          error: 'Backend returned HTML response - authentication may have failed' 
        }, { status: 401 });
      }
      
      // Try to parse as JSON
      data = JSON.parse(responseText);
      console.log('🔍 DEBUG: Backend response data:', data);
      
      // Check if backend returned an error response with 200 status
      if (data.error || data.status === 'error') {
        console.error('🔍 DEBUG: Backend returned error response with 200 status:', data);
        return NextResponse.json({ 
          error: data.error || data.message || 'Backend processing error',
          details: data
        }, { status: 500 });
      }
    } catch (jsonError) {
      console.error('🔍 DEBUG: JSON parse error:', jsonError);
      console.error('🔍 DEBUG: Response text:', responseText?.substring(0, 500) || 'No response text');
      return NextResponse.json({ 
        error: 'Invalid backend response - not valid JSON',
        details: responseText?.substring(0, 200) || 'No response text'
      }, { status: 500 });
    }
    
    if (!backendResponse.ok) {
      console.log('🔍 DEBUG: Backend request failed, returning error:', backendResponse.status, data);
      
      // Handle different types of backend errors
      if (backendResponse.status === 500) {
        // Check if this is a known issue with specific posts
        const knownErrorPosts = ['20', '28', '479', '469']; // Posts that consistently fail
        if (knownErrorPosts.includes(postId)) {
          return NextResponse.json({ 
            error: 'This post cannot be liked at the moment',
            details: 'This post may have technical issues. Please try again later.',
            backend_status: backendResponse.status,
            post_issue: true
          }, { status: 502 }); // Bad Gateway
        }
        
        return NextResponse.json({ 
          error: 'Backend server error - please try again later',
          details: data.message || 'Internal server error',
          backend_status: backendResponse.status
        }, { status: 502 }); // Bad Gateway
      } else if (backendResponse.status === 429) {
        return NextResponse.json({ 
          error: 'Too many requests - please wait before trying again',
          details: data.message || 'Rate limit exceeded',
          backend_status: backendResponse.status
        }, { status: 429 });
      } else if (backendResponse.status === 404) {
        return NextResponse.json({ 
          error: 'Post not found',
          details: data.message || 'The post you are trying to react to does not exist',
          backend_status: backendResponse.status
        }, { status: 404 });
      } else if (backendResponse.status === 403) {
        return NextResponse.json({ 
          error: 'You cannot interact with this post',
          details: data.message || 'You do not have permission to react to this post',
          backend_status: backendResponse.status
        }, { status: 403 });
      } else {
        return NextResponse.json({ 
          error: data.message || data.error || 'Failed to react to post',
          details: data,
          backend_status: backendResponse.status
        }, { status: backendResponse.status });
      }
    }

    console.log('🔍 DEBUG: React API route success, returning data');
    return NextResponse.json(data);
  } catch (error) {
    console.error('🔍 DEBUG: Unhandled error in react API route:', error);
    console.error('🔍 DEBUG: Error type:', typeof error);
    console.error('🔍 DEBUG: Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('🔍 DEBUG: Error message:', error instanceof Error ? error.message : 'No message');
    console.error('🔍 DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    // Check if it's a specific type of error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🔍 DEBUG: This is a fetch error - network issue');
      return NextResponse.json({ 
        error: 'Network error - failed to connect to backend',
        details: error.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const resolvedParams = await params;
    const postId = resolvedParams.postId;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const body = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(`https://www.trendshub.link/api/v1/${postId}/post-comment`, {
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
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json({ error: data.message || 'Failed to add comment' }, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

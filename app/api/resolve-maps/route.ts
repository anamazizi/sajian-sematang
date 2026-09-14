import { NextRequest, NextResponse } from 'next/server';

/**
 * Resolve Google Maps shortlink (maps.app.goo.gl) to extract coordinates
 * This API route is necessary because shortlinks require HTTP resolution
 * and we need to follow redirects to get the final URL with coordinates.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Only allow Google Maps URLs for security
    if (!targetUrl.includes('google.com/maps') && !targetUrl.includes('maps.app.goo.gl')) {
      return NextResponse.json(
        { error: 'Only Google Maps URLs are allowed' },
        { status: 400 }
      );
    }

    // Fetch the URL with redirect following
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow', // Automatically follow redirects
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sajian Sematang Maps Resolver/1.0)',
      },
    });

    // Get the final URL after redirects
    const finalUrl = response.url;

    // Extract coordinates from the final URL using regex patterns
    const patterns = [
      /q=([-\d.]+),([-\d.]+)/,                 // ?q=lat,lng
      /@([-\d.]+),([-\d.]+)/,                  // @lat,lng
      /place\/([-\d.]+),([-\d.]+)/,            // /place/lat,lng
      /q=([-\d.]+)%2C([-\d.]+)/,               // ?q=lat%2Clng (encoded comma)
      /!3d([-\d.]+)!4d([-\d.]+)/,              // !3dlat!4dlng (Google Maps share format)
      /data=([-\d.]+)%2C([-\d.]+)/,            // data=lat%2Clng
    ];

    for (const pattern of patterns) {
      const match = finalUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return NextResponse.json({
            lat,
            lng,
            resolvedUrl: finalUrl,
            source: 'redirect',
          });
        }
      }
    }

    // If no coordinates found in final URL, try to extract from the response HTML (last resort)
    // This is more complex and may break, so we'll return an error for now
    return NextResponse.json(
      { error: 'Could not extract coordinates from the URL', finalUrl },
      { status: 422 }
    );

  } catch (error) {
    console.error('Error resolving maps URL:', error);
    return NextResponse.json(
      { error: 'Failed to resolve URL', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Also support GET for simple testing (with query parameter)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL query parameter is required' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const mockRequest = new NextRequest('http://localhost', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
  return POST(mockRequest);
}
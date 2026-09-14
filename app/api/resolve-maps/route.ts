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

    // Enhanced fetch with better redirect handling and user agent
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow', // Automatically follow redirects
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    // Get the final URL after redirects
    const finalUrl = response.url;
    console.log(`Resolved URL: ${targetUrl} -> ${finalUrl}`);

    // Extract coordinates from the final URL using comprehensive regex patterns
    const patterns = [
      // Standard patterns
      /q=([-\d.]+),([-\d.]+)/,                 // ?q=lat,lng
      /@([-\d.]+),([-\d.]+)/,                  // @lat,lng
      /place\/([-\d.]+),([-\d.]+)/,           // /place/lat,lng
      /q=([-\d.]+)%2C([-\d.]+)/,               // ?q=lat%2Clng (encoded comma)
      /!3d([-\d.]+)!4d([-\d.]+)/,              // !3dlat!4dlng (Google Maps share format)
      /data=([-\d.]+)%2C([-\d.]+)/,            // data=lat%2Clng
      
      // Additional patterns for Google Maps URLs
      /ll=([-\d.]+),([-\d.]+)/,                // ll=lat,lng
      /destination=([-\d.]+),([-\d.]+)/,       // destination=lat,lng
      /center=([-\d.]+),([-\d.]+)/,            // center=lat,lng
      /query=([-\d.]+)%2C([-\d.]+)/,           // query=lat%2Clng
      /saddr=([-\d.]+),([-\d.]+)/,             // saddr=lat,lng (start address)
      /daddr=([-\d.]+),([-\d.]+)/,             // daddr=lat,lng (destination address)
      
      // Pattern for coordinates in path
      /maps\/([-\d.]+),([-\d.]+)/,            // /maps/lat,lng
      /@([-\d.]+),([-\d.]+),\d+z/,            // @lat,lng,15z (with zoom)
      /\?([-\d.]+),([-\d.]+)$/,               // ?lat,lng at end of URL
    ];

    for (const pattern of patterns) {
      const match = finalUrl.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return NextResponse.json({
            success: true,
            lat,
            lng,
            resolvedUrl: finalUrl,
            source: 'redirect',
          });
        }
      }
    }

    // If no coordinates found in final URL, try to get response text and search for coordinates
    try {
      const text = await response.text();
      
      // Search for coordinates in the HTML content
      const htmlPatterns = [
        /"latitude":\s*([-\d.]+)/,
        /"longitude":\s*([-\d.]+)/,
        /data-lat=["']([-\d.]+)["']/,
        /data-lng=["']([-\d.]+)["']/,
        /lat["']?\s*[:=]\s*["']?([-\d.]+)/,
        /lng["']?\s*[:=]\s*["']?([-\d.]+)/,
        /lon["']?\s*[:=]\s*["']?([-\d.]+)/,
        /coordinates["']?\s*[:=]\s*\[([-\d.]+),\s*([-\d.]+)\]/,
      ];

      for (const pattern of htmlPatterns) {
        const match = text.match(pattern);
        if (match) {
          // For patterns that capture both lat and lng
          if (match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              return NextResponse.json({
                success: true,
                lat,
                lng,
                resolvedUrl: finalUrl,
                source: 'html-extraction',
              });
            }
          } 
          // For patterns that capture single coordinate (need to find both)
          else if (match[1]) {
            // Try to find the other coordinate nearby
            const latMatch = text.match(/"latitude":\s*([-\d.]+)/);
            const lngMatch = text.match(/"longitude":\s*([-\d.]+)/);
            
            if (latMatch && lngMatch) {
              const lat = parseFloat(latMatch[1]);
              const lng = parseFloat(lngMatch[1]);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                return NextResponse.json({
                  success: true,
                  lat,
                  lng,
                  resolvedUrl: finalUrl,
                  source: 'html-pair-extraction',
                });
              }
            }
          }
        }
      }
    } catch (htmlError) {
      console.warn('Failed to parse HTML for coordinates:', htmlError);
    }

    // If no coordinates found at all
    return NextResponse.json({
      success: false,
      error: 'Could not extract coordinates from the URL',
      finalUrl,
      suggestion: 'Please use a direct Google Maps URL with coordinates or use the GPS button',
    }, { status: 422 });

  } catch (error) {
    console.error('Error resolving maps URL:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to resolve URL',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
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
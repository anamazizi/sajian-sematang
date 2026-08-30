// Image Helpers - Google Drive URL conversion & fallback
// Date: 30 Ogos 2026

/**
 * Convert Google Drive share link to direct image URL
 * @param url - Google Drive URL (view/sharing link)
 * @returns Direct image URL or original URL
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url) return '';
  
  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view
  const viewPattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/;
  const viewMatch = url.match(viewPattern);
  
  if (viewMatch) {
    const fileId = viewMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // Pattern 2: https://drive.google.com/open?id={FILE_ID}
  const openPattern = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const openMatch = url.match(openPattern);
  
  if (openMatch) {
    const fileId = openMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  
  // Pattern 3: Already direct link format
  if (url.includes('lh3.googleusercontent.com/d/')) {
    return url;
  }
  
  // Return original URL if not Google Drive
  return url;
}

/**
 * Get fallback image URL
 */
export function getFallbackImageUrl(): string {
  return 'https://placehold.co/400x300/e2e8f0/64748b?text=No+Image';
}

/**
 * Handle image error - set fallback
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = getFallbackImageUrl();
  event.currentTarget.onerror = null; // Prevent infinite loop
}

import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

interface VideoEmbedProps {
  videoId: string;
  title: string;
  poster?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault';
}

// Extract video ID from various YouTube URL formats
function extractVideoId(input: string): string {
  // If it's already just an ID (no slashes or special chars), return as-is
  if (!/[/:?&]/.test(input)) {
    return input;
  }

  try {
    // Handle various YouTube URL formats
    const url = new URL(input);
    
    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes('youtube.com') && url.searchParams.has('v')) {
      return url.searchParams.get('v') || input;
    }
    
    // youtu.be/VIDEO_ID
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1).split('?')[0];
    }
    
    // youtube.com/shorts/VIDEO_ID or youtube.com/embed/VIDEO_ID
    if (url.pathname.includes('/shorts/') || url.pathname.includes('/embed/')) {
      const parts = url.pathname.split('/');
      const videoId = parts[parts.length - 1].split('?')[0];
      return videoId;
    }
  } catch (e) {
    console.error('Failed to parse video URL:', input, e);
  }
  
  // Fallback: return original input
  return input;
}

export function VideoEmbed({ 
  videoId, 
  title, 
  poster = 'hqdefault'
}: VideoEmbedProps) {
  const extractedId = extractVideoId(videoId);
  
  return (
    <div className="w-full">
      <LiteYouTubeEmbed 
        id={extractedId}
        title={title}
        poster={poster}
        noCookie={true}
      />
    </div>
  );
}

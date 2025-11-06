import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';

interface VideoEmbedProps {
  videoId: string;
  title: string;
  poster?: 'default' | 'hqdefault' | 'mqdefault' | 'sddefault' | 'maxresdefault';
}

export function VideoEmbed({ 
  videoId, 
  title, 
  poster = 'maxresdefault'
}: VideoEmbedProps) {
  return (
    <div className="w-full">
      <LiteYouTubeEmbed 
        id={videoId}
        title={title}
        poster={poster}
        noCookie={true}
      />
    </div>
  );
}

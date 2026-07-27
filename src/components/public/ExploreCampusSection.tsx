import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExploreVideo {
  id: string;
  title: string;
  youtube_url: string;
  is_active: boolean;
  order_index: number;
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : url;
}

export function ExploreCampusSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [videos, setVideos] = useState<ExploreVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const animationRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('explore_videos')
          .select('*')
          .eq('is_active', true)
          .order('order_index');
        if (!error && data) setVideos(data as ExploreVideo[]);
      } catch (err) {
        console.error('Failed to load explore videos:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const startAutoScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    let scrollPos = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    const step = () => {
      scrollPos += 0.8;
      if (scrollPos >= maxScroll) scrollPos = 0;
      container.scrollLeft = scrollPos;
      animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAutoScrolling && videos.length > 0) {
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
    return () => stopAutoScroll();
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll, videos.length]);

  const handlePlay = (videoId: string) => {
    setPlayingVideoId(videoId);
    setIsAutoScrolling(false);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handlePause = () => {
    setPlayingVideoId(null);
    resumeTimeoutRef.current = setTimeout(() => setIsAutoScrolling(true), 2000);
  };

  useEffect(() => {
    return () => { if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current); };
  }, []);

  if (isLoading || videos.length === 0) return null;

  const allVideos = [...videos, ...videos];

  return (
    <section className="py-12 md:py-20 bg-secondary/50">
      <div className="container-college mb-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Explore Campus
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take a virtual tour of our campus through videos
          </p>
        </motion.div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allVideos.map((video, index) => {
          const youtubeId = extractYouTubeId(video.youtube_url);
          const key = `${video.id}-${index}`;
          return (
            <div
              key={key}
              className="flex-shrink-0 w-[300px] md:w-[400px] rounded-2xl overflow-hidden shadow-lg bg-card border border-border"
            >
              <div className="relative aspect-video">
                {playingVideoId === key ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePlay(key)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                      aria-label={`Play ${video.title}`}
                    >
                      <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 text-accent-foreground ml-1" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-display font-semibold text-foreground">{video.title}</h3>
                {playingVideoId === key && (
                  <button
                    onClick={handlePause}
                    className="p-2 rounded-full bg-primary/10 text-primary"
                    aria-label="Stop video"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

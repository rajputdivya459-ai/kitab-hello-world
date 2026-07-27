
CREATE TABLE public.explore_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  youtube_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.explore_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view explore videos" ON public.explore_videos
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage explore videos" ON public.explore_videos
  FOR ALL USING (is_admin());

INSERT INTO public.explore_videos (title, youtube_url, order_index) VALUES
  ('Campus Tour', 'https://www.youtube.com/watch?v=-OHNqU0bflE', 1),
  ('Student Life', 'https://www.youtube.com/watch?v=xCbEs2u7brU', 2),
  ('Annual Day Celebration', 'https://www.youtube.com/watch?v=xCbEs2u7brU', 3),
  ('NSS Activities', 'https://www.youtube.com/watch?v=xCbEs2u7brU', 4);

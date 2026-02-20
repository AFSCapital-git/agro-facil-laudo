-- Create storage bucket for chat audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-audio', 'chat-audio', false);

-- Storage policies for chat-audio bucket
CREATE POLICY "Authenticated users can upload chat audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-audio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read chat audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-audio' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own chat audio"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add audio_url column to chat_mensagens
ALTER TABLE public.chat_mensagens ADD COLUMN audio_url text DEFAULT NULL;
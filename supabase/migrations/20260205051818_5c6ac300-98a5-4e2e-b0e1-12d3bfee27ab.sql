-- Add payment_screenshot_url column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for users to upload their own payment screenshots
CREATE POLICY "Users can upload payment screenshots"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND auth.uid() IS NOT NULL);

-- Create policy for anyone to view payment screenshots
CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-screenshots');

-- Create policy for users to update their own payment screenshots
CREATE POLICY "Users can update their payment screenshots"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'payment-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
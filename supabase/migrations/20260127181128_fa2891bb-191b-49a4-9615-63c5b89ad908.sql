-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Allow public read access to menu images
CREATE POLICY "Menu images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Allow authenticated users (admins) to upload menu images
CREATE POLICY "Admins can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users (admins) to update menu images
CREATE POLICY "Admins can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users (admins) to delete menu images
CREATE POLICY "Admins can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND auth.role() = 'authenticated'
);
-- Add employment_type and incentive_rate columns to delivery_partners
ALTER TABLE public.delivery_partners 
ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'full_time',
ADD COLUMN IF NOT EXISTS incentive_rate numeric DEFAULT 50;
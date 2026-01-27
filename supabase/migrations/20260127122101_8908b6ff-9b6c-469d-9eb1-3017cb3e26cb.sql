-- Add delivery_partner_id column to profiles table
ALTER TABLE public.profiles
ADD COLUMN delivery_partner_id UUID REFERENCES public.delivery_partners(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_profiles_delivery_partner_id ON public.profiles(delivery_partner_id);

-- Add RLS policy for delivery partners to update order_tracking for their assigned orders
CREATE POLICY "Partners can update tracking for their assigned orders"
ON public.order_tracking
FOR UPDATE
USING (
  delivery_partner_id IN (
    SELECT dp.id FROM delivery_partners dp
    INNER JOIN profiles p ON p.delivery_partner_id = dp.id
    WHERE p.user_id = auth.uid()
  )
);

-- Add RLS policy for delivery partners to view their assigned order tracking
CREATE POLICY "Partners can view tracking for their assigned orders"
ON public.order_tracking
FOR SELECT
USING (
  delivery_partner_id IN (
    SELECT dp.id FROM delivery_partners dp
    INNER JOIN profiles p ON p.delivery_partner_id = dp.id
    WHERE p.user_id = auth.uid()
  )
);

-- Add RLS policy for partners to view orders they're assigned to
CREATE POLICY "Partners can view orders assigned to them"
ON public.orders
FOR SELECT
USING (
  id IN (
    SELECT ot.order_id FROM order_tracking ot
    INNER JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
    INNER JOIN profiles p ON p.delivery_partner_id = dp.id
    WHERE p.user_id = auth.uid()
  )
);
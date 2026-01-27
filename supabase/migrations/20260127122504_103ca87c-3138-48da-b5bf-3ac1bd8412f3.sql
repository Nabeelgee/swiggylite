-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Partners can view orders assigned to them" ON public.orders;
DROP POLICY IF EXISTS "Users can view tracking for their orders" ON public.order_tracking;

-- Create a security definer function to check if user owns the order (avoids recursion)
CREATE OR REPLACE FUNCTION public.user_owns_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders
    WHERE id = _order_id
      AND user_id = auth.uid()
  )
$$;

-- Create a security definer function to get partner's delivery_partner_id
CREATE OR REPLACE FUNCTION public.get_user_delivery_partner_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT delivery_partner_id
  FROM public.profiles
  WHERE user_id = auth.uid()
$$;

-- Re-create the order_tracking policy using the security definer function
CREATE POLICY "Users can view tracking for their orders"
ON public.order_tracking
FOR SELECT
USING (public.user_owns_order(order_id));

-- Create simplified partner policy for orders using security definer function
CREATE POLICY "Partners can view orders assigned to them"
ON public.orders
FOR SELECT
USING (
  id IN (
    SELECT order_id FROM public.order_tracking
    WHERE delivery_partner_id = public.get_user_delivery_partner_id()
  )
);
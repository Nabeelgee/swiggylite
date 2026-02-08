-- Add RLS policy for admins to delete orders
CREATE POLICY "Admins can delete orders"
ON public.orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete order items
CREATE POLICY "Admins can delete order items"
ON public.order_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to delete order messages
CREATE POLICY "Admins can delete order messages"
ON public.order_messages
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
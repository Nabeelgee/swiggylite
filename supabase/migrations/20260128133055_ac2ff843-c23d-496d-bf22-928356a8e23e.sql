-- Create chat messages table
CREATE TABLE public.order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'partner')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX idx_order_messages_created_at ON public.order_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view messages for their own orders
CREATE POLICY "Customers can view their order messages"
ON public.order_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_messages.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Customers can send messages for their own orders
CREATE POLICY "Customers can send messages for their orders"
ON public.order_messages
FOR INSERT
WITH CHECK (
  sender_type = 'customer' 
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_messages.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Partners can view messages for orders assigned to them
CREATE POLICY "Partners can view assigned order messages"
ON public.order_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_tracking ot
    WHERE ot.order_id = order_messages.order_id
    AND ot.delivery_partner_id = get_user_delivery_partner_id()
  )
);

-- Partners can send messages for orders assigned to them
CREATE POLICY "Partners can send messages for assigned orders"
ON public.order_messages
FOR INSERT
WITH CHECK (
  sender_type = 'partner'
  AND EXISTS (
    SELECT 1 FROM public.order_tracking ot
    WHERE ot.order_id = order_messages.order_id
    AND ot.delivery_partner_id = get_user_delivery_partner_id()
  )
);

-- Allow marking messages as read
CREATE POLICY "Users can mark messages as read"
ON public.order_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_messages.order_id 
    AND orders.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.order_tracking ot
    WHERE ot.order_id = order_messages.order_id
    AND ot.delivery_partner_id = get_user_delivery_partner_id()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
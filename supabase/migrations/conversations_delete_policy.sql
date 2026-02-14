-- Allow participants to delete their conversations (réexécutable)
DROP POLICY IF EXISTS "Participants can delete conversations" ON public.conversations;
CREATE POLICY "Participants can delete conversations" ON public.conversations
  FOR DELETE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

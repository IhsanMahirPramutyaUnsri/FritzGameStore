-- FritzStore: Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if current user is seller
CREATE OR REPLACE FUNCTION is_seller()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'seller'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============ PROFILES ============
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_admin());

-- ============ VERIFICATION REQUESTS ============
CREATE POLICY "verification_insert_own" ON verification_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "verification_select_own" ON verification_requests
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "verification_update_admin" ON verification_requests
  FOR UPDATE USING (is_admin());

-- ============ LISTINGS ============
CREATE POLICY "listings_select_public" ON listings
  FOR SELECT USING (
    status IN ('available', 'sold') OR
    seller_id = auth.uid() OR
    is_admin()
  );

CREATE POLICY "listings_insert_seller" ON listings
  FOR INSERT WITH CHECK (
    seller_id = auth.uid() AND
    (is_seller() OR is_admin())
  );

CREATE POLICY "listings_update_own" ON listings
  FOR UPDATE USING (
    (seller_id = auth.uid() AND status IN ('pending_review', 'available')) OR
    is_admin()
  );

CREATE POLICY "listings_delete_own" ON listings
  FOR DELETE USING (
    (seller_id = auth.uid() AND status = 'pending_review') OR
    is_admin()
  );

-- ============ TRANSACTIONS ============
CREATE POLICY "transactions_select_involved" ON transactions
  FOR SELECT USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid() OR
    admin_id = auth.uid() OR
    is_admin()
  );

CREATE POLICY "transactions_insert_buyer" ON transactions
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "transactions_update_involved" ON transactions
  FOR UPDATE USING (
    buyer_id = auth.uid() OR
    seller_id = auth.uid() OR
    is_admin()
  );

-- ============ CHAT ROOMS ============
CREATE POLICY "chatrooms_select_involved" ON chat_rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = chat_rooms.transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR t.admin_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "chatrooms_insert" ON chat_rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = chat_rooms.transaction_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR is_admin())
    )
  );

-- ============ MESSAGES ============
CREATE POLICY "messages_select_room_member" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN transactions t ON t.id = cr.transaction_id
      WHERE cr.id = messages.room_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR t.admin_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "messages_insert_room_member" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN transactions t ON t.id = cr.transaction_id
      WHERE cr.id = messages.room_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid() OR t.admin_id = auth.uid() OR is_admin())
    )
  );

-- ============ FLAGGED MESSAGES ============
CREATE POLICY "flagged_select_admin" ON flagged_messages
  FOR SELECT USING (is_admin());

CREATE POLICY "flagged_insert_any" ON flagged_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "flagged_update_admin" ON flagged_messages
  FOR UPDATE USING (is_admin());

-- ============ NOTIFICATIONS ============
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- ============ STORAGE BUCKETS ============
-- These would be created via Supabase dashboard or CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('id-documents', 'id-documents', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('listing-screenshots', 'listing-screenshots', true);

-- Storage policies for id-documents (private)
-- Only the uploader and admins can view
-- CREATE POLICY "id_docs_upload" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'id-documents' AND auth.uid() IS NOT NULL
-- );
-- CREATE POLICY "id_docs_view" ON storage.objects FOR SELECT USING (
--   bucket_id = 'id-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_admin())
-- );

-- Storage policies for listing-screenshots (public read)
-- CREATE POLICY "screenshots_upload" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'listing-screenshots' AND auth.uid() IS NOT NULL
-- );
-- CREATE POLICY "screenshots_view" ON storage.objects FOR SELECT USING (
--   bucket_id = 'listing-screenshots'
-- );

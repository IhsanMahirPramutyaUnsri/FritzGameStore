-- FritzStore: Seed Data
-- Note: Admin user must be created via Supabase Auth first,
-- then their profile role updated here.

-- After creating admin via Supabase dashboard or CLI:
-- UPDATE profiles SET role = 'admin' WHERE id = '<admin-user-uuid>';

-- Sample listings (insert after a seller account exists)
-- These serve as templates for the expected data shape.

/*
INSERT INTO listings (seller_id, title, server, ar, price, status, five_stars, weapons, artifacts, primogems, resin, welkin, battlepass, account_age, email_changeable, original_owner, screenshots)
VALUES
  ('<seller-uuid>', 'AR 60 Asia — C2 Hu Tao + Neuvillette + Nahida', 'asia', 60, 3500000, 'available',
   ARRAY['Hu Tao C2', 'Neuvillette C0', 'Nahida C1', 'Zhongli C0', 'Raiden Shogun C2'],
   ARRAY['Staff of Homa R1', 'Splashing Colors R1', 'A Thousand Floating Dreams R1'],
   '4pc Crimson Witch 70/220 crit untuk Hu Tao, 4pc Marechaussee 80/210 crit untuk Neuvillette',
   15000, 160, true, true, 'Sejak versi 1.0', 'yes', true,
   ARRAY['https://placeholder.com/ss1.jpg', 'https://placeholder.com/ss2.jpg']),

  ('<seller-uuid>', 'AR 55 Europe — Raiden C3 + Engulfing Lightning', 'europe', 55, 2000000, 'available',
   ARRAY['Raiden Shogun C3', 'Kazuha C0', 'Yelan C1', 'Kokomi C0'],
   ARRAY['Engulfing Lightning R1', 'Freedom-Sworn R1', 'Aqua Simulacra R1'],
   '4pc Emblem 65/180 crit untuk Raiden',
   8000, 120, false, true, 'Sejak versi 2.1', 'yes', true,
   ARRAY['https://placeholder.com/ss3.jpg']),

  ('<seller-uuid>', 'AR 45 Asia — Starter Xiao + Jade Spear', 'asia', 45, 500000, 'available',
   ARRAY['Xiao C0', 'Jean C0'],
   ARRAY['Primordial Jade Winged-Spear R1'],
   '4pc Vermillion 55/120 crit untuk Xiao',
   3000, 160, false, false, '6 bulan', 'no', true,
   ARRAY['https://placeholder.com/ss4.jpg']),

  ('<seller-uuid>', 'AR 58 NA — C1 Furina + Neuvillette Comp', 'north_america', 58, 4000000, 'available',
   ARRAY['Furina C1', 'Neuvillette C1', 'Kazuha C2', 'Nahida C0', 'Zhongli C1'],
   ARRAY['Splashing Colors R1', 'Key of Khaj-Nisut R1', 'Freedom-Sworn R1'],
   '4pc Golden Troupe 70/200 crit untuk Furina, 4pc Marechaussee 85/200 untuk Neuvillette',
   22000, 160, true, true, 'Sejak versi 1.4', 'yes', true,
   ARRAY['https://placeholder.com/ss5.jpg', 'https://placeholder.com/ss6.jpg']),

  ('<seller-uuid>', 'AR 50 SAR — Budget Alhaitham Team', 'sar', 50, 800000, 'available',
   ARRAY['Alhaitham C0', 'Fischl C6', 'Xingqiu C6'],
   ARRAY['Light of Foliar Incision R1'],
   '4pc Gilded Dreams 60/170 crit untuk Alhaitham',
   5000, 160, false, false, '1 tahun', 'unknown', false,
   ARRAY['https://placeholder.com/ss7.jpg']);
*/

-- ReWork demo seed. EVERYTHING here is fictional sample data (PRD rule 2) and
-- is shown with a "Sample / サンプル / Mẫu" label in the UI. Municipality names
-- are real places; the businesses, people, wages and rents are invented.

-- ---------------------------------------------------------------- support org
insert into public.support_orgs (id, name, prefecture_code, contact, is_sample) values
('00000000-0000-4000-a000-000000000001', 'くじら支援協同組合（サンプル） / Kujira Support Cooperative (Sample)', '39_kochi',
 '{"phone":"088-000-0000 (sample)","email":"help@kujira.example","hours":"Mon–Fri 9:00–17:00","languages":["ja","vi","id","en"]}', true);

-- ---------------------------------------------------------------- employers (8 Kochi + 2 Tokyo)
insert into public.employers (id, name, name_en, prefecture_code, municipality, industry) values
('10000000-0000-4000-a000-000000000001', '旅館 しおかぜ', 'Ryokan Shiokaze', '39_kochi', 'kochi_city', 'accommodation'),
('10000000-0000-4000-a000-000000000002', '足摺みさき荘', 'Ashizuri Misaki-so Inn', '39_kochi', 'tosashimizu', 'accommodation'),
('10000000-0000-4000-a000-000000000003', 'やまびこ柚子農園', 'Yamabiko Yuzu Farm', '39_kochi', 'aki', 'agriculture'),
('10000000-0000-4000-a000-000000000004', '南国グリーンハウス農場', 'Nankoku Greenhouse Farm', '39_kochi', 'nankoku', 'agriculture'),
('10000000-0000-4000-a000-000000000005', '室戸うみかぜ水産', 'Muroto Umikaze Fisheries', '39_kochi', 'muroto', 'fishery'),
('10000000-0000-4000-a000-000000000006', '須崎くろしお漁業', 'Susaki Kuroshio Fishing', '39_kochi', 'susaki', 'fishery'),
('10000000-0000-4000-a000-000000000007', '土佐ひだまり食品', 'Tosa Hidamari Foods', '39_kochi', 'kochi_city', 'food_manufacturing'),
('10000000-0000-4000-a000-000000000008', '四万十ゆめ加工所', 'Shimanto Yume Processing', '39_kochi', 'shimanto', 'food_manufacturing'),
('10000000-0000-4000-a000-000000000009', '西新宿ステイホテル', 'Nishi-Shinjuku Stay Hotel', '13_tokyo', 'shinjuku', 'accommodation'),
('10000000-0000-4000-a000-000000000010', '江戸川べんとう工場', 'Edogawa Bento Factory', '13_tokyo', 'edogawa', 'food_manufacturing');

insert into public.teams (id, employer_id, name) values
('20000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'フロント・客室'),
('20000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', '厨房'),
('20000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000003', '収穫班');

-- ---------------------------------------------------------------- listings (12 Kochi + 2 Tokyo)
insert into public.job_listings (id, employer_id, title, title_i18n, industry, municipality, wage_type, wage_amount, hours_month, dormitory, housing_fee, languages) values
('30000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '客室清掃・フロント補助',
 '{"vi":"Dọn phòng & hỗ trợ lễ tân","en":"Room cleaning & front desk support"}', 'accommodation', 'kochi_city', 'hourly', 1010, 160, true, 15000, '{ja}'),
('30000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', '調理補助',
 '{"vi":"Phụ bếp","en":"Kitchen assistant"}', 'accommodation', 'kochi_city', 'hourly', 1080, 150, true, 15000, '{ja,vi}'),
('30000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000002', '客室・配膳スタッフ',
 '{"vi":"Phục vụ phòng & bữa ăn","en":"Rooms & dining staff"}', 'accommodation', 'tosashimizu', 'monthly', 185000, 176, true, 10000, '{ja,vi}'),
('30000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000003', '柚子の収穫・選果',
 '{"vi":"Thu hoạch & phân loại yuzu","en":"Yuzu harvest & sorting"}', 'agriculture', 'aki', 'hourly', 1100, 168, true, 12000, '{ja}'),
('30000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000004', 'ナス・ショウガのハウス栽培',
 '{"vi":"Trồng cà tím & gừng trong nhà kính","en":"Greenhouse eggplant & ginger"}', 'agriculture', 'nankoku', 'hourly', 1060, 176, true, 18000, '{ja,vi,id}'),
('30000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000004', '出荷・パック詰め',
 '{"vi":"Đóng gói & xuất hàng","en":"Packing & shipping"}', 'agriculture', 'nankoku', 'hourly', 1050, 160, false, null, '{ja}'),
('30000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000005', '定置網漁の作業員',
 '{"vi":"Ngư dân lưới cố định","en":"Set-net fishing crew"}', 'fishery', 'muroto', 'monthly', 210000, 180, true, 8000, '{ja,id}'),
('30000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000006', 'かつお一本釣り船の甲板員',
 '{"vi":"Thuyền viên câu cá ngừ","en":"Pole-and-line bonito deckhand"}', 'fishery', 'susaki', 'monthly', 230000, 200, true, 0, '{ja}'),
('30000000-0000-4000-a000-000000000009', '10000000-0000-4000-a000-000000000007', 'カツオのたたき加工',
 '{"vi":"Chế biến cá ngừ nướng rơm","en":"Seared bonito processing"}', 'food_manufacturing', 'kochi_city', 'hourly', 1120, 168, false, null, '{ja,vi}'),
('30000000-0000-4000-a000-000000000010', '10000000-0000-4000-a000-000000000007', '包装・検品',
 '{"vi":"Đóng gói & kiểm hàng","en":"Packing & inspection"}', 'food_manufacturing', 'kochi_city', 'hourly', 1070, 160, true, 20000, '{ja,vi}'),
('30000000-0000-4000-a000-000000000011', '10000000-0000-4000-a000-000000000008', '栗・青のりの加工',
 '{"vi":"Chế biến hạt dẻ & rong xanh","en":"Chestnut & green-nori processing"}', 'food_manufacturing', 'shimanto', 'hourly', 1040, 168, true, 12000, '{ja}'),
('30000000-0000-4000-a000-000000000012', '10000000-0000-4000-a000-000000000005', '水産加工（干物）',
 '{"vi":"Chế biến hải sản khô","en":"Dried-fish processing"}', 'fishery', 'muroto', 'hourly', 1060, 168, true, 8000, '{ja,vi}'),
('30000000-0000-4000-a000-000000000013', '10000000-0000-4000-a000-000000000009', '客室清掃',
 '{"vi":"Dọn phòng khách sạn","en":"Hotel housekeeping"}', 'accommodation', 'shinjuku', 'hourly', 1300, 168, false, null, '{ja}'),
('30000000-0000-4000-a000-000000000014', '10000000-0000-4000-a000-000000000010', '弁当の盛り付け',
 '{"vi":"Xếp cơm hộp","en":"Bento assembly"}', 'food_manufacturing', 'edogawa', 'hourly', 1250, 168, true, 35000, '{ja,vi}');

-- ---------------------------------------------------------------- people (all fictional)
insert into auth.users (id, email, is_anonymous) values
('40000000-0000-4000-a000-000000000001', null, true),  -- Linh (demo worker)
('40000000-0000-4000-a000-000000000002', null, true),
('40000000-0000-4000-a000-000000000003', null, true),
('40000000-0000-4000-a000-000000000004', null, true),
('40000000-0000-4000-a000-000000000005', null, true),
('40000000-0000-4000-a000-000000000006', null, true),
('40000000-0000-4000-a000-000000000007', null, true),
('40000000-0000-4000-a000-000000000008', null, true),
('40000000-0000-4000-a000-000000000009', null, true),
('40000000-0000-4000-a000-000000000010', null, true),  -- Minh (has a swap request)
('50000000-0000-4000-a000-000000000001', 'sato@shiokaze.example', false),
('50000000-0000-4000-a000-000000000002', 'tanaka@kujira.example', false),
('50000000-0000-4000-a000-000000000003', 'kokusai@pref-kochi.example', false),
('50000000-0000-4000-a000-000000000004', 'admin@rework.example', false)
on conflict (id) do nothing;

insert into public.profiles (user_id, role, language, prefecture_code, municipality, industry, residence_status, years_in_japan, months_at_employer, support_org_id, employer_id, team_id, display_name, is_sample) values
('40000000-0000-4000-a000-000000000001', 'worker', 'vi', '39_kochi', 'kochi_city', 'accommodation', 'ikusei', 1.5, 14, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', 'Linh', true),
('40000000-0000-4000-a000-000000000002', 'worker', 'vi', '39_kochi', 'kochi_city', 'accommodation', 'ikusei', 2, 20, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', null, true),
('40000000-0000-4000-a000-000000000003', 'worker', 'en', '39_kochi', 'kochi_city', 'accommodation', 'ssw', 4, 30, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', null, true),
('40000000-0000-4000-a000-000000000004', 'worker', 'vi', '39_kochi', 'kochi_city', 'accommodation', 'titp', 1, 11, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', null, true),
('40000000-0000-4000-a000-000000000005', 'worker', 'ja', '39_kochi', 'kochi_city', 'accommodation', 'ssw', 3, 26, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', null, true),
('40000000-0000-4000-a000-000000000006', 'worker', 'en', '39_kochi', 'kochi_city', 'accommodation', 'ikusei', 1, 9, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', null, true),
('40000000-0000-4000-a000-000000000007', 'worker', 'vi', '39_kochi', 'kochi_city', 'accommodation', 'ikusei', 0.5, 6, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', null, true),
('40000000-0000-4000-a000-000000000008', 'worker', 'vi', '39_kochi', 'kochi_city', 'accommodation', 'titp', 2, 22, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', null, true),
('40000000-0000-4000-a000-000000000009', 'worker', 'en', '39_kochi', 'kochi_city', 'accommodation', 'ssw', 5, 40, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', null, true),
('40000000-0000-4000-a000-000000000010', 'worker', 'vi', '39_kochi', 'aki', 'agriculture', 'ikusei', 1.2, 13, '00000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000003', '20000000-0000-4000-a000-000000000003', 'Minh', true),
('50000000-0000-4000-a000-000000000001', 'employer', 'ja', '39_kochi', 'kochi_city', 'accommodation', null, 0, null, null, '10000000-0000-4000-a000-000000000001', null, '佐藤（旅館しおかぜ）', true),
('50000000-0000-4000-a000-000000000002', 'support_org', 'ja', '39_kochi', 'kochi_city', null, null, 0, null, '00000000-0000-4000-a000-000000000001', null, null, '田中（くじら支援協同組合）', true),
('50000000-0000-4000-a000-000000000003', 'municipality', 'ja', '39_kochi', 'kochi_city', null, null, 0, null, null, null, null, '高知県 国際交流課（サンプル）', true),
('50000000-0000-4000-a000-000000000004', 'admin', 'en', '39_kochi', null, null, null, 0, null, null, null, null, 'ReWork admin', true);

-- Consents: every switch defaults OFF (FR-002). Linh starts with all off so the
-- demo shows the in-context consent prompts.
insert into public.consents (user_id, chat_improve, survey_aggregate, share_swap_with_org)
select user_id, false, user_id <> '40000000-0000-4000-a000-000000000001', user_id = '40000000-0000-4000-a000-000000000010'
from public.profiles where role = 'worker';

-- ---------------------------------------------------------------- pulse surveys
insert into public.pulse_surveys (id, employer_id, team_id, period) values
('60000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', '2026-10'),
('60000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000002', '2026-10'),
('60000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000001', '20000000-0000-4000-a000-000000000001', '2026-09');

-- Front team, October: 5 of 6 have answered (Linh hasn't) → results shown.
insert into public.pulse_participation (survey_id, user_id)
select '60000000-0000-4000-a000-000000000001', id from (values
  ('40000000-0000-4000-a000-000000000002'::uuid), ('40000000-0000-4000-a000-000000000003'), ('40000000-0000-4000-a000-000000000004'),
  ('40000000-0000-4000-a000-000000000005'), ('40000000-0000-4000-a000-000000000006')) v(id);
insert into public.pulse_answers (survey_id, q1, q2, q3, q4, q5, free_text) values
('60000000-0000-4000-a000-000000000001', 4, 3, 2, 4, 3, '繁忙期のシフトが急に変わるのがつらい'),
('60000000-0000-4000-a000-000000000001', 4, 4, 3, 5, 4, null),
('60000000-0000-4000-a000-000000000001', 3, 3, 2, 4, 3, 'Tôi muốn có lớp học tiếng Nhật sau giờ làm'),
('60000000-0000-4000-a000-000000000001', 5, 4, 3, 4, 4, 'Wi-Fi in the dormitory is very slow'),
('60000000-0000-4000-a000-000000000001', 4, 3, 2, 3, 3, 'Ca làm thay đổi đột ngột, khó sắp xếp');

-- Kitchen team, October: only 3 answers → "not enough responses (privacy)".
insert into public.pulse_participation (survey_id, user_id) values
('60000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000007'),
('60000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000008'),
('60000000-0000-4000-a000-000000000002', '40000000-0000-4000-a000-000000000009');
insert into public.pulse_answers (survey_id, q1, q2, q3, q4, q5, free_text) values
('60000000-0000-4000-a000-000000000002', 2, 3, 3, 2, 2, null),
('60000000-0000-4000-a000-000000000002', 3, 3, 2, 3, 2, null),
('60000000-0000-4000-a000-000000000002', 2, 2, 3, 3, 3, null);

-- Front team, September: 6 answers (trend line).
insert into public.pulse_participation (survey_id, user_id)
select '60000000-0000-4000-a000-000000000003', user_id from public.profiles where team_id = '20000000-0000-4000-a000-000000000001';
insert into public.pulse_answers (survey_id, q1, q2, q3, q4, q5, free_text) values
('60000000-0000-4000-a000-000000000003', 4, 4, 3, 4, 4, null),
('60000000-0000-4000-a000-000000000003', 4, 4, 3, 5, 4, null),
('60000000-0000-4000-a000-000000000003', 4, 3, 3, 4, 3, null),
('60000000-0000-4000-a000-000000000003', 5, 4, 4, 4, 4, null),
('60000000-0000-4000-a000-000000000003', 4, 4, 3, 4, 4, null),
('60000000-0000-4000-a000-000000000003', 3, 3, 3, 4, 3, null);

-- ---------------------------------------------------------------- swap request already in the org inbox
insert into public.swap_requests (worker_id, support_org_id, answers_json, suggested_listing_ids, status, created_at) values
('40000000-0000-4000-a000-000000000010', '00000000-0000-4000-a000-000000000001',
 '{"desiredMoneyLeft":120000,"needDormitory":true,"nearCompatriots":true,"preferredIndustry":"agriculture","earliestStart":"2027-04","snapshot":{"language":"vi","industry":"agriculture","residenceStatus":"ikusei","monthsAtEmployer":13,"municipality":"aki"},"message":"Em muốn chuyển sang nơi có nhiều người Việt hơn."}',
 '{30000000-0000-4000-a000-000000000005,30000000-0000-4000-a000-000000000010,30000000-0000-4000-a000-000000000012}', 'new', now() - interval '2 days');

-- ---------------------------------------------------------------- chat (Linh, for RLS tests and demo history)
insert into public.chat_messages (user_id, role, content, topic, created_at) values
('40000000-0000-4000-a000-000000000001', 'user', 'Rác nhựa vứt ngày nào ạ?', 'daily_life', now() - interval '3 days'),
('40000000-0000-4000-a000-000000000001', 'assistant', 'Ở TP. Kōchi (mẫu), rác nhựa thường được thu theo lịch riêng của khu bạn ở. Hãy xem lịch thu gom của phường.', 'daily_life', now() - interval '3 days');

-- ---------------------------------------------------------------- municipality aggregates (already k-filtered at read time)
insert into public.topic_counts (prefecture_code, week, topic, distinct_users) values
('39_kochi', '2026-09-28', 'daily_life', 14), ('39_kochi', '2026-10-05', 'daily_life', 11), ('39_kochi', '2026-10-12', 'daily_life', 16), ('39_kochi', '2026-10-19', 'daily_life', 12),
('39_kochi', '2026-09-28', 'japanese_learning', 7), ('39_kochi', '2026-10-05', 'japanese_learning', 9), ('39_kochi', '2026-10-12', 'japanese_learning', 8), ('39_kochi', '2026-10-19', 'japanese_learning', 10),
('39_kochi', '2026-09-28', 'visa_legal', 5), ('39_kochi', '2026-10-05', 'visa_legal', 6), ('39_kochi', '2026-10-12', 'visa_legal', 4), ('39_kochi', '2026-10-19', 'visa_legal', 7),
('39_kochi', '2026-09-28', 'labor_dispute', 2), ('39_kochi', '2026-10-05', 'labor_dispute', 3), ('39_kochi', '2026-10-12', 'labor_dispute', 1), ('39_kochi', '2026-10-19', 'labor_dispute', 4),
('39_kochi', '2026-10-12', 'emergency', 1),
('39_kochi', '2026-09-28', 'other', 6), ('39_kochi', '2026-10-05', 'other', 5), ('39_kochi', '2026-10-12', 'other', 7), ('39_kochi', '2026-10-19', 'other', 5);

-- ---------------------------------------------------------------- community (FR-030)
insert into public.community_groups (prefecture_code, municipality, language, name, description, meets, contact) values
('39_kochi', 'kochi_city', 'vi', '{"vi":"Người Việt ở Kōchi","ja":"高知のベトナム人の会","en":"Vietnamese in Kochi"}',
 '{"vi":"Gặp nhau ăn uống, hỏi đáp chuyện đời sống, đón người mới đến.","ja":"食事会や生活の情報交換、新しく来た人のお出迎え。","en":"Meals together, life tips, welcoming newcomers."}', 'Monthly · Sunday 14:00', 'LINE OpenChat (sample)'),
('39_kochi', 'nankoku', 'vi', '{"vi":"Nhóm bạn Nankoku","ja":"南国市ベトナム仲間","en":"Nankoku friends (Vietnamese)"}',
 '{"vi":"Chủ yếu người làm nông nghiệp nhà kính. Đá bóng tối thứ Bảy.","ja":"ハウス農業で働く人が中心。土曜夜にフットサル。","en":"Mostly greenhouse farm workers. Futsal on Saturday nights."}', 'Weekly · Sat 19:00', 'Facebook group (sample)'),
('39_kochi', 'shimanto', 'vi', '{"vi":"Người Việt vùng Shimanto","ja":"四万十のベトナム人","en":"Vietnamese around Shimanto"}',
 '{"vi":"Nhóm nhỏ, hay đi câu cá và nấu ăn chung bên sông.","ja":"小さなグループ。川辺で釣りや料理。","en":"Small group — fishing and cooking by the river."}', 'Twice a month', 'LINE (sample)'),
('39_kochi', 'kochi_city', 'id', '{"vi":"Cộng đồng Indonesia Kōchi","ja":"高知インドネシア・コミュニティ","en":"Indonesian community Kochi"}',
 '{"vi":"Có nhiều thành viên làm nghề cá ở Muroto và Susaki.","ja":"室戸・須崎の漁業で働くメンバーが多い。","en":"Many members work in fishing in Muroto and Susaki."}', 'Monthly · Friday evening', 'WhatsApp (sample)'),
('39_kochi', 'kochi_city', 'tl', '{"vi":"Người Philippines ở Kōchi","ja":"高知フィリピン人の会","en":"Pinoy sa Kochi"}',
 '{"vi":"Hát, nấu ăn và giúp nhau làm giấy tờ.","ja":"歌と料理、書類の助け合い。","en":"Singing, cooking, helping each other with paperwork."}', 'Monthly', 'Facebook (sample)'),
('39_kochi', 'kochi_city', 'ja', '{"vi":"Salon nói chuyện tiếng Nhật","ja":"日本語おしゃべりサロン","en":"Japanese chat salon"}',
 '{"vi":"Tình nguyện viên địa phương nói chuyện tiếng Nhật với bạn, miễn phí.","ja":"地域のボランティアと日本語でおしゃべり。無料。","en":"Chat in Japanese with local volunteers. Free."}', 'Weekly · Wed 19:00', 'International association desk (sample)'),
('13_tokyo', 'shinjuku', 'vi', '{"vi":"Người Việt Shinjuku","ja":"新宿ベトナム人の会","en":"Vietnamese in Shinjuku"}',
 '{"vi":"Nhóm lớn, nhiều sự kiện.","ja":"大きなグループ。","en":"Big group with many events."}', 'Often', 'Facebook (sample)');

insert into public.community_events (prefecture_code, municipality, kind, title, description, starts_at, place) values
('39_kochi', 'kochi_city', 'walk', '{"vi":"Dạo chợ Chủ nhật","ja":"日曜市さんぽ","en":"Sunday Market walk"}',
 '{"vi":"Chợ đường phố hơn 300 năm. Đi cùng người địa phương, học cách mua rau.","ja":"300年以上続く街路市を地元の人と歩きます。","en":"Walk the 300-year-old street market with locals."}', '2026-11-01 08:30+09', '追手筋 Otesuji'),
('39_kochi', 'kochi_city', 'food', '{"vi":"Làm cá ngừ nướng rơm","ja":"カツオのわら焼き体験","en":"Straw-fire katsuo tataki workshop"}',
 '{"vi":"Tự tay nướng cá ngừ bằng lửa rơm — món nổi tiếng của Kōchi.","ja":"高知名物をわらの炎で焼いてみよう。","en":"Sear bonito over a straw fire, Kochi’s signature dish."}', '2026-11-08 11:00+09', 'ひろめ市場 周辺 (sample venue)'),
('39_kochi', 'kochi_city', 'class', '{"vi":"Lớp ôn JLPT N4","ja":"JLPT N4 対策教室","en":"JLPT N4 prep class"}',
 '{"vi":"Miễn phí, có tài liệu tiếng Việt.","ja":"無料。ベトナム語の資料あり。","en":"Free, Vietnamese handouts available."}', '2026-11-14 18:30+09', '国際交流センター (sample)'),
('39_kochi', 'nankoku', 'safety', '{"vi":"Diễn tập phòng chống thiên tai","ja":"外国人住民のための防災訓練","en":"Disaster drill for foreign residents"}',
 '{"vi":"Học cách chạy lánh nạn khi có động đất và sóng thần.","ja":"地震・津波のときの避難を練習します。","en":"Practise evacuating for earthquakes and tsunami."}', '2026-11-22 10:00+09', '南国市 防災センター (sample)'),
('39_kochi', 'kochi_city', 'festival', '{"vi":"Tập Yosakoi mở cửa","ja":"よさこいチーム 体験練習","en":"Yosakoi team open practice"}',
 '{"vi":"Cầm naruko, nhảy cùng đội địa phương. Không cần kinh nghiệm.","ja":"鳴子を持って地元チームと踊ろう。初心者歓迎。","en":"Grab naruko clappers and dance with a local team. Beginners welcome."}', '2026-12-06 13:00+09', '中央公園 (sample)'),
('39_kochi', 'kochi_city', 'festival', '{"vi":"Gặp mặt đón Tết","ja":"テト（旧正月）の集い","en":"Tết New Year gathering"}',
 '{"vi":"Bánh chưng, lì xì và gặp gỡ người Việt khắp Kōchi.","ja":"バインチュンを囲んで、県内のベトナム人と交流。","en":"Bánh chưng, lucky money and Vietnamese friends from across Kochi."}', '2027-02-07 12:00+09', '市民活動センター (sample)');

-- ---------------------------------------------------------------- buddy queue
insert into public.buddy_requests (user_id, interests, availability, language, status) values
('40000000-0000-4000-a000-000000000007', 'Cooking, football, practising Japanese', 'Sunday afternoons', 'vi', 'new');

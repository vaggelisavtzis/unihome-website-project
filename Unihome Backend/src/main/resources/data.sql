SET NAMES utf8mb4;
SET time_zone = '+00:00';


SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE favorites;
TRUNCATE TABLE contact_messages;
TRUNCATE TABLE contact_recipients;
TRUNCATE TABLE home_highlights;
TRUNCATE TABLE about_sections;
TRUNCATE TABLE temporary_stay_images;
TRUNCATE TABLE temporary_stay_unavailable_windows;
TRUNCATE TABLE temporary_stay_amenities;
TRUNCATE TABLE temporary_stays;
TRUNCATE TABLE roommate_ratings;
TRUNCATE TABLE roommate_amenities;
TRUNCATE TABLE roommate_images;
TRUNCATE TABLE roommate_lifestyle;
TRUNCATE TABLE roommate_property_features;
TRUNCATE TABLE roommate_preferences;
TRUNCATE TABLE roommate_unavailable_windows;
TRUNCATE TABLE roommate_ads;
TRUNCATE TABLE property_unavailable_windows;
TRUNCATE TABLE property_images;
TRUNCATE TABLE property_features;
TRUNCATE TABLE properties;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;






INSERT INTO users (
    id, email, password, first_name, last_name, age, phone, role,
    student_university, student_department, student_semester, student_is_student,
    owner_address, owner_vat_number
) VALUES
    (UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 'owner.elena@unihome.test',
     '$2b$10$w6s2QWvGj0cTrH4zzjBqo.K477Zhm1.HMsRlFojpIlz3djOA5jL6C', 'Έλενα', 'Μαρίνου', 41,
     '+30 694 111 1111', 'OWNER', NULL, NULL, NULL, NULL, 'Καρλοβάσου 45, Σάμος', 'EL123456789'),
    (UUID_TO_BIN('22222222-2222-2222-2222-222222222222'), 'owner.nikos@unihome.test',
     '$2b$10$w6s2QWvGj0cTrH4zzjBqo.K477Zhm1.HMsRlFojpIlz3djOA5jL6C', 'Νίκος', 'Αργυρίου', 48,
     '+30 694 222 2222', 'OWNER', NULL, NULL, NULL, NULL, 'Βαθύ 12, Σάμος', 'EL987654321'),
    (UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), 'student.maria@unihome.test',
     '$2b$10$w6s2QWvGj0cTrH4zzjBqo.K477Zhm1.HMsRlFojpIlz3djOA5jL6C', 'Μαρία', 'Ιωάννου', 21,
     '+30 694 333 3333', 'REGULAR', 'Πανεπιστήμιο Αιγαίου', 'Μηχανικών Πληροφοριακών και Επικοινωνιακών Συστημάτων',
     '5ο', TRUE, NULL, NULL),
    (UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'student.giorgos@unihome.test',
     '$2b$10$w6s2QWvGj0cTrH4zzjBqo.K477Zhm1.HMsRlFojpIlz3djOA5jL6C', 'Γιώργος', 'Λυμπέρης', 23,
     '+30 694 444 4444', 'REGULAR', 'Πανεπιστήμιο Αιγαίου', 'Στατιστικής και Αναλογιστικών - Χρηματοοικονομικών Μαθηματικών',
     '7ο', TRUE, NULL, NULL);


INSERT INTO properties (
    id, owner_id, title, description, type, price, area, rooms,
    is_furnished, has_damage, address, city, postal_code, latitude, longitude,
    contact_name, contact_phone, contact_email, contact_instagram, contact_facebook,
    availability_note, availability_last_updated, availability_calendar_url,
    hospitality_opt_in, hospitality_listing_id, is_published, created_at
) VALUES
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111'),
     'Φωτεινό Διαμέρισμα κοντά στο Πανεπιστήμιο',
     'Διαμέρισμα 75 τ.μ. με δύο υπνοδωμάτια, πρόσφατα ανακαινισμένο, ιδανικό για φοιτητές.',
     'APARTMENT', 520.00, 75.0, 3,
     TRUE, FALSE, 'Παππά 10', 'Καρλόβασι', '83200', 37.7921, 26.7045,
    'Έλενα Μαρίνου', '+30 694 111 1111', 'owner.elena@unihome.test', NULL, NULL,
     'Διαθέσιμο από 1 Σεπτεμβρίου. Επισκέψεις κάθε Σάββατο.', NOW(), NULL,
     TRUE, UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), TRUE, NOW()),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222'),
     'Μονοκατοικία με αυλή στη Χώρα',
     'Κατοικία 120 τ.μ. με τρία υπνοδωμάτια, μεγάλη αυλή και αποθήκη, κατάλληλη για οικογένεια.',
     'HOUSE', 750.00, 120.0, 5,
     TRUE, FALSE, 'Αγ. Σπυρίδωνος 24', 'Χώρα Σάμου', '83100', 37.7542, 26.9786,
    'Νίκος Αργυρίου', '+30 694 222 2222', 'owner.nikos@unihome.test', NULL, NULL,
     'Διαθέσιμο άμεσα. Προτιμώνται ενοικιαστές μακροχρόνιας μίσθωσης.', NOW(), NULL,
     FALSE, NULL, TRUE, NOW());


INSERT INTO property_features (property_id, feature) VALUES
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 'Κεντρική Θέρμανση'),
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 'Κλιματισμός'),
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 'Wi-Fi 100Mbps'),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), 'Τζάκι'),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), 'Θέση Στάθμευσης'),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), 'Αποθήκη');


INSERT INTO property_images (property_id, image_url) VALUES
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=960&q=80'),
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=960&q=80'),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=960&q=80'),
    (UUID_TO_BIN('aaaa2222-aaaa-2222-aaaa-2222aaaa2222'), 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=960&q=80');


INSERT INTO property_unavailable_windows (
    property_id, window_order, window_start_date, window_end_date, window_label
) VALUES
    (UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), 1, '2025-08-01', '2025-08-31', 'Καλοκαιρινή συντήρηση');


INSERT INTO temporary_stays (
    id, manager_id, title, description, type, price_per_night, min_nights, cost_category,
    purpose, address, city, postal_code, latitude, longitude,
    contact_name, contact_phone, contact_email, contact_website, contact_instagram, contact_facebook,
    availability_note, availability_last_updated, availability_calendar_url,
    linked_property_id, created_at
) VALUES
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111'),
     'Φιλοξενία στο διαμέρισμα της Έλενας',
     'Παρέχεται προσωρινή φιλοξενία σε ένα δωμάτιο του διαμερίσματος με πρόσβαση στην κουζίνα.',
     'HOSTING', 0.00, 1, 'FREE', 'HOSPITALITY',
     'Παππά 10', 'Καρλόβασι', '83200', 37.7921, 26.7045,
    'Έλενα Μαρίνου', '+30 694 111 1111', 'owner.elena@unihome.test', 'https://cal.unihome.test/elena', NULL, NULL,
     'Παρέχεται πρωινό κάθε Κυριακή.', NOW(), 'https://cal.unihome.test/elena',
     UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), NOW());

INSERT INTO temporary_stay_amenities (stay_id, amenity) VALUES
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), 'Wi-Fi'),
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), 'Πλυντήριο'),
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), 'Χώρος Γραφείου');

INSERT INTO temporary_stay_images (stay_id, image_url) VALUES
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), 'https://images.unsplash.com/photo-1505693415763-3ed5e04ba4cd?auto=format&fit=crop&w=960&q=80'),
    (UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'), 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=960&q=80');


INSERT INTO temporary_stays (
    id, manager_id, title, description, type, price_per_night, min_nights, cost_category,
    purpose, address, city, postal_code, latitude, longitude,
    contact_name, contact_phone, contact_email, contact_website, contact_instagram, contact_facebook,
    availability_note, availability_last_updated, availability_calendar_url,
    linked_property_id, created_at
) VALUES
    (UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222'),
     'Ξενώνας φιλοξενίας με θέα',
     'Διαθέσιμος ξενώνας με δύο κρεβάτια και ιδιωτικό μπάνιο για φιλοξενία επισκεπτών.',
     'HOSTEL', 25.00, 2, 'PAID', 'ACCOMMODATION',
     'Αγ. Σπυρίδωνος 24', 'Χώρα Σάμου', '83100', 37.7542, 26.9786,
    'Νίκος Αργυρίου', '+30 694 222 2222', 'owner.nikos@unihome.test', 'https://cal.unihome.test/nikos', NULL, NULL,
     'Ελάχιστη διαμονή 2 βραδιές. Παρέχεται δωρεάν μεταφορά από το λιμάνι.', NOW(), NULL,
     NULL, NOW());

INSERT INTO temporary_stay_amenities (stay_id, amenity) VALUES
    (UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), 'Κλιματισμός'),
    (UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), 'Πρωινό'),
    (UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), 'Θέα Θάλασσα');

INSERT INTO temporary_stay_images (stay_id, image_url) VALUES
    (UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=960&q=80');


INSERT INTO roommate_ads (
    id, author_id, title, description, monthly_rent, property_location, listing_mode, available_from,
    profile_name, profile_age, profile_gender, profile_university, profile_department, profile_semester,
    profile_bio, profile_avatar, profile_is_student,
    location_city, location_area, location_proximity,
    contact_name, contact_phone, contact_email, contact_instagram, contact_facebook,
    is_published,
    availability_note, availability_last_updated, availability_calendar_url,
    created_at
) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), UUID_TO_BIN('33333333-3333-3333-3333-333333333333'),
     'Ψάχνω συγκάτοικο για διαμέρισμα κοντά στο Τμήμα',
     'Έχω ήδη διαμέρισμα 70 τ.μ. και αναζητώ συγκάτοικο για μοίρασμα εξόδων και όμορφη συμβίωση.',
     260.00, 'Παππά 14, Καρλόβασι', 'HOST_SEEKING_ROOMMATE', '2025-02-01',
     'Μαρία Ιωάννου', 21, 'Γυναίκα', 'Πανεπιστήμιο Αιγαίου',
     'Μηχανικών Πληροφοριακών και Επικοινωνιακών Συστημάτων', '5ο',
    'Ασχολούμαι με εθελοντισμό και μου αρέσει η ήρεμη συγκατοίκηση.',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=640&q=80', TRUE,
     'Καρλόβασι', 'Παλαιό Καρλόβασι', '5 λεπτά με τα πόδια από το τμήμα',
    'Μαρία Ιωάννου', '+30 694 333 3333', 'student.maria@unihome.test', NULL, NULL,
    TRUE,
    'Προτιμώ συγκάτοικο που δεν καπνίζει.', NOW(), NULL,
     NOW());

INSERT INTO roommate_preferences (ad_id, preference) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Σεβασμός ωρών ησυχίας'),
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Καθαριότητα');

INSERT INTO roommate_property_features (ad_id, feature) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Κοινόχρηστη σκεπαστή βεράντα'),
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Αποθήκη για ποδήλατα');

INSERT INTO roommate_lifestyle (ad_id, lifestyle_order, lifestyle_tag) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 1, 'Ήρεμη βραδινή ρουτίνα'),
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 2, 'Αγαπάει το διάβασμα');

INSERT INTO roommate_images (ad_id, image_url) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=960&q=80');

INSERT INTO roommate_amenities (ad_id, amenity) VALUES
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Γρήγορο Wi-Fi'),
    (UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), 'Πλυντήριο');


INSERT INTO favorites (id, user_id, type, target_id, created_at) VALUES
    (UUID_TO_BIN('dddd1111-dddd-1111-dddd-1111dddd1111'), UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'PROPERTY', UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'), NOW()),
    (UUID_TO_BIN('dddd2222-dddd-2222-dddd-2222dddd2222'), UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'TEMPORARY_STAY', UUID_TO_BIN('bbbb2222-bbbb-2222-bbbb-2222bbbb2222'), NOW()),
    (UUID_TO_BIN('dddd3333-dddd-3333-dddd-3333dddd3333'), UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'ROOMMATE_AD', UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'), NOW());


INSERT INTO contact_recipients (id, email, active, created_at) VALUES
    (UUID_TO_BIN('12121212-1212-1212-1212-121212121212'), 'contact.placeholder@example.com', TRUE, NOW());


INSERT INTO contact_messages (id, name, email, subject, message, created_at) VALUES
    (UUID_TO_BIN('eeee1111-eeee-1111-eeee-1111eeee1111'), 'Αναστασία Κ.', 'anastasia@example.test', 'Ερώτηση για προσωρινή διαμονή',
     'Καλησπέρα, ενδιαφέρομαι για τον ξενώνα φιλοξενίας με θέα. Είναι διαθέσιμος για 3 βράδια;', NOW());


INSERT INTO about_sections (id, slug, heading, body, display_order, published, updated_at) VALUES
    (UUID_TO_BIN('ffff1111-ffff-1111-ffff-1111ffff1111'), 'mission', 'Η αποστολή μας',
     'Το Unihome συνδέει φοιτητές, ιδιοκτήτες και μέλη της κοινότητας της Σάμου. Προωθούμε την ασφαλή στέγαση και τη φιλοξενία.',
     1, TRUE, NOW()),
    (UUID_TO_BIN('ffff2222-ffff-2222-ffff-2222ffff2222'), 'community', 'Κοινότητα και συνεργασίες',
     'Συνεργαζόμαστε με το Πανεπιστήμιο Αιγαίου και την τοπική κοινωνία για να διευκολύνουμε την εύρεση στέγης.',
     2, TRUE, NOW());


INSERT INTO home_highlights (
    id, type, reference_id, title, subtitle, image_url, link_url, priority, published, created_at, updated_at
) VALUES
    (UUID_TO_BIN('99991111-9999-1111-9999-111199991111'), 'FEATURED_PROPERTY', UUID_TO_BIN('aaaa1111-aaaa-1111-aaaa-1111aaaa1111'),
     'Νέα διαμερίσματα κοντά στο campus', 'Βρες γρήγορα στέγη λίγα λεπτά από το Πανεπιστήμιο.',
     'https://images.unsplash.com/photo-1484156818044-c040038b0710?auto=format&fit=crop&w=1280&q=80', '/properties', 1, TRUE, NOW(), NOW()),
    (UUID_TO_BIN('99992222-9999-2222-9999-222299992222'), 'FEATURED_TEMPORARY_STAY', UUID_TO_BIN('bbbb1111-bbbb-1111-bbbb-1111bbbb1111'),
     'Φιλοξενία φοιτητών από την κοινότητα', 'Τοπικοί ιδιοκτήτες διαθέτουν δωμάτια για προσωρινή διαμονή.',
     'https://images.unsplash.com/photo-1505693415763-3ed5e04ba4cd?auto=format&fit=crop&w=1280&q=80', '/temporary', 2, TRUE, NOW(), NOW());


INSERT INTO roommate_ratings (
    id, ad_id, reviewer_id, reviewer_name, score, comment, created_at
) VALUES
    (UUID_TO_BIN('77771111-7777-1111-7777-111177771111'), UUID_TO_BIN('cccc1111-cccc-1111-cccc-1111cccc1111'),
     UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'Γιώργος Λυμπέρης', 5,
     'Η Μαρία είναι εξαιρετική συγκάτοικος, το σπίτι είναι πολύ καθαρό και ήσυχο.', NOW());

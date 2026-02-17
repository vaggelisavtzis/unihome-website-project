SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    age INT,
    phone VARCHAR(50),
    role VARCHAR(20) NOT NULL,
    student_university VARCHAR(255),
    student_department VARCHAR(255),
    student_semester VARCHAR(50),
    student_is_student BOOLEAN,
    owner_address VARCHAR(500),
    owner_vat_number VARCHAR(50),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS properties (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    owner_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    type VARCHAR(30) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    area DOUBLE NOT NULL,
    rooms INT NOT NULL,
    is_furnished BOOLEAN,
    has_damage BOOLEAN,
    address VARCHAR(500),
    city VARCHAR(120),
    postal_code VARCHAR(20),
    latitude DOUBLE,
    longitude DOUBLE,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_instagram VARCHAR(500),
    contact_facebook VARCHAR(500),
    availability_note VARCHAR(2000),
    availability_last_updated DATETIME(6),
    availability_calendar_url VARCHAR(2000),
    hospitality_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    hospitality_listing_id BINARY(16),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_features (
    property_id BINARY(16) NOT NULL,
    feature VARCHAR(100) NOT NULL,
    PRIMARY KEY (property_id, feature),
    CONSTRAINT fk_property_features_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_images (
    property_id BINARY(16) NOT NULL,
    image_url VARCHAR(512) NOT NULL,
    PRIMARY KEY (property_id, image_url),
    CONSTRAINT fk_property_images_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS property_unavailable_windows (
    property_id BINARY(16) NOT NULL,
    window_order INT NOT NULL,
    window_start_date DATE,
    window_end_date DATE,
    window_label VARCHAR(255),
    PRIMARY KEY (property_id, window_order),
    CONSTRAINT fk_property_windows_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_ads (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    author_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    monthly_rent DECIMAL(12, 2) NOT NULL,
    property_location VARCHAR(500),
    listing_mode VARCHAR(40) NOT NULL DEFAULT 'HOST_SEEKING_ROOMMATE',
    available_from DATE,
    profile_name VARCHAR(255),
    profile_age INT,
    profile_gender VARCHAR(50),
    profile_university VARCHAR(255),
    profile_department VARCHAR(255),
    profile_semester VARCHAR(50),
    profile_bio VARCHAR(2000),
    profile_avatar VARCHAR(2000),
    profile_is_student BOOLEAN,
    location_city VARCHAR(255),
    location_area VARCHAR(255),
    location_proximity VARCHAR(255),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_instagram VARCHAR(500),
    contact_facebook VARCHAR(500),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    availability_note VARCHAR(2000),
    availability_last_updated DATETIME(6),
    availability_calendar_url VARCHAR(2000),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_roommate_ads_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_preferences (
    ad_id BINARY(16) NOT NULL,
    preference VARCHAR(255) NOT NULL,
    PRIMARY KEY (ad_id, preference),
    CONSTRAINT fk_roommate_preferences_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_property_features (
    ad_id BINARY(16) NOT NULL,
    feature VARCHAR(255) NOT NULL,
    PRIMARY KEY (ad_id, feature),
    CONSTRAINT fk_roommate_features_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_lifestyle (
    ad_id BINARY(16) NOT NULL,
    lifestyle_order INT NOT NULL,
    lifestyle_tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (ad_id, lifestyle_order),
    CONSTRAINT fk_roommate_lifestyle_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_images (
    ad_id BINARY(16) NOT NULL,
    image_url VARCHAR(512) NOT NULL,
    PRIMARY KEY (ad_id, image_url),
    CONSTRAINT fk_roommate_images_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_amenities (
    ad_id BINARY(16) NOT NULL,
    amenity VARCHAR(255) NOT NULL,
    PRIMARY KEY (ad_id, amenity),
    CONSTRAINT fk_roommate_amenities_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_unavailable_windows (
    ad_id BINARY(16) NOT NULL,
    window_order INT NOT NULL,
    window_start_date DATE,
    window_end_date DATE,
    window_label VARCHAR(255),
    PRIMARY KEY (ad_id, window_order),
    CONSTRAINT fk_roommate_windows_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS roommate_ratings (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    ad_id BINARY(16) NOT NULL,
    reviewer_id BINARY(16) NOT NULL,
    reviewer_name VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    comment VARCHAR(2000),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_roommate_ratings_ad FOREIGN KEY (ad_id) REFERENCES roommate_ads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temporary_stays (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    manager_id BINARY(16) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(4000) NOT NULL,
    type VARCHAR(30) NOT NULL,
    price_per_night DECIMAL(12, 2) NOT NULL,
    min_nights INT NOT NULL,
    cost_category VARCHAR(20) NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(120),
    postal_code VARCHAR(20),
    latitude DOUBLE,
    longitude DOUBLE,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    contact_website VARCHAR(2000),
    contact_instagram VARCHAR(500),
    contact_facebook VARCHAR(500),
    availability_note VARCHAR(2000),
    availability_last_updated DATETIME(6),
    availability_calendar_url VARCHAR(2000),
    linked_property_id BINARY(16),
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_temporary_stays_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temporary_stay_amenities (
    stay_id BINARY(16) NOT NULL,
    amenity VARCHAR(255) NOT NULL,
    PRIMARY KEY (stay_id, amenity),
    CONSTRAINT fk_temporary_amenities_stay FOREIGN KEY (stay_id) REFERENCES temporary_stays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temporary_stay_images (
    stay_id BINARY(16) NOT NULL,
    image_url VARCHAR(512) NOT NULL,
    PRIMARY KEY (stay_id, image_url),
    CONSTRAINT fk_temporary_images_stay FOREIGN KEY (stay_id) REFERENCES temporary_stays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS temporary_stay_unavailable_windows (
    stay_id BINARY(16) NOT NULL,
    window_order INT NOT NULL,
    window_start_date DATE,
    window_end_date DATE,
    window_label VARCHAR(255),
    PRIMARY KEY (stay_id, window_order),
    CONSTRAINT fk_temporary_windows_stay FOREIGN KEY (stay_id) REFERENCES temporary_stays(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message VARCHAR(4000) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_recipients (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    email VARCHAR(255) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS favorites (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    user_id BINARY(16) NOT NULL,
    type VARCHAR(30) NOT NULL,
    target_id BINARY(16) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS about_sections (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    slug VARCHAR(120) NOT NULL UNIQUE,
    heading VARCHAR(255) NOT NULL,
    body VARCHAR(6000) NOT NULL,
    display_order INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS home_highlights (
    id BINARY(16) NOT NULL PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    type VARCHAR(40) NOT NULL,
    reference_id BINARY(16),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(1000),
    image_url VARCHAR(2000),
    link_url VARCHAR(2000),
    priority INT NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


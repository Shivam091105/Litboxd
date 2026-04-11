-- ============================================================
--  BookLens Database Setup Script
--  Run this once before starting the Spring Boot app.
--  Hibernate will create/update all tables automatically.
-- ============================================================

-- Create the database
CREATE DATABASE booklens;

-- Connect to it
\c booklens;

-- Create a dedicated user (optional but recommended)
CREATE USER booklens_user WITH PASSWORD 'booklens_pass';
GRANT ALL PRIVILEGES ON DATABASE booklens TO booklens_user;
GRANT ALL ON SCHEMA public TO booklens_user;

-- ============================================================
--  If you want to seed some genres for testing:
-- ============================================================

-- After running the app once (Hibernate creates tables), run:
--
-- INSERT INTO books (title, author, genres, average_rating, ratings_count, logs_count, reviews_count, created_at)
-- VALUES
--   ('The Brothers Karamazov', 'Fyodor Dostoevsky', 'Classics,Literary Fiction,Philosophy', 4.7, 50000, 80000, 12000, NOW()),
--   ('A Little Life',          'Hanya Yanagihara',   'Literary Fiction,Contemporary',        4.5, 40000, 65000,  9000, NOW()),
--   ('Pachinko',               'Min Jin Lee',         'Historical Fiction,Literary Fiction',  4.6, 35000, 55000,  8000, NOW()),
--   ('Piranesi',               'Susanna Clarke',      'Fantasy,Mystery',                      4.2, 30000, 50000,  7000, NOW()),
--   ('Normal People',          'Sally Rooney',        'Literary Fiction,Contemporary,Romance',4.1, 80000, 120000,18000, NOW());

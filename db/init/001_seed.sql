CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    age INTEGER,
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    company VARCHAR(100),
    city VARCHAR(100),
    country VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO users (first_name, last_name, email, age, plan, company, city, country, created_at) VALUES
('Ava', 'Chen', 'ava.chen@example.com', 29, 'pro', 'Streamline Inc', 'San Francisco', 'US', '2024-01-15 09:30:00'),
('Marcus', 'Johnson', 'marcus.j@example.com', 34, 'enterprise', 'DataFlow Corp', 'New York', 'US', '2024-02-01 14:00:00'),
('Priya', 'Sharma', 'priya.sharma@example.com', 27, 'free', 'TechNova', 'Bangalore', 'IN', '2024-02-10 11:15:00'),
('James', 'O''Brien', 'james.obrien@example.com', 41, 'pro', 'CloudSync Ltd', 'London', 'GB', '2024-03-05 08:45:00'),
('Sofia', 'Martinez', 'sofia.m@example.com', 31, 'enterprise', 'Nexa Solutions', 'Mexico City', 'MX', '2024-03-12 16:20:00'),
('Liam', 'Nguyen', 'liam.nguyen@example.com', 25, 'free', NULL, 'Sydney', 'AU', '2024-03-20 10:00:00'),
('Elena', 'Volkov', 'elena.v@example.com', 38, 'pro', 'Aptive Systems', 'Berlin', 'DE', '2024-04-01 13:30:00'),
('Noah', 'Williams', 'noah.w@example.com', 30, 'free', 'Indie Dev Co', 'Austin', 'US', '2024-04-15 09:00:00'),
('Yuki', 'Tanaka', 'yuki.tanaka@example.com', 33, 'enterprise', 'Kaizenware', 'Tokyo', 'JP', '2024-05-02 07:45:00'),
('Amara', 'Okafor', 'amara.o@example.com', 28, 'pro', 'BrightPath', 'Lagos', 'NG', '2024-05-18 12:10:00'),
('Oliver', 'Smith', 'oliver.smith@example.com', 45, 'enterprise', 'Vertex Analytics', 'Toronto', 'CA', '2024-06-01 15:00:00'),
('Chloe', 'Dubois', 'chloe.d@example.com', 26, 'free', NULL, 'Paris', 'FR', '2024-06-14 11:30:00'),
('Mateo', 'Rossi', 'mateo.rossi@example.com', 37, 'pro', 'Piazza Digital', 'Milan', 'IT', '2024-07-01 08:20:00'),
('Zara', 'Ahmed', 'zara.ahmed@example.com', 32, 'enterprise', 'Pulse Technologies', 'Dubai', 'AE', '2024-07-20 14:45:00'),
('Ethan', 'Park', 'ethan.park@example.com', 29, 'free', 'Solo Ventures', 'Seoul', 'KR', '2024-08-05 10:15:00'),
('Isabella', 'Costa', 'isabella.c@example.com', 35, 'pro', 'Lumina Labs', 'São Paulo', 'BR', '2024-08-22 13:00:00'),
('Lucas', 'Müller', 'lucas.muller@example.com', 40, 'enterprise', 'Helix GmbH', 'Munich', 'DE', '2024-09-10 09:30:00'),
('Mia', 'Anderson', 'mia.anderson@example.com', 24, 'free', NULL, 'Portland', 'US', '2024-09-25 16:00:00'),
('Daniel', 'Kim', 'daniel.kim@example.com', 36, 'pro', 'Onyx Systems', 'Singapore', 'SG', '2024-10-08 07:00:00'),
('Emma', 'Taylor', 'emma.taylor@example.com', 42, 'enterprise', 'Cascade Analytics', 'Seattle', 'US', '2024-10-30 11:45:00');
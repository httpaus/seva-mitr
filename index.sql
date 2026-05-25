CREATE DATABASE sevamitra;
USE sevamitra;

-- Customers table
CREATE TABLE customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  password VARCHAR(255)
);

-- Professionals table
CREATE TABLE professionals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  service VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  password VARCHAR(255)
);

-- Bookings table
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  professional_id INT,
  service VARCHAR(100),
  booking_date DATE,
  status VARCHAR(50) DEFAULT 'Pending',
  amount DECIMAL(10,2),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (professional_id) REFERENCES professionals(id)
);
-- Builds the database the integration tests run against.
-- CI runs this on a throwaway MySQL server: mysql -uroot -proot < tests/integration/setup.sql
-- Schema matches the README. The DB user matches the new mysqli(...) call in api/*.php.

CREATE DATABASE IF NOT EXISTS COP4331;
USE COP4331;

CREATE TABLE IF NOT EXISTS Users (
  ID        INT NOT NULL AUTO_INCREMENT,
  firstName VARCHAR(50) NOT NULL DEFAULT '',
  lastName  VARCHAR(50) NOT NULL DEFAULT '',
  Login     VARCHAR(50) NOT NULL DEFAULT '',
  Password  VARCHAR(50) NOT NULL DEFAULT '',
  PRIMARY KEY (ID)
);

CREATE TABLE IF NOT EXISTS Colors (
  ID     INT NOT NULL AUTO_INCREMENT,
  Name   VARCHAR(50) NOT NULL DEFAULT '',
  UserID INT NOT NULL DEFAULT 0,
  PRIMARY KEY (ID)
);

-- Test login used by tests/integration/api.test.js
INSERT INTO Users (firstName, lastName, Login, Password)
SELECT 'Test', 'User', 'testuser', 'testpass'
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE Login = 'testuser');

CREATE USER IF NOT EXISTS 'TheBeast'@'localhost' IDENTIFIED BY 'WeLoveCOP4331';
GRANT ALL PRIVILEGES ON COP4331.* TO 'TheBeast'@'localhost';
FLUSH PRIVILEGES;

# COLORS Web Application

COP 4331, Dr. Aashish Yadavally

## Description

COLORS is a small web application built on a LAMP stack. A user logs in with a username and password, then can add colors to their personal list and search that list by name. Each user sees only the colors they have added.

## Technologies Used

- **Linux**: host operating system for the server
- **Apache**: web server that serves the frontend and runs the PHP API
- **MySQL**: database that stores users and their colors
- **PHP**: API endpoints (`api/`) that take JSON requests and return JSON responses
- **HTML / CSS / JavaScript**: frontend (`public/`); JavaScript calls the API with `XMLHttpRequest`

## Project Structure

```
api/              PHP endpoints
  Login.php         POST {login, password}   -> {id, firstName, lastName, error}
  AddColor.php      POST {color, userId}     -> {error}
  SearchColors.php  POST {search, userId}    -> {results: [...], error}
public/           Frontend served by Apache
  index.html        Login page
  color.html        Add/search colors page
  css/  js/  images/
docs/             Course setup guide
```

## Setup

1. **Server**: set up a Linux server with Apache, MySQL, and PHP (with the `mysqli` extension) installed.
2. **Database**: create the database and tables in MySQL:

   ```sql
   CREATE DATABASE COP4331;
   USE COP4331;

   CREATE TABLE Users (
     ID        INT NOT NULL AUTO_INCREMENT,
     firstName VARCHAR(50) NOT NULL DEFAULT '',
     lastName  VARCHAR(50) NOT NULL DEFAULT '',
     Login     VARCHAR(50) NOT NULL DEFAULT '',
     Password  VARCHAR(50) NOT NULL DEFAULT '',
     PRIMARY KEY (ID)
   );

   CREATE TABLE Colors (
     ID     INT NOT NULL AUTO_INCREMENT,
     Name   VARCHAR(50) NOT NULL DEFAULT '',
     UserID INT NOT NULL DEFAULT 0,
     PRIMARY KEY (ID)
   );

   INSERT INTO Users (firstName, lastName, Login, Password)
   VALUES ('Test', 'User', 'testuser', 'testpass');
   ```

3. **Database user**: create a MySQL user whose name and password match the ones in the `new mysqli(...)` call at the top of each file in `api/`, and grant it access to `COP4331`.
4. **Deploy files**: copy the contents of `public/` into Apache's web root (usually `/var/www/html`). Copy `api/` onto the server as well, e.g. to `/var/www/html/LAMPAPI`.
5. **Point the frontend at the API**: in `public/js/code.js`, set `urlBase` to your server's domain and the folder where you put the API:

   ```js
   const urlBase = 'http://your-domain.com/LAMPAPI';
   ```

## Running and Accessing the Application

1. Make sure Apache and MySQL are running on the server.
2. Open `http://your-domain.com/` in a browser. The live deployment is at `http://wilsonvuproject.xyz/`.
3. Log in with a user from the `Users` table, such as the test user above.
4. On the colors page, type a color and click **Add Color** to save it, or type part of a name and click **Search Color** to list your matching colors.
5. Click **Log Out** to end the session.

## Assumptions and Limitations

- **No registration**: users have to be added to the `Users` table directly in MySQL.
- **Add and search only**: colors can't be edited or deleted from the app.
- **Plaintext passwords**: passwords are stored and compared as plain text. The MD5 hashing in `code.js` is commented out.
- **Hardcoded credentials**: the database credentials are hardcoded in each PHP file and committed to the repository.
- **No HTTPS**: the site uses plain HTTP, so login details are sent unencrypted.
- **Short sessions**: login state lives in a browser cookie that expires after 20 minutes, and the API doesn't check who's calling it. It trusts whatever `userId` the client sends.
- **Same-server assumption**: the API and database are expected to run on the same server (`localhost`).
- **Duplicates allowed**: adding the same color twice creates two entries.

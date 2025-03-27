# Backend API with Express.js and MongoDB

## 1. Initialize Project
- [ ] Create project folder and initialize Node.js
  ```sh
  mkdir backend-api && cd backend-api
  npm init -y
  ```
- [ ] Install required dependencies:
  ```sh
  npm install express mongoose dotenv bcryptjs jsonwebtoken cors body-parser
  npm install --save-dev nodemon
  ```
- [ ] Configure `package.json` to use `nodemon`

## 2. Set Up Server with Express
- [ ] Create `server.js` file
- [ ] Set up Express app
- [ ] Connect to MongoDB using Mongoose
- [ ] Configure middleware: `body-parser`, `cors`

## 3. Define User Model
- [ ] Create `models` directory
- [ ] Create `User.js` file and define schema with fields:
  - `name`: String, required
  - `email`: String, unique, required
  - `password`: String, required (hashed with bcrypt)
  - `createdAt`: Date, default to current time

## 4. Implement User Registration API
- [ ] Create `routes` directory
- [ ] Create `authRoutes.js` file
- [ ] Create `POST /api/auth/register` route
  - Receive `name`, `email`, `password`
  - Check if email already exists
  - Hash password
  - Save user to database
  - Return JWT token

## 5. Implement User Login API
- [ ] Create `POST /api/auth/login` route
  - Receive `email`, `password`
  - Check if user exists
  - Validate password
  - Return JWT token

## 6. Security and Authentication
- [ ] Create `authMiddleware.js` middleware
- [ ] Validate JWT token in requests
- [ ] Use middleware for protected routes

## 7. Test API
- [ ] Use Postman or Thunder Client for testing
  - [ ] Register a user
  - [ ] Login and receive token
  - [ ] Send requests with token to verify authentication

## 8. Finalize
- [ ] Write `README.md` with API usage instructions
- [ ] Configure environment variables using dotenv
- [ ] Add logging and error handling

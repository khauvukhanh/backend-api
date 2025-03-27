# Backend API with Express.js and MongoDB

A RESTful API built with Express.js and MongoDB for user authentication.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/backend-api
   JWT_SECRET=your-super-secret-key
   ```
4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/register`
- Body:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- Body:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

#### Get User Profile
- **GET** `/api/auth/profile`
- Headers:
  ```
  Authorization: Bearer <token>
  ```

## Error Handling

The API returns appropriate HTTP status codes and error messages in the following format:
```json
{
  "message": "Error message here"
}
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Protected routes require a valid token in the Authorization header 
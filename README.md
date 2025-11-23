# Vendor Backend API

Complete Node.js backend for Flutter vendor app with **phone number + OTP authentication** (no passwords).

## 🚀 Tech Stack

- **Runtime**: Node.js >= 18
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (access tokens) + Opaque refresh tokens (hashed in DB)
- **Validation**: Joi
- **Security**: express-rate-limit, express-mongo-sanitize, helmet, CORS
- **Logging**: Pino
- **Testing**: Jest + Supertest
- **Deployment**: Vercel-ready (serverless)

## 📁 Project Structure

```
vendor-backend/
├── api/
│   └── index.js              # Vercel serverless wrapper
├── scripts/
│   ├── seed.js               # Database seeding
│   └── migrate.js            # Create indexes
├── src/
│   ├── config/
│   │   ├── env.js            # Environment configuration
│   │   └── db.js             # MongoDB connection with caching
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vendorController.js
│   │   ├── serviceController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   └── notificationController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── RefreshToken.js
│   │   ├── Vendor.js
│   │   ├── Service.js
│   │   ├── Order.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vendor.js
│   │   ├── service.js
│   │   ├── order.js
│   │   ├── payment.js
│   │   └── notification.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── validator.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── dtos/
│   │   ├── authDto.js
│   │   ├── vendorDto.js
│   │   ├── serviceDto.js
│   │   └── orderDto.js
│   ├── utils/
│   │   ├── logger.js
│   │   ├── phone.js
│   │   ├── token.js
│   │   ├── hash.js
│   │   ├── response.js
│   │   └── errors.js
│   ├── tests/
│   │   └── auth.test.js
│   ├── server.js             # Express app (exports for Vercel)
│   └── index.js              # Local dev server
├── .env.example
├── .gitignore
├── package.json
├── vercel.json
├── jest.config.js
├── docker-compose.yml
├── Dockerfile
└── README.md
```

## 🔧 Installation

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)

### Setup

1. **Clone or navigate to the project folder**

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/vendor_app
JWT_SECRET=your-super-secret-jwt-key
OTP_DUMMY_MODE=true
OTP_DUMMY_CODE=123456
```

4. **Create database indexes**
```bash
npm run migrate
```

5. **Seed sample data (optional)**
```bash
npm run seed
```

## 🏃 Running Locally

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production mode
```bash
npm start
```

### Run tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

Server will start at: `http://localhost:3000`

- **API Base**: `http://localhost:3000/api/v1`
- **API Docs**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/health`

## 🐳 Docker

### Run with Docker Compose

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- API server on port 3000

## 🔐 Authentication Flow

### 1. Send OTP
```http
POST /api/v1/auth/send-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

Response (dummy mode):
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "expiresIn": 600,
    "debugOtp": "123456"
  }
}
```

### 2. Verify OTP
```http
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456",
  "deviceId": "optional-device-id"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "8f7d2e1c3b4a5f6e7d8c9b0a1f2e3d4c...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "phone": "+1234567890",
      "role": "vendor",
      "phoneVerified": true
    }
  }
}
```

### 3. Use Access Token
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "8f7d2e1c3b4a5f6e7d8c9b0a1f2e3d4c..."
}
```

### 5. Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "8f7d2e1c3b4a5f6e7d8c9b0a1f2e3d4c..."
}
```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (revoke refresh token)
- `GET /api/v1/auth/me` - Get current user profile 🔒

### Vendors
- `POST /api/v1/vendors` - Create vendor profile 🔒
- `GET /api/v1/vendors/me` - Get my vendor profile 🔒
- `PUT /api/v1/vendors/:id` - Update vendor profile 🔒
- `GET /api/v1/vendors/:id` - Get vendor by ID
- `GET /api/v1/vendors` - List all vendors (with filters)

### Services
- `POST /api/v1/services` - Create service 🔒
- `GET /api/v1/services` - List services (with filters)
- `GET /api/v1/services/:id` - Get service by ID
- `PUT /api/v1/services/:id` - Update service 🔒
- `DELETE /api/v1/services/:id` - Delete service (soft delete) 🔒

### Orders
- `POST /api/v1/orders` - Create order 🔒
- `GET /api/v1/orders` - List orders 🔒
- `GET /api/v1/orders/:id` - Get order by ID 🔒
- `PATCH /api/v1/orders/:id/status` - Update order status 🔒

### Payments (Dummy)
- `POST /api/v1/payments/create` - Create payment intent 🔒
- `POST /api/v1/payments/webhook` - Payment webhook

### Notifications
- `GET /api/v1/notifications` - Get notifications 🔒
- `PATCH /api/v1/notifications/:id/read` - Mark as read 🔒
- `POST /api/v1/notifications/push` - Send push notification 🔒

🔒 = Requires authentication

## 🧪 cURL Examples

### 1. Send OTP
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'
```

### 2. Verify OTP & Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","otp":"123456"}'
```

### 3. Get Current User Profile
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Create Vendor Profile
```bash
curl -X POST http://localhost:3000/api/v1/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "businessName": "My Service Company",
    "description": "Professional services",
    "phone": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

### 5. Create Service
```bash
curl -X POST http://localhost:3000/api/v1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "House Cleaning",
    "description": "Professional cleaning service",
    "price": 99.99,
    "currency": "USD",
    "durationMinutes": 120,
    "category": "Cleaning"
  }'
```

### 6. List Services with Filters
```bash
curl -X GET "http://localhost:3000/api/v1/services?page=1&limit=10&status=active&minPrice=50&maxPrice=200" \
  -H "Content-Type: application/json"
```

## 🌐 Deployment to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Set environment variables in Vercel dashboard**
- `MONGO_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `OTP_DUMMY_MODE=false` (for production)

## 🔒 Security Features

- **Rate Limiting**: OTP endpoints limited to 3 requests per 10 minutes
- **JWT**: Access tokens expire in 15 minutes
- **Refresh Tokens**: Opaque tokens, hashed in database, 30-day expiry
- **Token Rotation**: Old refresh tokens revoked when new ones issued
- **Input Sanitization**: mongo-sanitize prevents NoSQL injection
- **Helmet**: Security headers
- **CORS**: Configurable origins
- **Phone Normalization**: E.164 format
- **OTP Hashing**: bcrypt with salt rounds

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/vendor_app` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `OTP_DUMMY_MODE` | Enable dummy OTP (no SMS) | `true` |
| `OTP_DUMMY_CODE` | Dummy OTP code | `123456` |
| `OTP_EXPIRY_MINUTES` | OTP validity | `10` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:3000` |

## 📊 Database Models

- **User**: phone, role, name, phoneVerified
- **OTP**: phone, otpHash, expiresAt, attempts
- **RefreshToken**: userId, tokenHash, expiresAt, deviceInfo
- **Vendor**: userId, businessName, address, status
- **Service**: vendorId, title, slug, price, status
- **Order**: vendorId, serviceId, userId, status, scheduledAt
- **Notification**: userId, title, message, read

## 🧩 Testing Credentials (Seed Data)

After running `npm run seed`:

- **Phone**: `+1234567890`
- **OTP** (dummy mode): `123456`

## 📖 API Documentation

Interactive Swagger docs available at:
```
http://localhost:3000/docs
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT

## 🆘 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ for Flutter developers**

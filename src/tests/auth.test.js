import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../src/server.js';
import User from '../src/models/User.js';
import OTP from '../src/models/OTP.js';
import RefreshToken from '../src/models/RefreshToken.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth API', () => {
  describe('POST /api/v1/auth/send-otp', () => {
    it('should send OTP successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone: '+1234567890' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('debugOtp');
      expect(res.body.data.debugOtp).toBe('123456');
    });

    it('should fail without phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should prevent duplicate OTP requests', async () => {
      const phone = '+1234567890';
      
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      expect(res.status).toBe(429);
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should verify OTP and create user', async () => {
      const phone = '+1234567890';
      
      // Send OTP first
      const otpRes = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const otp = otpRes.body.data.debugOtp;

      // Verify OTP
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.phone).toBe(phone);
    });

    it('should fail with invalid OTP', async () => {
      const phone = '+1234567890';
      
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp: '000000' });

      expect(res.status).toBe(401);
    });

    it('should fail with expired OTP', async () => {
      const phone = '+1234567890';
      
      // Create expired OTP manually
      const expiresAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await OTP.create({
        phone,
        otpHash: 'dummy',
        expiresAt,
        attempts: 0,
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp: '123456' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token', async () => {
      const phone = '+1234567890';
      
      // Login first
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp: '123456' });

      const { refreshToken } = loginRes.body.data;

      // Refresh token
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should get current user profile', async () => {
      const phone = '+1234567890';
      
      await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ phone });

      const loginRes = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ phone, otp: '123456' });

      const { accessToken } = loginRes.body.data;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.phone).toBe(phone);
    });

    it('should fail without token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });
  });
});

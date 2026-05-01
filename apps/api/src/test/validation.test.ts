import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app';

vi.mock('../lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        createdAt: new Date(),
      }),
    },
  },
}));

describe('API Validation', () => {
  describe('POST /api/v1/auth/signup - Validation', () => {
    it('should reject empty email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: '', password: 'Password1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'not-an-email', password: 'Password1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password without uppercase', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'password1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password without lowercase', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'PASSWORD1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password without number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'Password', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'Pa1', name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'Password1', name: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login - Validation', () => {
    it('should reject empty email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: '', password: 'Password1' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject empty password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
  });
});

describe('404 Handler', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('Auth Middleware', () => {
  it('should reject requests without auth token', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject invalid auth token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });

  it('should reject malformed auth header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'NotBearer token');

    expect(res.status).toBe(401);
  });
});

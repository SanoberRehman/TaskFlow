import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

beforeAll(() => {
  console.log('Test suite starting...');
});

afterAll(() => {
  console.log('Test suite finished.');
});

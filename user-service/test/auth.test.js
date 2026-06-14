const request = require('supertest');
const app = require('../index');

describe('User Service API', () => {
  test('POST /api/users/register - harus berhasil', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123456'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/users/login - harus berhasil', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: '123456'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/users/login - password salah', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
  });
});
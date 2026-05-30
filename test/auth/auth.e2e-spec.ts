import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { AppModule } from '../../src/app.module';

import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleFixture.createNestApplication();

    app.useGlobalFilters(
      new GlobalExceptionFilter(),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register a new user', async () => {
    const res = await request(
      app.getHttpServer(),
    )
      .post('/auth/register')
      .send({
        businessName: 'Test Business',

        name: 'Valeria',

        lastName: 'Torres',

        phone: '1234567890',

        email: `${Date.now()}@example.com`,

        password: '123456',
      });

    expect(res.status).toBe(201);

    expect(res.body.success).toBe(true);
  });

  it('should fail if email already exists', async () => {
    const email =
      `duplicate-${Date.now()}@example.com`;

    const payload = {
      businessName: 'Test Business',

      name: 'Valeria',

      lastName: 'Torres',

      phone: '1234567890',

      email,

      password: '123456',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(payload)
      .expect(201);

    const res = await request(
      app.getHttpServer(),
    )
      .post('/auth/register')
      .send(payload);

    expect(res.status).toBe(409);

    expect(res.body.success).toBe(false);

    expect(res.body.error).toBe(
      'CONFLICT',
    );
  });

  it('should login a user', async () => {
    const email =
      `login-${Date.now()}@gmail.com`;

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        businessName: 'Test Business',

        name: 'Valeria',

        lastName: 'Torres',

        phone: '1234567890',

        email,

        password: '123456',
      })
      .expect(201);

    const res = await request(
      app.getHttpServer(),
    )
      .post('/auth/login')
      .send({
        email,

        password: '123456',
      });

    expect(res.status).toBe(201);

    expect(res.body.success).toBe(true);

    expect(
      res.body.data.accessToken,
    ).toBeDefined();
  });

  it(
    'should fail if password does not match',
    async () => {
      const email =
        `wrong-pass-${Date.now()}@gmail.com`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          businessName:
            'Test Business',

          name: 'Valeria',

          lastName: 'Torres',

          phone: '1234567890',

          email,

          password: '123456',
        })
        .expect(201);

      const res = await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email,

          password: '1234567',
        });

      expect(res.status).toBe(401);

      expect(res.body.success).toBe(
        false,
      );
    },
  );

  it(
    'should fail if email does not exist',
    async () => {
      const res = await request(
        app.getHttpServer(),
      )
        .post('/auth/login')
        .send({
          email:
            `missing-${Date.now()}@example.com`,

          password: '123456',
        });

      expect(res.status).toBe(401);

      expect(res.body.success).toBe(
        false,
      );
    },
  );
});
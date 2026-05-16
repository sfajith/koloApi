import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { PrismaService } from 'src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';

describe('Conversations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let conversationId: string;
  let agentId: string;

beforeAll(async () => {
  const moduleFixture: TestingModule =
    await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

  app = moduleFixture.createNestApplication();

  prisma = moduleFixture.get(PrismaService);

  app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);

  app.useGlobalFilters(
    new GlobalExceptionFilter(),
  );

  await app.init();

  const email = `test-${Date.now()}@gmail.com`;

  const registerResponse = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      businessName: 'Test Business',
      name: 'John',
      lastName: 'Doe',
      phone: '3154733906',
      email,
      password: '123456',
    });
  
  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email,
      password: '123456',
    });

  accessToken = loginResponse.body.data.accessToken;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  const businessId = user!.businessId;

  const customer = await prisma.customer.create({
    data: {
      businessId,
      name: 'Test Customer',
      phone: '3001234567',
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      businessId,
      customerId: customer.id,
      status: 'ACTIVE'
    },
  });

  conversationId = conversation.id;

  const agent = await prisma.user.create({
  data: {
    businessId,
    name: 'Agent',
    lastName: 'Test',
    email: `agent-${Date.now()}@gmail.com`,
    password: 'hashed-password',
    phone: '3000000000',
    role: 'AGENT',
  },
});

agentId = agent.id;

});

afterAll(async () => {
  await app.close();
});

  it('should get all conversations', async () => {
    return request(app.getHttpServer())
      .get('/conversations')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);
  });

  it('should get conversation details', async () => {
    return request(app.getHttpServer())
      .get(`/conversations/${conversationId}`)
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);
  });

  it('should update conversation status', async () => {
    return request(app.getHttpServer())
      .patch(`/conversations/${conversationId}/status`)
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        status: 'ACTIVE',
      })
      .expect(200);
  });

  it('should assign agent to conversation', async () => {
    return request(app.getHttpServer())
      .patch(`/conversations/${conversationId}/assign`)
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        assignedUserId: agentId,
      })
      .expect(200);
  });

  it('should get conversation messages', async () => {
    return request(app.getHttpServer())
      .get(`/conversations/${conversationId}/messages`)
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);
  });

it('should create a message in conversation', async () => {
  return request(app.getHttpServer())
    .post(`/conversations/${conversationId}/message`)
    .set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
    .send({
      type: 'TEXT',
      content: 'Test message',
    })
    .expect(201);
});

it('should reject request without token', async () => {
  return request(app.getHttpServer())
    .get('/conversations')
    .expect(401);
});

it('should return 404 for non existing conversation', async () => {
  return request(app.getHttpServer())
    .get('/conversations/fake-id')
    .set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
    .expect(404);
});

it('should reject invalid status update', async () => {
  return request(app.getHttpServer())
    .patch(`/conversations/${conversationId}/status`)
    .set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
    .send({
      status: 'INVALID_STATUS',
    })
    .expect(400);
});

it('should reject message creation without type', async () => {
  return request(app.getHttpServer())
    .post(`/conversations/${conversationId}/message`)
    .set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
    .send({
      content: 'hello',
    })
    .expect(400);
});

it('should reject message creation without content', async () => {
  return request(app.getHttpServer())
    .post(`/conversations/${conversationId}/message`)
    .set(
      'Authorization',
      `Bearer ${accessToken}`,
    )
    .send({
      type: 'TEXT',
    })
    .expect(400);
});

it('should not allow access to another business conversation', async () => {
  const secondEmail = `second-${Date.now()}@gmail.com`;

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      businessName: 'Other Business',
      name: 'Jane',
      lastName: 'Doe',
      phone: '3154733907',
      email: secondEmail,
      password: '123456',
    });

  const loginResponse = await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      email: secondEmail,
      password: '123456',
    });

  const secondToken =
    loginResponse.body.data.accessToken;

  return request(app.getHttpServer())
    .get(`/conversations/${conversationId}`)
    .set(
      'Authorization',
      `Bearer ${secondToken}`,
    )
    .expect(404);
});
});
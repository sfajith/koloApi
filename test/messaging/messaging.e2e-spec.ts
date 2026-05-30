import request from 'supertest';

import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import {
  INestApplication,
} from '@nestjs/common';

import {
  Channel,
  MessageType,
  MessageDirection,
} from '@prisma/client';

import { AppModule } from '../../src/app.module';

import { PrismaService } from '../../src/prisma/prisma.service';

import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

describe('Messaging (e2e)', () => {
  let app: INestApplication;

  let prisma: PrismaService;

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

    prisma =
      moduleFixture.get(
        PrismaService,
      );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

beforeEach(async () => {
  await prisma.message.deleteMany();

  await prisma.conversation.deleteMany();

  await prisma.customerIdentity.deleteMany();

  await prisma.customer.deleteMany();

  await prisma.channelConnection.deleteMany();

  await prisma.user.deleteMany();

  await prisma.business.deleteMany();
});

  it('should process inbound whatsapp message', async () => {
    const business =
      await prisma.business.create({
        data: {
          name: 'Koloone Test',
          ownerId: 'owner-test',
        },
      });

    await prisma.channelConnection.create({
      data: {
        businessId: business.id,

        provider: Channel.WHATSAPP,

        externalAccountId:
          'phone-number-id-123',
      },
    });

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id:
                    'phone-number-id-123',
                },

                contacts: [
                  {
                    wa_id:
                      '573001112233',

                    profile: {
                      name:
                        'Valeria',
                    },
                  },
                ],

                messages: [
                  {
                    id: 'wamid-123',

                    from:
                      '573001112233',

                    timestamp:
                      '1716000000',

                    type: 'text',

                    text: {
                      body:
                        'Hola Koloone',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const response = await request(
      app.getHttpServer(),
    )
      .post('/webhook/whatsapp')
      .send(payload);

    expect(response.status).toBe(201);

    expect(
      response.body.received,
    ).toBe(true);

    const customers =
      await prisma.customer.findMany();

    expect(customers).toHaveLength(
      1,
    );

    expect(customers[0].name).toBe(
      'Valeria',
    );

    const identities =
      await prisma.customerIdentity.findMany();

    expect(
      identities,
    ).toHaveLength(1);

    expect(
      identities[0]
        .externalUserId,
    ).toBe('573001112233');

    const conversations =
      await prisma.conversation.findMany();

    expect(
      conversations,
    ).toHaveLength(1);

    expect(
      conversations[0].channel,
    ).toBe(
      Channel.WHATSAPP,
    );

    const messages =
      await prisma.message.findMany();

    expect(messages).toHaveLength(
      1,
    );

    expect(messages[0].type).toBe(
      MessageType.TEXT,
    );

    expect(
      messages[0].direction,
    ).toBe(
      MessageDirection.INBOUND,
    );

    expect(
      messages[0].content,
    ).toBe('Hola Koloone');
  });

  it('should ignore duplicate messages', async () => {
    const business =
      await prisma.business.create({
        data: {
          name: 'Koloone Test',
          ownerId: 'owner-test',
        },
      });

    await prisma.channelConnection.create({
      data: {
        businessId: business.id,

        provider: Channel.WHATSAPP,

        externalAccountId:
          'phone-number-id-123',
      },
    });

    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id:
                    'phone-number-id-123',
                },

                contacts: [
                  {
                    wa_id:
                      '573001112233',

                    profile: {
                      name:
                        'Valeria',
                    },
                  },
                ],

                messages: [
                  {
                    id: 'wamid-duplicate',

                    from:
                      '573001112233',

                    timestamp:
                      '1716000000',

                    type: 'text',

                    text: {
                      body:
                        'Hola',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await request(
      app.getHttpServer(),
    )
      .post('/webhook/whatsapp')
      .send(payload);

    await request(
      app.getHttpServer(),
    )
      .post('/webhook/whatsapp')
      .send(payload);

    const messages =
      await prisma.message.findMany();

    expect(messages).toHaveLength(
      1,
    );
  });
});
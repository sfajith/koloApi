import {
  Channel,
  MessageDirection,
  MessageType,
} from '@prisma/client';
import { jest } from '@jest/globals';
import { IncomingMessageService } from './incoming-message.service';

describe('IncomingMessageService', () => {
  let service: IncomingMessageService;

  let prisma: any;

  let logger: any;

  beforeEach(() => {
    prisma = {
      message: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },

      business: {
        findFirst: jest.fn(),
      },

      customerIdentity: {
        findUnique: jest.fn(),
      },

      customer: {
        create: jest.fn(),
      },

      conversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new IncomingMessageService(
      logger,
      prisma,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore duplicate messages', async () => {
    const event = {
      provider: Channel.WHATSAPP,
      externalMessageId: 'msg-123',
      externalUserId: '573001112233',
      externalAccountId: 'business-123',
      type: MessageType.TEXT,
      text: 'Hola',
    } as any;

    prisma.message.findUnique.mockResolvedValue({
      id: 'existing-message',
    });

    const result =
      await service.process(event);

    expect(
      prisma.message.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        externalMessageId: 'msg-123',
      },
    });

    expect(logger.warn).toHaveBeenCalled();

    expect(result).toEqual({
      received: true,
    });
  });

  it('should return when business is not found', async () => {
    const event = {
      provider: Channel.WHATSAPP,
      externalMessageId: 'msg-123',
      externalUserId: '573001112233',
      externalAccountId: 'business-123',
      type: MessageType.TEXT,
      text: 'Hola',
    } as any;

    prisma.message.findUnique.mockResolvedValue(
      null,
    );

    prisma.business.findFirst.mockResolvedValue(
      null,
    );

    const result =
      await service.process(event);

    expect(
      prisma.business.findFirst,
    ).toHaveBeenCalled();

    expect(logger.warn).toHaveBeenCalled();

    expect(result).toEqual({
      received: true,
    });
  });

  it('should create customer when identity does not exist', async () => {
    const event = {
      provider: Channel.WHATSAPP,
      externalMessageId: 'msg-123',
      externalUserId: '573001112233',
      externalAccountId: 'business-123',
      customerName: 'Valeria',
      customerPhone: '573001112233',
      type: MessageType.TEXT,
      text: 'Hola',
    } as any;

    prisma.message.findUnique.mockResolvedValue(
      null,
    );

    prisma.business.findFirst.mockResolvedValue({
      id: 'business-1',
    });

    prisma.customerIdentity.findUnique.mockResolvedValue(
      null,
    );

    prisma.customer.create.mockResolvedValue({
      id: 'customer-1',
    });

    prisma.conversation.findFirst.mockResolvedValue(
      null,
    );

    prisma.conversation.create.mockResolvedValue({
      id: 'conversation-1',
    });

    prisma.message.create.mockResolvedValue({
      id: 'message-1',
    });

    prisma.conversation.update.mockResolvedValue(
      {},
    );

    await service.process(event);

    expect(
      prisma.customer.create,
    ).toHaveBeenCalled();

    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'customer_created',
      }),
      'IncomingMessageService',
    );
  });

  it('should use existing customer identity', async () => {
    const event = {
      provider: Channel.WHATSAPP,
      externalMessageId: 'msg-123',
      externalUserId: '573001112233',
      externalAccountId: 'business-123',
      type: MessageType.TEXT,
      text: 'Hola',
    } as any;

    prisma.message.findUnique.mockResolvedValue(
      null,
    );

    prisma.business.findFirst.mockResolvedValue({
      id: 'business-1',
    });

    prisma.customerIdentity.findUnique.mockResolvedValue(
      {
        customer: {
          id: 'customer-1',
        },
      },
    );

    prisma.conversation.findFirst.mockResolvedValue(
      {
        id: 'conversation-1',
      },
    );

    prisma.message.create.mockResolvedValue({
      id: 'message-1',
    });

    prisma.conversation.update.mockResolvedValue(
      {},
    );

    await service.process(event);

    expect(
      prisma.customer.create,
    ).not.toHaveBeenCalled();
  });

  it('should save inbound message', async () => {
    const event = {
      provider: Channel.WHATSAPP,
      externalMessageId: 'msg-123',
      externalUserId: '573001112233',
      externalAccountId: 'business-123',
      type: MessageType.TEXT,
      text: 'Hola mundo',
    } as any;

    prisma.message.findUnique.mockResolvedValue(
      null,
    );

    prisma.business.findFirst.mockResolvedValue({
      id: 'business-1',
    });

    prisma.customerIdentity.findUnique.mockResolvedValue(
      {
        customer: {
          id: 'customer-1',
        },
      },
    );

    prisma.conversation.findFirst.mockResolvedValue(
      {
        id: 'conversation-1',
      },
    );

    prisma.message.create.mockResolvedValue({
      id: 'message-1',
    });

    prisma.conversation.update.mockResolvedValue(
      {},
    );

    await service.process(event);

    expect(
      prisma.message.create,
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationId:
          'conversation-1',

        externalMessageId:
          'msg-123',

        content: 'Hola mundo',

        direction:
          MessageDirection.INBOUND,

        type: MessageType.TEXT,
      }),
    });
  });
});
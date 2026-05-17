import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ConversationStatus,
  MessageDirection,
  Role,
} from '@prisma/client';

describe('ConversationsService', () => {
  let service: ConversationsService;

  const mockPrisma = {
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  const mockAdminUser = {
    sub: 'user-id',
    businessId: 'business-id',
    role: Role.ADMIN,
    email: 'admin@test.com',
  };

  const mockAgentUser = {
    sub: 'agent-id',
    businessId: 'business-id',
    role: Role.AGENT,
    email: 'agent@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ConversationsService,
          {
            provide: PrismaService,
            useValue: mockPrisma,
          },
          {
            provide: LoggerService,
            useValue: mockLogger,
          },
        ],
      }).compile();

    service = module.get<ConversationsService>(
      ConversationsService,
    );

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active conversations for admin', async () => {
      const conversations = [
        { id: '1' },
        { id: '2' },
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(
        conversations,
      );

      const result = await service.findAll(
        mockAdminUser,
      );

      expect(result).toEqual(conversations);

      expect(
        mockPrisma.conversation.findMany,
      ).toHaveBeenCalledWith({
        where: {
          businessId: mockAdminUser.businessId,
          status: ConversationStatus.ACTIVE,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          customer: true,
          assignedUser: true,
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });

    it('should only return assigned conversations for agent', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue(
        [],
      );

      await service.findAll(mockAgentUser);

      expect(
        mockPrisma.conversation.findMany,
      ).toHaveBeenCalledWith({
        where: {
          businessId: mockAgentUser.businessId,
          status: ConversationStatus.ACTIVE,
          assignedUserId: mockAgentUser.sub,
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          customer: true,
          assignedUser: true,
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a conversation', async () => {
      const conversation = {
        id: 'conversation-id',
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(
        conversation,
      );

      const result = await service.findOne(
        'conversation-id',
        mockAdminUser,
      );

      expect(result).toEqual(conversation);
    });

    it('should throw if conversation does not exist', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(
          'conversation-id',
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update conversation status', async () => {
      const updatedConversation = {
        id: 'conversation-id',
        status: ConversationStatus.CLOSED,
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(
        {
          id: 'conversation-id',
        },
      );

      mockPrisma.conversation.update.mockResolvedValue(
        updatedConversation,
      );

      const result = await service.updateStatus(
        'conversation-id',
        ConversationStatus.CLOSED,
        mockAdminUser,
      );

      expect(result).toEqual(updatedConversation);

      expect(
        mockPrisma.conversation.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'conversation-id',
        },
        data: {
          status: ConversationStatus.CLOSED,
        },
      });
    });

    it('should throw if conversation does not exist', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.updateStatus(
          'conversation-id',
          ConversationStatus.CLOSED,
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignAgent', () => {
    it('should assign an agent to a conversation', async () => {
      const updatedConversation = {
        id: 'conversation-id',
        assignedUserId: 'agent-id',
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(
        {
          id: 'conversation-id',
        },
      );

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'agent-id',
      });

      mockPrisma.conversation.update.mockResolvedValue(
        updatedConversation,
      );

      const result = await service.assignAgent(
        'conversation-id',
        'agent-id',
        mockAdminUser,
      );

      expect(result).toEqual(updatedConversation);
    });

    it('should throw if agent does not exist', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(
        {
          id: 'conversation-id',
        },
      );

      mockPrisma.user.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.assignAgent(
          'conversation-id',
          'agent-id',
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllMessages', () => {
    it('should return conversation messages', async () => {
      const messages = [
        { id: '1' },
        { id: '2' },
      ];

      mockPrisma.conversation.findFirst.mockResolvedValue(
        {
          messages,
        },
      );

      const result =
        await service.findAllMessages(
          'conversation-id',
          mockAdminUser,
        );

      expect(result).toEqual(messages);
    });

    it('should throw if conversation does not exist', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.findAllMessages(
          'conversation-id',
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createMessage', () => {
    it('should create a message', async () => {
      const dto = {
        type: 'TEXT' as any,
        content: 'hello world',
      };

      const createdMessage = {
        id: 'message-id',
        content: dto.content,
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(
        {
          id: 'conversation-id',
        },
      );

      mockPrisma.message.create.mockResolvedValue(
        createdMessage,
      );

      mockPrisma.conversation.update.mockResolvedValue(
        {},
      );

      const result = await service.createMessage(
        'conversation-id',
        dto,
        mockAdminUser,
      );

      expect(result).toEqual(createdMessage);

      expect(
        mockPrisma.message.create,
      ).toHaveBeenCalledWith({
        data: {
          conversationId: 'conversation-id',
          senderId: mockAdminUser.sub,
          type: dto.type,
          direction: MessageDirection.OUTBOUND,
          content: dto.content,
        },
      });
    });

    it('should throw if conversation does not exist', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.createMessage(
          'conversation-id',
          {
            type: 'TEXT' as any,
            content: 'hello',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
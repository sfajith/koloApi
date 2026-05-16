import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from 'src/common/logger/logger.service';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { ConversationStatus, MessageDirection, Prisma, Role } from '@prisma/client';
import { CreateMessageDto } from './dto/create-message.dto';


@Injectable()
export class ConversationsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService
  ) {}

  //findAll conversations for a business, if user is an agent, only return conversations assigned to them
  async findAll(user: JwtPayload) {
  
      this.logger.log(
      {
        event: 'Get all conversations request',
      },
      'ConversationsService',
    );

  const where: Prisma.ConversationWhereInput = {
  businessId: user.businessId,
  status: ConversationStatus.ACTIVE,
};

  if (user.role === Role.AGENT) {
    where.assignedUserId = user.sub;
  }

    const conversations = await this.prisma.conversation.findMany({
where,
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

    this.logger.log(
      {
        event: 'Get all conversations success',
      },
      'ConversationsService',
    );

    return conversations;
  }


//findOne conversation by id, if user is an agent, only return if assigned to them
  async findOne(conversationId: string,
  user: JwtPayload,) {
      const where: any = {
    id: conversationId,
    businessId: user.businessId,
  };

  const { sub } = user;

     this.logger.log(
      {
        event: 'findOne conversation request',
      },
      'ConversationsService',
    );
  
    // 🔥 restricción para agentes
  if (user.role === Role.AGENT) {
    where.assignedUserId = user.sub;
  }

  const conversation =
    await this.prisma.conversation.findFirst({
      where,
      include: {
        customer: true,
        assignedUser: true,
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

  if (!conversation) {
    throw new NotFoundException(
      'Conversation not found',
    );
  }

       this.logger.log(
      {
        event: 'findOne conversation success',
      },
      'ConversationsService',
    );

  return conversation;
  }

  async updateStatus(
  conversationId: string,
  status: ConversationStatus,
  user: JwtPayload,
) {
  const where: Prisma.ConversationWhereInput = {
    id: conversationId,
    businessId: user.businessId,
  };

  if (user.role === Role.AGENT) {
    where.assignedUserId = user.sub;
  }

  const conversation =
    await this.prisma.conversation.findFirst({
      where,
    });

  if (!conversation) {
    throw new NotFoundException(
      'Conversation not found',
    );
  }

  const updatedConversation =
    await this.prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        status,
      },
    });

  this.logger.log(
    {
      event: 'conversation_status_updated',
      conversationId,
      status,
    },
    'ConversationsService',
  );

  return updatedConversation;
}

async assignAgent(
  conversationId: string,
  assignedUserId: string,
  user: JwtPayload,
) {
  const where: Prisma.ConversationWhereInput = {
    id: conversationId,
    businessId: user.businessId,
  };

  const conversation =
    await this.prisma.conversation.findFirst({
      where,
    });

  if (!conversation) {
    throw new NotFoundException(
      'Conversation not found',
    );
  }

  const agent = await this.prisma.user.findFirst({
    where: {
      id: assignedUserId,
      businessId: user.businessId,
      role: Role.AGENT,
    },
  });

  if (!agent) {
    throw new NotFoundException(
      'Agent not found',
    );
  }

  const updatedConversation =
    await this.prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        assignedUserId,
        status: ConversationStatus.ACTIVE,
      },
    });

  this.logger.log(
    {
      event: 'conversation_agent_assigned',
      conversationId,
      assignedUserId,
    },
    'ConversationsService',
  );

  return updatedConversation;
}

async findAllMessages(conversationId: string, user: JwtPayload) {
const where: Prisma.ConversationWhereInput = {
  id: conversationId,
  businessId: user.businessId,
};

if (user.role === Role.AGENT) {
  where.assignedUserId = user.sub;
}

const conversation =
  await this.prisma.conversation.findFirst({
    where,
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

if (!conversation) {
  throw new NotFoundException(
    'Conversation not found',
  );
}

  this.logger.log(
    {
      event: 'conversation_meassages_retrieved',
      conversationId,
    },
    'ConversationsService',
  );

return conversation.messages;
}

// solo agentes asignados pueden crear mensajes en la conversación

async createMessage(
  conversationId: string,
  dto: CreateMessageDto,
  user: JwtPayload,
) {
  const where: Prisma.ConversationWhereInput = {
    id: conversationId,
    businessId: user.businessId,
  };

  // 🔥 agentes solo pueden escribir
  // en conversaciones asignadas a ellos
  if (user.role === Role.AGENT) {
    where.assignedUserId = user.sub;
  }

  const conversation =
    await this.prisma.conversation.findFirst({
      where,
    });

  if (!conversation) {
    throw new NotFoundException(
      'Conversation not found',
    );
  }

  const message =
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.sub,
        type: dto.type,
        direction: MessageDirection.OUTBOUND,
        content: dto.content,
      },
    });

  // 🔥 actualizar actividad conversación
  await this.prisma.conversation.update({
    where: {
      id: conversation.id,
    },
    data: {
      lastMessageAt: new Date(),
    },
  });

  this.logger.log(
    {
      event: 'message_created',
      conversationId,
      messageId: message.id,
    },
    'ConversationsService',
  );

  return message;
}

}

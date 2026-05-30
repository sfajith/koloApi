import {
  Injectable,
} from '@nestjs/common';

import {
  ConversationStatus,
  MessageDirection,
} from '@prisma/client';

import { LoggerService } from 'src/common/logger/logger.service';

import { PrismaService } from 'src/prisma/prisma.service';

import { IncomingMessageEvent } from '../interfaces/incoming-message.interface';

@Injectable()
export class IncomingMessageService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  async process(
    event: IncomingMessageEvent,
  ) {
    // =====================================
    // Idempotency
    // =====================================

    const existingMessage =
      await this.prisma.message.findUnique(
        {
          where: {
            externalMessageId:
              event.externalMessageId,
          },
        },
      );

    if (existingMessage) {
      this.logger.warn(
        {
          event: 'duplicate_message',

          externalMessageId:
            event.externalMessageId,
        },
        'IncomingMessageService',
      );

      return {
        received: true,
      };
    }

    // =====================================
    // Find business by channel connection
    // =====================================

    const business = await this.prisma.business.findFirst({
        where: {
          channels: {
            some: {
              provider:event.provider,

              externalAccountId:event.externalAccountId,
            },
          },
        },
      });

    if (!business) {
      this.logger.warn(
        {
          event: 'business_not_found',

          provider:
            event.provider,

          externalAccountId:
            event.externalAccountId,
        },
        'IncomingMessageService',
      );

      return {
        received: true,
      };
    }

    // =====================================
    // Find customer identity
    // =====================================

    const existingIdentity =
      await this.prisma.customerIdentity.findUnique(
        {
          where: {
            provider_externalUserId: {
              provider:event.provider,
              externalUserId:event.externalUserId,
            },
          },

          include: {
            customer: true,
          },
        },
      );

    // =====================================
    // Resolve customer
    // =====================================

    let customer;

    if (existingIdentity) {
      customer = existingIdentity.customer;
    } else {
      customer = await this.prisma.customer.create(
          {
            data: {
              businessId:business.id,
              name:event.customerName,
              phone:event.customerPhone,

              identities: {
                create: {
                  provider:event.provider,
                  externalUserId:event.externalUserId,
                  username:event.customerName,
                  phone:event.customerPhone,
                },
              },
            },
          },
        );

      this.logger.log(
        {
          event: 'customer_created',
          bussinessId:business.id,
          customerId:customer.id,
          provider:event.provider,
        },
        'IncomingMessageService',
      );
    }

    // =====================================
    // Find active conversation
    // =====================================

    const activeConversation =
      await this.prisma.conversation.findFirst(
        {
          where: {
            businessId:business.id,
            customerId:customer.id,

            status: {
              not:ConversationStatus.CLOSED,
            },
          },

          orderBy: {
            lastMessageAt: 'desc',
          },
        },
      );

    let conversation;

    // =====================================
    // Reuse active conversation
    // =====================================

    if (activeConversation) {
      conversation =activeConversation;
    } else {
      // =====================================
      // Find last conversation
      // =====================================

      const lastConversation =await this.prisma.conversation.findFirst(
          {
            where: {
              businessId:business.id,
              customerId:customer.id,
            },

            orderBy: {
              lastMessageAt: 'desc',
            },
          },
        );

      // =====================================
      // First conversation ever
      // =====================================

      if (!lastConversation) {
        this.logger.log(
          {
            event:
              'creating_first_conversation',
            customerId:customer.id,
            businessId:business.id,
          },
          'IncomingMessageService',
        );

        conversation = await this.prisma.conversation.create(
            {
              data: {
                businessId:business.id,
                customerId: customer.id,
                status:ConversationStatus.ACTIVE,
                channel: event.provider,
                lastMessageAt: new Date(),
              },
            },
          );
      } else {
        // =====================================
        // Conversation window logic
        // =====================================

        const THIRTY_DAYS =
          30 *
          24 *
          60 *
          60 *
          1000;

        const isOlderThan30Days =
          lastConversation.lastMessageAt &&
          Date.now() -
            lastConversation.lastMessageAt.getTime() >
            THIRTY_DAYS;

        // =====================================
        // Create new conversation
        // =====================================

        if (isOlderThan30Days) {
          this.logger.log(
            {
              event:
                'creating_new_conversation_after_30_days',

              customerId:
                customer.id,

              businessId:
                business.id,
            },
            'IncomingMessageService',
          );

          conversation =
            await this.prisma.conversation.create(
              {
                data: {
                  businessId: business.id,
                  customerId: customer.id,
                  status: ConversationStatus.ACTIVE,
                  channel: event.provider,
                  lastMessageAt:new Date(),
                },
              },
            );
        } else {
          // =====================================
          // Reopen recent conversation
          // =====================================

          this.logger.log(
            {
              event:'reopening_conversation',
              customerId:customer.id,
              businessId:business.id,
            },
            'IncomingMessageService',
          );

          conversation =await this.prisma.conversation.update(
              {
                where: {
                  id:
                    lastConversation.id,
                },

                data: {
                  status:ConversationStatus.ACTIVE,
                  lastMessageAt:new Date(),
                },
              },
            );
        }
      }
    }

    // =====================================
    // Save inbound message
    // =====================================

    const savedMessage =
      await this.prisma.message.create({
        data: {
          conversationId:conversation.id,
          senderId: null,
          content:event.text ?? null,
          type:event.type,
          direction:MessageDirection.INBOUND,
          externalMessageId:event.externalMessageId,
          mediaUrl:event.media?.url,
          mimeType:event.media?.mimeType,
          filename:event.media?.filename,
        },
      });

    // =====================================
    // Update conversation activity
    // =====================================

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
        event: 'message_saved',
        messageId:savedMessage.id,
        conversationId:conversation.id,
      },
      'IncomingMessageService',
    );

    return {
      received: true,
    };
  }
}
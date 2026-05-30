import { Injectable } from '@nestjs/common';
import {
  Channel,
  MessageDirection,
} from '@prisma/client';

import { IncomingMessageEvent } from '../../interfaces/incoming-message.interface';


@Injectable()
export class WhatsappMessageMapper {

  toPersistence(
    event: IncomingMessageEvent,
    conversationId: string,
  ) {
    return {
 
      conversationId,

      externalMessageId:event.externalMessageId,

      channel: event.provider,

      type: event.type,

      direction: MessageDirection.INBOUND,

      externalUserId:event.externalUserId,
      
      externalAccountId:event.externalAccountId,

      content: event.text || null,

      mediaUrl: event.media?.url || null,

      mediaMimeType:event.media?.mimeType || null,

      mediaFilename:event.media?.filename || null,

      createdAt: event.timestamp,
    };
  }
}
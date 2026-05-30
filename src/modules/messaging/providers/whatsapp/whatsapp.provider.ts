import { Injectable } from '@nestjs/common';
import { Channel, MessageType } from '@prisma/client';

import { MessagingProvider } from '../../interfaces/messaging-provider.interface';
import { IncomingMessageEvent } from '../../interfaces/incoming-message.interface';

@Injectable()
export class WhatsappProvider
  implements MessagingProvider
{
  async handleWebhook(
    payload: any,
  ): Promise<IncomingMessageEvent[]> {
    const events: IncomingMessageEvent[] = [];

    const entries = payload.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;

        const messages = value?.messages || [];
        const contacts = value?.contacts || [];

        for (const message of messages) {
          const contact = contacts.find(
            (c: any) =>
              c.wa_id === message.from,
          );

          const baseEvent = {
            provider: Channel.WHATSAPP,

            externalMessageId: message.id,

            externalUserId: message.from,

            externalAccountId: value?.metadata?.phone_number_id,

            customerName:contact?.profile?.name,

            customerPhone: message.from,

            timestamp: new Date(
              Number(message.timestamp) *
                1000,
            ),
          };

          // TEXT
          if (message.type === 'text') {
            events.push({
              ...baseEvent,
              type: MessageType.TEXT,
              text: message.text.body,
            });

            continue;
          }

          // IMAGE
          if (message.type === 'image') {
            events.push({
              ...baseEvent,
              type: MessageType.IMAGE,
              media: {
                url: message.image.id,
                mimeType:
                  message.image.mime_type,
              },
            });

            continue;
          }

          // DOCUMENT
          if (message.type === 'document') {
            events.push({
              ...baseEvent,
              type: MessageType.DOCUMENT,
              media: {
                url: message.document.id,
                mimeType:
                  message.document.mime_type,
                filename:
                  message.document.filename,
              },
            });

            continue;
          }

          // AUDIO
          if (message.type === 'audio') {
            events.push({
              ...baseEvent,
              type: MessageType.AUDIO,
              media: {
                url: message.audio.id,
                mimeType:
                  message.audio.mime_type,
              },
            });

            continue;
          }

          // VIDEO
          if (message.type === 'video') {
            events.push({
              ...baseEvent,
              type: MessageType.VIDEO,
              media: {
                url: message.video.id,
                mimeType:
                  message.video.mime_type,
              },
            });

            continue;
          }
        }
      }
    }

    return events;
  }
}
import {
  Channel,
  MessageType,
} from '@prisma/client';


export interface IncomingMessageEvent {
  provider: Channel;

  // negocio en plataforma externa
  externalAccountId: string;

  // usuario externo
  externalUserId: string;

  externalMessageId: string;

  customerName?: string;

  customerPhone?: string;

  type: MessageType;

  text?: string;

  media?: {
    url: string;
    mimeType?: string;
    filename?: string;
  };

  timestamp: Date;
}
import { Channel, MessageType } from '@prisma/client';

import { WhatsappProvider } from './whatsapp.provider';

describe('WhatsappProvider', () => {
  let provider: WhatsappProvider;

  beforeEach(() => {
    provider = new WhatsappProvider();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should map text messages correctly', async () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: 'business-123',
                },

                contacts: [
                  {
                    wa_id: '573001112233',

                    profile: {
                      name: 'Valeria',
                    },
                  },
                ],

                messages: [
                  {
                    id: 'wamid-123',

                    from: '573001112233',

                    timestamp: '1716880000',

                    type: 'text',

                    text: {
                      body: 'Hola Koloone',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result =
      await provider.handleWebhook(
        payload,
      );

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      provider: Channel.WHATSAPP,

      externalMessageId: 'wamid-123',

      externalUserId: '573001112233',

      externalAccountId: 'business-123',

      customerName: 'Valeria',

      customerPhone: '573001112233',

      type: MessageType.TEXT,

      text: 'Hola Koloone',

      timestamp: new Date(
        1716880000 * 1000,
      ),
    });
  });

  it('should map image messages correctly', async () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: {
                  phone_number_id: 'business-123',
                },

                contacts: [],

                messages: [
                  {
                    id: 'wamid-image',

                    from: '573001112233',

                    timestamp: '1716880000',

                    type: 'image',

                    image: {
                      id: 'media-123',

                      mime_type: 'image/jpeg',
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result =
      await provider.handleWebhook(
        payload,
      );

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual({
      provider: Channel.WHATSAPP,

      externalMessageId: 'wamid-image',

      externalUserId: '573001112233',

      externalAccountId: 'business-123',

      customerName: undefined,

      customerPhone: '573001112233',

      type: MessageType.IMAGE,

      media: {
        url: 'media-123',

        mimeType: 'image/jpeg',
      },

      timestamp: new Date(
        1716880000 * 1000,
      ),
    });
  });

  it('should return empty array for empty payload', async () => {
    const result =
      await provider.handleWebhook({});

    expect(result).toEqual([]);
  });

  it('should ignore unsupported message types', async () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'unsupported-1',

                    from: '573001112233',

                    timestamp: '1716880000',

                    type: 'sticker',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const result =
      await provider.handleWebhook(
        payload,
      );

    expect(result).toEqual([]);
  });
});
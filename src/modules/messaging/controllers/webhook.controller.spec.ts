import { Test, TestingModule } from '@nestjs/testing';

import { WebhookController } from './webhook.controller';

import { WhatsappProvider } from '../providers/whatsapp/whatsapp.provider';

import { IncomingMessageService } from '../services/incoming-message.service';

import { jest } from '@jest/globals';

import { ConfigService } from '@nestjs/config';

describe('WebhookController', () => {
  let controller: WebhookController;

  let whatsappProvider: WhatsappProvider;

  let incomingMessageService: IncomingMessageService;

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [WebhookController],

      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },

        {
          provide: WhatsappProvider,
          useValue: {
            handleWebhook: jest.fn(),
          },
        },

        {
          provide: IncomingMessageService,
          useValue: {
            process: jest.fn(),
          },
        },
      ],
      }).compile();

    controller =
      module.get<WebhookController>(
        WebhookController,
      );

    whatsappProvider =
      module.get<WhatsappProvider>(
        WhatsappProvider,
      );

    incomingMessageService =
      module.get<IncomingMessageService>(
        IncomingMessageService,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should process whatsapp events', async () => {
    const payload = {
      test: true,
    };

    const events = [
      {
        externalMessageId: 'msg-1',
      },

      {
        externalMessageId: 'msg-2',
      },
    ];

    jest
      .spyOn(
        whatsappProvider,
        'handleWebhook',
      )
      .mockResolvedValue(events as any);

    const processSpy = jest
      .spyOn(
        incomingMessageService,
        'process',
      )
      .mockResolvedValue({
        received: true,
             });

    const result =
      await controller.receiveWebhook(
        payload,
      );

    expect(
      whatsappProvider.handleWebhook,
    ).toHaveBeenCalledWith(payload);

    expect(processSpy).toHaveBeenCalledTimes(
      2,
    );

    expect(processSpy).toHaveBeenCalledWith(
      events[0],
    );

    expect(processSpy).toHaveBeenCalledWith(
      events[1],
    );

    expect(result).toEqual({
      received: true,
    });
  });
});
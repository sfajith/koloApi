import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import type { Response } from 'express';

import { WhatsappProvider } from '../providers/whatsapp/whatsapp.provider';

import { IncomingMessageService } from '../services/incoming-message.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly configService: ConfigService,

    private readonly whatsappProvider: WhatsappProvider,

    private readonly incomingMessageService: IncomingMessageService,
  ) {}

  @Get('whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,

    @Query('hub.verify_token') token: string,

    @Query('hub.challenge') challenge: string,

    @Res() res: Response,
  ) {
    const verifyToken =
      this.configService.get<string>(
        'WEBHOOK_VERIFY_TOKEN',
      );

    if (
      mode === 'subscribe' &&
      token === verifyToken
    ) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  }

  @Post('whatsapp')
  async receiveWebhook(
    @Body() body: any,
  ) {
    // provider convierte payload bruto
    // en eventos normalizados
    const events = await this.whatsappProvider.handleWebhook(
        body,
      );

    // core procesa eventos
    for (const event of events) {
      await this.incomingMessageService.process(
        event,
      );
    }

    return {
      received: true,
    };
  }
}
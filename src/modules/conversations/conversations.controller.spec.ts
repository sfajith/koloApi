import {
  CanActivate,
} from '@nestjs/common';

import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('ConversationsController', () => {
  let controller: ConversationsController;

  const mockConversationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    assignAgent: jest.fn(),
    findAllMessages: jest.fn(),
    createMessage: jest.fn(),
  };

  const mockGuard: CanActivate = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [ConversationsController],
        providers: [
          {
            provide: ConversationsService,
            useValue:
              mockConversationsService,
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue(mockGuard)
        .overrideGuard(RolesGuard)
        .useValue(mockGuard)
        .compile();

    controller =
      module.get<ConversationsController>(
        ConversationsController,
      );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
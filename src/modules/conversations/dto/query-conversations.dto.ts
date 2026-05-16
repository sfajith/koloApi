import {
  IsEnum,
  IsOptional,
} from 'class-validator';

import { ConversationStatus }
  from '@prisma/client';

export class QueryConversationsDto {

  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;
}
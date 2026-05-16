import {
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @IsNotEmpty()
  content: string;
}
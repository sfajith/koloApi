import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UpdateConversationStatusDto } from './dto/update-conversation.dto';
import { AssignConversationDto } from './dto/assign-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}
  
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(@CurrentUser() user: JwtPayload,) {
    return this.conversationsService.findAll(user);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.AGENT)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload,) {
    return this.conversationsService.findOne(id, user);
  }

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AGENT)
@Patch(':id/status')
status(
  @Param('id') id: string,
  @Body() dto: UpdateConversationStatusDto,
  @CurrentUser() user: JwtPayload,
) {
  return this.conversationsService.updateStatus(
    id,
    dto.status,
    user,
  );
}

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Patch(':id/assign')
assign(@Param('id') id: string, @Body() dto: AssignConversationDto, @CurrentUser() user: JwtPayload,) {
  return this.conversationsService.assignAgent(id, dto.assignedUserId, user);
}

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AGENT)
@Get(':id/messages')
findMessages(@Param('id') id: string, @CurrentUser() user: JwtPayload,) {
  return this.conversationsService.findAllMessages(id, user);  
}

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.AGENT)
@Post(':id/message')
createMessage(@Param('id') id: string, @Body() dto: CreateMessageDto, @CurrentUser() user: JwtPayload,) {
  return this.conversationsService.createMessage(id, dto, user);  

}
}

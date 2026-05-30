import { IncomingMessageEvent } from "./incoming-message.interface";

export interface MessagingProvider {
  handleWebhook(
    payload: any,
  ): Promise<IncomingMessageEvent[]>;
}
import { IProfile } from 'app/shared/model/profile.model';
import { IConversation } from 'app/shared/model/conversation.model';
import { MessageType } from 'app/shared/model/enumerations/message-type.model';

export interface IMessage {
  id?: number;
  rawContentContentType?: string | null;
  rawContent?: string | null;
  transcript?: string | null;
  timestamp?: string | null;
  messageType?: keyof typeof MessageType | null;
  profile?: IProfile | null;
  conversation?: IConversation | null;
}

export const defaultValue: Readonly<IMessage> = {};

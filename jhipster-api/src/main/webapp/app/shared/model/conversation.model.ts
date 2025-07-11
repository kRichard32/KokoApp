import { IProfile } from 'app/shared/model/profile.model';

export interface IConversation {
  id?: number;
  lastMessageID?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  conversationName?: string | null;
  profiles?: IProfile[] | null;
}

export const defaultValue: Readonly<IConversation> = {};

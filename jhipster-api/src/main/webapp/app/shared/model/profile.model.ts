import { IUser } from 'app/shared/model/user.model';
import { ITrait } from 'app/shared/model/trait.model';
import { IConversation } from 'app/shared/model/conversation.model';
import { Language } from 'app/shared/model/enumerations/language.model';

export interface IProfile {
  id?: number;
  language?: keyof typeof Language | null;
  user?: IUser | null;
  traits?: ITrait[] | null;
  messages?: IConversation[] | null;
}

export const defaultValue: Readonly<IProfile> = {};

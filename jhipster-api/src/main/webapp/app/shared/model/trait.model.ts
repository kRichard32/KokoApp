import { IProfile } from 'app/shared/model/profile.model';

export interface ITrait {
  id?: number;
  traitName?: string | null;
  profiles?: IProfile[] | null;
}

export const defaultValue: Readonly<ITrait> = {};

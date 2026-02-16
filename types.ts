
export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  text: string;
  timestamp: Date;
}

export enum NaylaTopic {
  EDUCATION = 'Education',
  EMOTIONAL_SUPPORT = 'Emotional Support',
  LIFE_COACHING = 'Life Coaching'
}

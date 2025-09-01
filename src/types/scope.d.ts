export type ProgressScope =
  | { type: 'me' }
  | { type: 'group'; groupId: string; shareMode: 'ReadOnly' | 'Editable' }


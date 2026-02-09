export type ChatMessageRecord = {
  id: string;
  role: ChatRole;
  title?: string;
  content?: string;
  sequence: number;
  createdAt: string;
};

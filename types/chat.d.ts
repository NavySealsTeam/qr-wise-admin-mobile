export type ChatMessageRecord = {
  id: string;
  role: ChatRole;
  title?: string;
  content?: string;
  sequence: number;
  createdAt: string;
};

export type ChatSession = ChatMessageRecord; // your current type for sessions list

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  chartType?: 'monthly-sales';
  status?: 'complete' | 'streaming' | 'error' | 'cancelled';
};

export type StreamEvent =
  | { event: 'status'; data: { phase?: string; message?: string } }
  | { event: 'session'; data: { sessionId?: string } }
  | {
      event: 'response_replace';
      data: {
        sessionId?: string;
        response?: string;
        reason?: 'validated_retry' | 'format_adjustment';
      };
    }
  | {
      event: 'formatting';
      data: {
        event?: string;
        type?: 'selected' | 'fallback' | 'validation_failure' | 'parity_mismatch';
        selectedFormat?: string;
        decisionReason?: string;
        fallbackReason?: string | null;
      };
    }
  | { event: 'token'; data: { token?: string } }
  | {
      event: 'done';
      data: { success?: boolean; sessionId?: string; cached?: boolean };
    }
  | { event: 'error'; data: { message?: string; code?: string } }
  | { event: 'debug'; data: Record<string, unknown> };

export class ApiError extends Error {
  code?: string;
  status: number;
  requestId?: string;

  constructor(params: { message: string; status: number; code?: string; requestId?: string }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get('content-type') || '';
  const requestId = response.headers.get('x-request-id') || undefined;

  if (contentType.includes('application/json')) {
    let payload: {
      error?: string;
      code?: string;
      message?: string;
      requestId?: string;
    };
    try {
      payload = (await response.json()) as {
        error?: string;
        code?: string;
        message?: string;
        requestId?: string;
      };
    } catch {
      return new ApiError({
        message: `Invalid JSON error payload (status ${response.status})`,
        status: response.status,
        code: 'INVALID_JSON_ERROR_PAYLOAD',
        requestId,
      });
    }

    const message = payload.error || payload.message || `Request failed with status ${response.status}`;
    return new ApiError({
      message,
      status: response.status,
      code: payload.code,
      requestId: payload.requestId || requestId,
    });
  }

  const text = await response.text();
  return new ApiError({
    message: text || `Request failed with status ${response.status}`,
    status: response.status,
    requestId,
  });
}

export function parseSSE(buffer: string): {
  events: { event: string; data: string }[];
  rest: string;
} {
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() || '';
  const events: { event: string; data: string }[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split('\n');
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length === 0) continue;
    events.push({ event, data: dataLines.join('\n') });
  }

  return { events, rest };
}

export function toStatusText(value: string): string {
  const normalized = value.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Generating response';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

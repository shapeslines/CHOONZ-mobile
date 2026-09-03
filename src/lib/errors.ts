export type ClientFailureKind =
  | 'configuration'
  | 'authentication'
  | 'network'
  | 'response';

/**
 * Structured error detail carried by the CHOONZ API on machine-readable 4xx
 * responses (P-S3 unlock 403 today; the proposed bot-orchestration 409 later).
 * A string `detail` maps to `{ code: 'unknown', message, extra: {} }`; every
 * key other than `code`/`message` lands in `extra` for feature decoders.
 */
export interface ApiErrorDetail {
  code: string;
  message: string;
  extra: Record<string, unknown>;
}

export class ChoonzClientError extends Error {
  readonly kind: ClientFailureKind;
  readonly status?: number;
  readonly detail?: ApiErrorDetail;

  constructor(kind: ClientFailureKind, message: string, status?: number, detail?: ApiErrorDetail) {
    super(message);
    this.name = 'ChoonzClientError';
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

export class ResponseDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResponseDecodeError';
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected failure.';
}

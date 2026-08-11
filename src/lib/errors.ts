export type ClientFailureKind =
  | 'configuration'
  | 'authentication'
  | 'network'
  | 'response';

export class ChoonzClientError extends Error {
  readonly kind: ClientFailureKind;
  readonly status?: number;

  constructor(kind: ClientFailureKind, message: string, status?: number) {
    super(message);
    this.name = 'ChoonzClientError';
    this.kind = kind;
    this.status = status;
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

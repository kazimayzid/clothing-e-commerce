import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export class ResponseBuilder {
  static success<T>(data: T, statusCode = 200, meta?: ApiResponse['meta']) {
    return NextResponse.json<ApiResponse<T>>(
      { success: true, data, meta },
      { status: statusCode }
    );
  }

  static error(message: string, statusCode = 400, code = 'BAD_REQUEST', details?: unknown) {
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: { code, message, details },
      },
      { status: statusCode }
    );
  }
}
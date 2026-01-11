import type { ErrorType, NetworkErrorType } from '..';

/**
 * 判断一个值是否是 Uint8Array
 * 由于NodeJS中的 Buffer 继承于 Uint8Array，所以，该函数【几乎】可代替Buffer.isBuffer
 */
export function isUint8Array(obj: any): boolean {
  if (!obj || !obj.constructor) return false;
  if (typeof Uint8Array === 'function') {
    return obj instanceof Uint8Array;
  }
  return typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
}

/**
 * 判断一个值是可读流
 */
export function isReadableStream(value: any): boolean {
  return value && typeof value.pipe === 'function' && value.readable !== false;
}

/**
 * 判断一个值是浏览器环境中的File/Blob
 */
export function isFile(value: any): boolean {
  if (typeof Blob === 'function' && value instanceof Blob) return true;
  return value && typeof value.slice === 'function' && value.size && value.lastModified;
}

/**
 * Akita 统一错误类
 */
export class AkitaError extends Error {
  type: ErrorType;
  code: string;
  networkType?: NetworkErrorType;
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
  cause?: Error;
  timestamp?: number;

  constructor(
    message: string,
    type: ErrorType,
    code: string,
    options?: {
      networkType?: NetworkErrorType;
      status?: number;
      statusText?: string;
      url?: string;
      method?: string;
      cause?: Error;
      timestamp?: number;
    }
  ) {
    super(message);
    this.name = 'AkitaError';
    this.type = type;
    this.code = code;
    if (options) {
      Object.assign(this, options);
    }
  }
}

// ========== 网络错误检测 ==========

// eslint-disable-next-line complexity
export function detectNetworkErrorType(error: Error): NetworkErrorType {
  const message = (error.message || '').toLowerCase();
  const name = (error.name || '').toLowerCase();

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('请求超时') ||
    name.includes('timeout') ||
    name.includes('aborted')
  ) {
    return 'timeout';
  }

  if (
    message.includes('enotfound') ||
    message.includes('getaddrinfo') ||
    message.includes('dns') ||
    message.includes('could not resolve') ||
    message.includes('域名解析失败') ||
    message.includes('name resolution failed')
  ) {
    return 'dns_failed';
  }

  if (
    message.includes('cors') ||
    message.includes('cross-origin') ||
    message.includes('access control allow origin') ||
    message.includes('blocked by cors')
  ) {
    return 'cors';
  }

  if (
    message.includes('econnrefused') ||
    message.includes('connection refused') ||
    message.includes('connection reset') ||
    message.includes('econnreset')
  ) {
    return 'connection_refused';
  }

  if (
    message.includes('enetunreachable') ||
    message.includes('network unreachable') ||
    message.includes('unreachable')
  ) {
    return 'network_unreachable';
  }

  if (
    message.includes('offline') ||
    message.includes('no internet') ||
    (message.includes('network') && message.includes('not available'))
  ) {
    return 'offline';
  }

  if (message.includes('fail timeout')) {
    return 'timeout';
  }

  if (message.includes('fail no connection')) {
    return 'offline';
  }

  if (message.includes('fail dns')) {
    return 'dns_failed';
  }

  return 'unknown';
}

// ========== 错误创建工厂 ==========

export function createNetworkError(originalError: Error, method: string, url: string): AkitaError {
  const networkType = detectNetworkErrorType(originalError);

  return new AkitaError(originalError.message, 'network', `NETWORK_${networkType.toUpperCase()}`, {
    networkType,
    url,
    method,
    cause: originalError as Error,
    timestamp: Date.now()
  });
}

export function createHTTPError(status: number, statusText: string, method: string, url: string): AkitaError {
  return new AkitaError(`HTTP ${status}: ${statusText}`, 'http', `HTTP_${status}`, {
    status,
    statusText,
    url,
    method,
    timestamp: Date.now()
  });
}

export function createParseError(originalError: Error, method: string, url: string, format: string): AkitaError {
  return new AkitaError(
    `Failed to parse ${format} response: ${originalError.message}`,
    'parse',
    `PARSE_${format.toUpperCase()}_ERROR`,
    {
      url,
      method,
      cause: originalError,
      timestamp: Date.now()
    }
  );
}

export function createServerError(method: string, url: string, serverData: any): AkitaError {
  return new AkitaError(serverData.error, 'server', serverData.code || 'SERVER_ERROR', {
    url,
    method,
    timestamp: Date.now()
  });
}

// ========== 类型判断函数 ==========

export function isAkitaError(error: any): error is AkitaError {
  return error instanceof AkitaError;
}

export function isNetworkError(error: any): error is AkitaError {
  return error instanceof AkitaError && error.type === 'network';
}

export function isHTTPError(error: any): error is AkitaError {
  return error instanceof AkitaError && error.type === 'http';
}

export function isParseError(error: any): error is AkitaError {
  return error instanceof AkitaError && error.type === 'parse';
}

export function isServerError(error: any): error is AkitaError {
  return error instanceof AkitaError && error.type === 'server';
}

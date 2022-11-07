/**
 * 判断一个值是否是 Uint8Array
 * 由于NodeJS中的 Buffer 继承于 Uint8Array，所以，该函数【几乎】可代替Buffer.isBuffer
 */
export function isUint8Array(obj: any): boolean {
  if (!obj || !obj.constructor) return false;
  if (typeof Uint8Array === 'function') {
    return obj instanceof Uint8Array;
  }
  // 如果Uint8Array不存在，尝试判断isBuffer
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

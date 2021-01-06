import * as os from 'os';
import * as fs from 'fs';
import * as Path from 'path';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';
import * as Busboy from 'busboy';
import { Context } from 'koa';

export interface UploadFile extends Readable {
  fieldname: string;
  filename: string;
  encoding: string;
  transferEncoding: string;
  mime: string;
  mimeType: string;
}

export interface UploadMiddlewareConfig {
  /**
   * 上传文件存放地址，默认为系统临时目录
   */
  tmpDir?: string;

  highWaterMark?: number;
  fileHwm?: number;
  defCharset?: string;
  preservePath?: boolean;
  limits?: {
    fieldNameSize?: number;
    fieldSize?: number;
    fields?: number;
    fileSize?: number;
    files?: number;
    parts?: number;
    headerPairs?: number;
  };
}

/**
 *
 * Extract a hierarchy array from a stringified formData single input.
 *
 *
 * i.e. topLevel[sub1][sub2] => [topLevel, sub1, sub2]
 *
 * @param  {String} string: Stringify representation of a formData Object
 * @return {Array}
 *
 */
function extractFormData(string: string) {
  const arr = string.split('[');
  const first = arr.shift();
  const res = arr.map((v) => v.split(']')[0]);
  res.unshift(first);
  return res;
}

/**
 *
 * Generate an object given an hierarchy blueprint and the value
 *
 * i.e. [key1, key2, key3] => { key1: {key2: { key3: value }}};
 *
 * @param  {Array} arr:   from extractFormData
 * @param  {[type]} value: The actual value for this key
 * @return {[type]}       [description]
 *
 */
function objectFromBluePrint(arr: any[], value: any) {
  return arr.reverse().reduce((acc, next) => {
    if (Number(next).toString() === 'NaN') {
      return { [next]: acc };
    } else {
      const newAcc = [];
      newAcc[Number(next)] = acc;
      return newAcc;
    }
  }, value);
}

/**
 * Reconciles formatted data with already formatted data
 *
 * @param  {Object} obj extractedObject
 * @param  {Object} target the field object
 * @return {Object} reconciled fields
 *
 */
function reconcile(obj: any, target: any): any {
  const key = Object.keys(obj)[0];
  const val = obj[key];

  // The reconciliation works even with array has
  // Object.keys will yield the array indexes
  // see https://jsbin.com/hulekomopo/1/
  // Since array are in form of [ , , valu3] [value1, value2]
  // the final array will be: [value1, value2, value3] has expected
  if (target.hasOwnProperty(key)) {
    return reconcile(val, target[key]) as any;
  }
  target[key] = val;
  return val;
}

function parse(req: IncomingMessage, config: UploadMiddlewareConfig) {
  return new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: req.headers });
    const fields: any = {};
    const promises: Promise<UploadFile>[] = [];

    busboy.on('field', (fieldname, value) => {
      if (fieldname.indexOf('[') > -1) {
        const obj = objectFromBluePrint(extractFormData(fieldname), value);
        reconcile(obj, fields);
      } else {
        if (fields.hasOwnProperty(fieldname)) {
          if (Array.isArray(fields[fieldname])) {
            fields[fieldname].push(value);
          } else {
            fields[fieldname] = [fields[fieldname], value];
          }
        } else {
          fields[fieldname] = value;
        }
      }
    });

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      const tmpName = `${Math.random().toString(16).substring(2)}-${filename}`;
      // @ts-ignore
      file.tmpName = tmpName;
      const path = Path.join(config.tmpDir || os.tmpdir(), Path.basename(tmpName));
      const writeStream = fs.createWriteStream(path);
      let promise = new Promise<UploadFile>((success, failed) => {
        writeStream
          .on('open', () =>
            file
              .pipe(writeStream)
              .on('error', failed)
              .on('finish', () => {
                const readStream: UploadFile = fs.createReadStream(path) as any;
                readStream.fieldname = fieldname;
                readStream.filename = filename;
                readStream.encoding = encoding;
                readStream.transferEncoding = encoding;
                readStream.mimeType = mimetype;
                readStream.mime = mimetype;
                success(readStream);
              })
          )
          .on('error', (err) => {
            file.resume().on('error', failed);
            failed(err);
          });
      });
      promises.push(promise);
    });

    function onError(error: Error) {
      busboy.removeAllListeners();
      reject(error);
    }

    busboy.on('partsLimit', function () {
      const err = new Error('Reach parts limit');
      // @ts-ignore
      err.code = 'Request_parts_limit';
      // @ts-ignore
      err.status = 413;
      onError(err);
    });

    busboy.on('filesLimit', () => {
      const err = new Error('Reach files limit');
      // @ts-ignore
      err.code = 'Request_files_limit';
      // @ts-ignore
      err.status = 413;
      onError(err);
    });

    busboy.on('fieldsLimit', () => {
      const err = new Error('Reach fields limit');
      // @ts-ignore
      err.code = 'Request_fields_limit';
      // @ts-ignore
      err.status = 413;
      onError(err);
    });

    busboy.on('error', onError);

    busboy.on('finish', () => {
      Promise.all(promises).then((files) => {
        busboy.removeAllListeners();
        resolve({ fields, files });
      }, onError);
    });

    req.pipe(busboy);
  });
}

export default function (config: UploadMiddlewareConfig = {}): any {
  return async function (ctx: Context, next: Function) {
    if (typeof ctx.files === 'undefined' && ctx.request.is('multipart/*')) {
      const res: any = await parse(ctx.req, config);
      const files = res.files;
      const fields = res.fields;
      ctx.files = {};
      files.forEach((file: UploadFile) => {
        let fieldname = file.fieldname;
        if (ctx.files[fieldname]) {
          if (Array.isArray(ctx.files[fieldname])) {
            (ctx.files[fieldname] as UploadFile[]).push(file);
          } else {
            ctx.files[fieldname] = [ctx.files[fieldname] as UploadFile, file];
          }
        } else {
          ctx.files[fieldname] = file;
        }
      });
      // @ts-ignore
      ctx.request.body = fields;
    }
    await next();
  };
}

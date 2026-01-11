// @ts-ignore
import fetch from 'node-fetch';
import FormData from 'form-data';
import inject from './inject';

export { AkitaError, isAkitaError, isNetworkError, isHTTPError, isParseError, isServerError } from './utils';

export default inject(fetch, FormData, 'Akita/1.2.0 (+https://github.com/liangxingchen/akita)');

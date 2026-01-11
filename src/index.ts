// 微信小程序入口

import fetch from './fetch';
import FormData from './form-data';
import inject from './inject';

export { AkitaError, isAkitaError, isNetworkError, isHTTPError, isParseError, isServerError } from './utils';

export default inject(fetch, FormData);

/* eslint no-use-before-define:0 */

import * as fetch from 'node-fetch';
import * as FormData from 'form-data';
import inject from './inject';

export default inject(fetch, FormData, 'Akita/1.0.2 (+https://github.com/liangxingchen/akita)');

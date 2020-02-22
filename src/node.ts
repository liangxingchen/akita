/* eslint no-use-before-define:0 */

import * as fetch from 'node-fetch-unix';
import * as FormData from 'form-data';
import { Model } from './client';
import inject from './inject';

export default inject(fetch, FormData, 'Akita/0.8.2 (+https://github.com/maichong/akita)');
export { Model };

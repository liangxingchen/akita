/* eslint no-use-before-define:0 */

import fetch = require('node-fetch-unix');
import FormData = require('form-data');
import { Model } from './client';
import inject from './inject';

export default inject(fetch, FormData, 'Akita/0.7.1 (+https://github.com/maichong/akita)');
export { Model };

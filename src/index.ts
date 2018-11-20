// just for weixin

import fetch from './fetch';
import FormData from './form-data';
import { Model } from './client';
import inject from './inject';

export default inject(fetch, FormData);
export { Model };

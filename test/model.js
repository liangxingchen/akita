import 'babel-polyfill';
import test from 'tape';
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: '/api'
});

class Blog extends Model {
  static client = client;
  static path = 'blog';
}

// test('Model', (troot) => {
//   troot.test('Blog.find()', async (t) => {
//     let blogs = await Blog.find();
//     t.end();
//   });
//   troot.end();
// });

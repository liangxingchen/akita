import 'babel-polyfill';
import test from 'tape';
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: '/api'
});

class Blog extends Model {
  static client = client;
  static path = 'blog';

  // POST /api/blog/123/active
  active() {
    return this.post('active', {
      body: {
        active: true
      }
    }, true);
  }
}

test('Model', (troot) => {
  troot.test('Blog.find()', async (t) => {
    let blogs = await Blog.find().inspect();
    console.log('blogs', blogs);
    t.end();
  });
  troot.test('blog.active()', async (t) => {
    let blog = new Blog({ id: 123, title: 'Hello' });
    let res = blog.active();
    console.log('res', res);
    t.end();
  });
  troot.end();
});

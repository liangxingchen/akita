import test from 'tape';
import akita from '../src/node';

test('Inject - newCreate 无参分支', (troot) => {
  troot.test('create() 无参时 options 默认为 {}', (t) => {
    // @ts-ignore 故意不传参以覆盖 newCreate 的 options = options || {} 分支
    const client = akita.create();
    t.ok(client);
    t.ok(client.options);
    t.ok(client.options.fetch);
    t.ok(client.options.FormData);
    t.end();
  });

  troot.test('create({}) 显式空对象', (t) => {
    const client = akita.create({});
    t.ok(client);
    t.ok(client.options.fetch);
    t.ok(client.options.FormData);
    t.end();
  });

  troot.test('resolve 新实例注入 fetch/FormData', (t) => {
    const client = akita.resolve('inject-test-key');
    t.ok(client.options.fetch);
    t.ok(client.options.FormData);
    t.end();
  });

  troot.end();
});

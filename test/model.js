import 'babel-polyfill';
import test from 'tape';
import akita, { Model } from '../src/node';

const client = akita.create({
  apiRoot: 'https://api.github.com'
});

class Branch extends Model {
  static client = client;
  static path = '/repos/:owner/:repo/branches';
  static pk = 'name';

  getProtection() {
    return this.get('protection', null, true);
  }
}

test('Model', (troot) => {
  troot.test('Branch.find()', async (t) => {
    t.deepEqual(
      Branch.find({ owner: 'maichong', repo: 'akita' }).inspect(),
      { method: 'GET', url: 'https://api.github.com/repos/maichong/akita/branches' }
    );
    t.end();
  });

  troot.test('Branch.findById()', async (t) => {
    let branch = await Branch.findById('master')
      .where({ owner: 'maichong', repo: 'akita' });
    t.equal(branch.name, 'master');
    t.end();
  });

  troot.test('record action', async (t) => {
    let branch = new Branch({ owner: 'maichong', repo: 'akita', name: 'master' });
    t.deepEqual(
      branch.getProtection(),
      {
        method: 'GET',
        url: 'https://api.github.com/repos/maichong/akita/branches/master/protection'
      }
    );
    t.end();
  });
  troot.end();
});

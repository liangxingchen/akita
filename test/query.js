/**
 * query
 * @copyright Maichong Software Ltd. 2017 http://maichong.it
 * @date 2017-01-19
 * @author Lei <zhao@maichong.it>
 */

'use strict';

const fetch = require('node-fetch');
const client = require('../lib/client');

client.setOptions({ fetch });

describe('Query', function () {

  it('test findOne', function (done) {
    client('https://httpbin.org/get?path=object').findOne(1).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%2F1') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-findOne-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test find', function (done) {
    client('https://httpbin.org/get?path=object').find().then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object') {
        return done(new Error('error:' + res.url));
      }
      done();
    }, error => {
      console.log('test-find-error:', error);
      done();
    });
  });

  it('test find {foot:1}', function (done) {
    client('https://httpbin.org/get?path=object').find({ params: { foo: 1 } }).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffoo=1') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-find-error:', error);
      done();
    });
  });
});

describe('Query', function () {

  it('test where Object', function (done) {
    client('https://httpbin.org/get?path=object').where({ foo: 1 }).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[foo]=1') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-error:', error);
      done();
    });
  });

  it('test where String', function (done) {
    client('https://httpbin.org/get?path=object').where('foo', 2).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[foo]=2') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-String-error:', error);
      done();
    });
  });

  it('test where eq', function (done) {
    client('https://httpbin.org/get?path=object').where('age').eq(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-eq-error:', error);
      done();
    });
  });

  it('test where equals', function (done) {
    client('https://httpbin.org/get?path=object').where('age').equals(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-equals-error:', error);
      done();
    });
  });

  it('test where lt', function (done) {
    client('https://httpbin.org/get?path=object').where('age').lt(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age][lt]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-lt-error:', error);
      done();
    });
  });

  it('test where lte', function (done) {
    client('https://httpbin.org/get?path=object').where('age').lte(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age][lte]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-lte-error:', error);
      done();
    });
  });

  it('test where gt', function (done) {
    client('https://httpbin.org/get?path=object').where('age').gt(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age][gt]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-gt-error:', error);
      done();
    });
  });

  it('test where gte', function (done) {
    client('https://httpbin.org/get?path=object').where('age').gte(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Ffilters[age][gte]=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-where-gte-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test limit', function (done) {
    client('https://httpbin.org/get?path=object').limit(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3FperPage=12') {
        return done(new Error('error:' + res.url));
      }
      done();
    }, error => {
      console.log('test-limit-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test page', function (done) {
    client('https://httpbin.org/get?path=object').page(12).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Fpage=12') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-page-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test sort', function (done) {
    client('https://httpbin.org/get?path=object').sort('-creatAt').then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=object%3Fsort=-creatAt') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.log('test-sort-error:', error);
      done();
    });
  });
});


describe('Query', function () {
  it('test create', function (done) {
    client('https://httpbin.org/post?path=create').create({ foo: 2 }).then((res) => {
      if (res.data !== '{"foo":2}' || res.headers['Content-Type'] !== 'application/json') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-create-error:', error);
      done();
    });
  });
  it('test create', function (done) {
    client('https://httpbin.org/post?path=create').create({ body: { foo: 2 } }).then((res) => {
      if (res.data !== '{"foo":2}' || res.headers['Content-Type'] !== 'application/json') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-create-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test count ', function (done) {
    client('https://httpbin.org/get?path=count').count({ foo: 2 }).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=count%3Ffoo=2') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-count-error:', error);
      done();
    });
  });
  it('test count params', function (done) {
    client('https://httpbin.org/get?path=count').count({ params: { foo: 2 } }).then((res) => {
      if (res.url !== 'https://httpbin.org/get?path=count%3Ffoo=2') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-count-params-error:', error);
      done();
    });
  });
});


describe('Query', function () {
  it('test update {foo: 2}', function (done) {
    client('https://httpbin.org/put?path=object').update({ foo: 2 }).then((res) => {
      if (res.url !== 'https://httpbin.org/put?path=object') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-update-error:', error);
      done();
    });
  });
  it('test update {foo: 2}', function (done) {
    client('https://httpbin.org/put?path=object').update({ body: { foo: 2 } }).then((res) => {
      if (res.url !== 'https://httpbin.org/put?path=object') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-update-error:', error);
      done();
    });
  });

  it('test update id', function (done) {
    client('https://httpbin.org/put?path=object').update('123', { foo: 2 }).then((res) => {
      if (res.url !== 'https://httpbin.org/put?path=object%2F123') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-update-error:', error);
      done();
    });
  });
});

describe('Query', function () {
  it('test remove', function (done) {
    client('https://httpbin.org/delete?path=object').remove().then((res) => {
      if (res.url !== 'https://httpbin.org/delete?path=object') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-remove-error:', error);
      done();
    });
  });
  it('test remove object', function (done) {
    client('https://httpbin.org/delete?path=object').remove({ foo: 2 }).then((res) => {
      if (res.url !== 'https://httpbin.org/delete?path=object') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-remove-object-error:', error);
      done();
    });
  });
  it('test remove params object', function (done) {
    client('https://httpbin.org/delete?path=object').remove({ body: { foo: 2 } }).then((res) => {
      if (res.url !== 'https://httpbin.org/delete?path=object') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-remove-params-object-error:', error);
      done();
    });
  });
  it('test remove string', function (done) {
    client('https://httpbin.org/delete?path=object').remove('123').then((res) => {
      if (res.url !== 'https://httpbin.org/delete?path=object%2F123') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-remove-string-error:', error);
      done();
    });
  });
  it('test remove number', function (done) {
    client('https://httpbin.org/delete?path=object').remove(123).then((res) => {
      if (res.url !== 'https://httpbin.org/delete?path=object%2F123') {
        return done(new Error('error'));
      }
      done();
    }, error => {
      console.error('test-remove-number-error:', error);
      done();
    });
  });
});

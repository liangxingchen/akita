/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-12-26
 * @author Liang <liang@maichong.it>
 */

'use strict';

const fetch = require('node-fetch');
const client = require('../lib/client');

client.setOptions({ fetch });

describe('HTTP', function () {

    it('test1 get', function (done) {
        client.get('https://httpbin.org/get').then((res) => {
            if (!res) {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test2 params', function (done) {
        client.get('https://httpbin.org/get', { params: { foo: { bar: 'baz' } } }).then((res) => {
            if (res.url !== 'https://httpbin.org/get?foo[bar]=baz') {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test3 headers', function (done) {
        client.get('https://httpbin.org/get', { headers: { foo: 'bar' } }).then((res) => {
            if (res.headers.Foo !== 'bar') {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test4 post', function (done) {
        client.post('https://httpbin.org/post', {
            body: { foo: 'bar' }
        }).then((res) => {
            if (res.data !== '{"foo":"bar"}' || res.headers['Content-Type'] !== 'application/json') {
                return done(new Error('error'));
            }
            done();
        }, done)
    });
});

describe('Query', function () {

    it('test5 findOne', function (done) {
        client('https://httpbin.org/get?path=object').findOne(1).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object%2F1') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });
});

describe('Query', function () {
    it('test6.1 find', function (done) {
        client('https://httpbin.org/get?path=object').find().then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object') {
                return done(new Error('error'));
            }
            done();
        }, error => {
            console.log('test6.1-error:', error);
            done();
        });
    });

    it('test6.2 find {foot:1}', function (done) {
        client('https://httpbin.org/get?path=object').find({ params: { foo: 1 } }).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object%3Ffoo=1') {
                return done(new Error('error'));
            }
            done();
        }, error => {
            console.log('test6.2-error:', error);
            done();
        });
    });

});

describe('Query', function () {

    it('test7 where Object', function (done) {
        client('https://httpbin.org/get?path=object').where({ foo: 1 }).then((res) => {
            console.log('test7-res:', res);
            if (res.url !== 'https://httpbin.org/get?path=object%3Ffoo=1') {
                return done(new Error('error'));
            }
            done();
        }, error => {
            console.log('test7-error:', error);
            done();
        });
    });

    it('test8 where String', function (done) {
        client('https://httpbin.org/get?path=object').where('foo', 2).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object%3Ffoo=2') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test9 where eq', function (done) {
        client('https://httpbin.org/get?path=object').where('age').eq(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test10 where equals', function (done) {
        client('https://httpbin.org/get?path=object').where('age').equals(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test11 where lt', function (done) {
        client('https://httpbin.org/get?path=object').where('age').lt(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test12 where lte', function (done) {
        client('https://httpbin.org/get?path=object').where('age').lte(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test13 where gt', function (done) {
        client('https://httpbin.org/get?path=object').where('age').gt(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });

    it('test14 where gte', function (done) {
        client('https://httpbin.org/get?path=object').where('age').gte(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&filters[age]=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });
});

describe('Query', function () {

    it('test15 limit', function (done) {
        client('https://httpbin.org/get?path=object').limit(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&limit=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });
});

describe('Query', function () {
    it('test16 page', function (done) {
        client('https://httpbin.org/get?path=object').page(12).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&page=12') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });
});

describe('Query', function () {
    it('test17 sort', function (done) {
        client('https://httpbin.org/get?path=object').sort('-creatAt').then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=object&sort=-creatAt') {
                return done(new Error('error'));
            }
            done();
        }, done);
    });
});


describe('Query', function () {
    it('test18 create', function (done) {
        client('https://httpbin.org/post?path=create').create({ body: { foo: 2 } }).then((res) => {
            if (res.data !== '{"foo":2}' || res.headers['Content-Type'] !== 'application/json') {
                return done(new Error('error'));
            }
            done();
        }, error => {
            console.error('count-error:', error);
            done();
        });
    });
});

describe('Query', function () {
    it('test19 count', function (done) {
        client('https://httpbin.org/get?path=count').count({ body: { foo: 2 } }).then((res) => {
            if (res.url !== 'https://httpbin.org/get?path=count') {
                return done(new Error('error'));
            }
            done();
        }, error => {
            console.error('count-error:', error);
            done();
        });
    });
});

/*
 describe('Query', function () {

 });

 describe('Query', function () {

 });

 describe('Query', function () {

 });

 describe('Query', function () {

 });*/

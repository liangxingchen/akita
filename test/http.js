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

    it('test get', function (done) {
        client.get('https://httpbin.org/get').then((res) => {
            if (!res) {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test params', function (done) {
        client.get('https://httpbin.org/get', { params: { foo: { bar: 'baz' } } }).then((res) => {
            if (res.url !== 'https://httpbin.org/get?foo[bar]=baz') {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test headers', function (done) {
        client.get('https://httpbin.org/get', { headers: { foo: 'bar' } }).then((res) => {
            if (res.headers.Foo !== 'bar') {
                return done(new Error('error'));
            }
            done();
        }, done)
    });

    it('test post', function (done) {
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

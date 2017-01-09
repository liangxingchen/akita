<meta http-equiv="refresh" content="0.1">
# akita

Network request library for akita and alaska.

akita 网络库，适用于 [Alaska](https://github.com/maichong/alaska) Restful 格式的服务器接口。

## 简单应用

```js
const fetch = require('node-fetch');
const client = require('akita');

client.setOptions({ fetch, apiRoot: 'https://your.domain/api/' });

client.post('user/login', {
    body: {
        username: 'admin',
        password: '123456'
    }
}).then((res) => {
	//success
    console.log('res:', res);
}, (error) => {
	//failure
    console.log("error:", error);
});
```

或者：
```js
const fetch = require('node-fetch');
const client = require('akita');

client.setOptions({ fetch });

client.post('https://your.domain/api/user/login', {
    body: {
        username: 'admin',
        password: '123456'
    }
}).then((res) => {
	//success
    console.log('res:', res);
}, (error) => {
	//failure
    console.log("error:", error);
});
```

如果我们需要更新默认客户端的配置，只需要调用其 `setOptions` 方法：

```js
const client = require('akita');
client.setOptions({ apiRoot:'https://your.domain/' });
```

## API

### 方法

##### create(options: Object):Client;
##### resolve(key: string):Client;
##### client.setOptions(options: Object);
##### client.request(path: string, RequestOption):RequestResult;
##### client.get(path: string, init?: RequestInit):RequestResult;
##### client.post(path: string, init?: RequestInit):RequestResult;
##### client.put(path: string, init?: RequestInit):RequestResult;
##### client.delete(path: string, init?: RequestInit):RequestResult;
##### client.head(path: string, init?: RequestInit):RequestResult;
##### client.options(path: string, init?: RequestInit):RequestResult;
##### client.trace(path: string, init?: RequestInit):RequestResult;
##### client.connect(path: string, init?: RequestInit):RequestResult;
##### client(path: string):AkitaQuery;

>说明: RequestInit对象和RequestResult对象
```
type RequestInit = {
  method?:string,
  params?:Object,
  body?:Object,
  headers?:Object,
  mode?:string,
  credentials?:string,
};
type RequestResult={
  then(onSuccess, onFail):Promise<Object>;
  catch(onFail):Promise<Object>;
  response():Promise<Object>;
};
```
>说明：AkitaQuery
```
class AkitaQuery {
  where(conditions: Object|string):AkitaQuery;
  where(conditions: string, value: any):AkitaQuery;

  compute(type: string, value: any) :AkitaQuery;

  eq(value: any):AkitaQuery;
  equals(value: any):AkitaQuery;

  // less than
  lt(value: any):AkitaQuery;
  lte(value: any):AkitaQuery;

  // greater than
  gt(value: any):AkitaQuery;
  gte(value: any):AkitaQuery;


  limit(size: number):AkitaQuery;
  page(size: number):AkitaQuery;
  sort(sortBy: string):AkitaQuery;

  create(data: Object):AkitaQuery;
  update(data: Object):AkitaQuery;
  update(id: string|number, data: Object):AkitaQuery;

  remove(conditions?: Object|string|number):AkitaQuery;

  count(conditions?: Object):AkitaQuery;

  find(conditions?: Object):AkitaQuery;

  findOne(conditions?: Object|number|string):AkitaQuery;
  findAll():AkitaQuery;
}
```

例如：

1.find使用方法
```
client('https://your.domain/api/test').find().then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });

client('https://your.domain/api/test').find({ 
        params: { 
            foo: 1 
        }
    }).then((res) => {
        console.log(res);
    }, error => {
        console.log(error);
    });
或者：
client('https://your.domain/api/test').find({foo: 1}).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });
```
2.where使用方法

```
client('https://your.domain/api/test').where({ foo: 1 }).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });

client('https://your.domain/api/test').where('foo', 2).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });
```

2.eq/equals/lt/lte/gt/gte使用方法

```
client('https://your.domain/api/test').where('age').eq(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });

注：eq等价于equals

client('https://your.domain/api/test').where('age').equals(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });


client('https://your.domain/api/test').where('age').lt(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });

client('https://your.domain/api/test').where('age').lte(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });
client('https://your.domain/api/test').where('age').gt(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });

client('https://your.domain/api/test').where('age').gte(12).then((res) => {
           console.log(res);
        }, error => {
            console.log(error);
        });
```


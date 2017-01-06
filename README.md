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
import client from 'akita';
client.setOptions({ apiRoot:'https://your.domain/' });
```
# Akita

Javascript network client library for Akita protocol.

## Protocol

Akita protocol is based on HTTP, which is a superset of RESTful.

Compared to the basic RESTful, Akita support list paging, limit, filters, update/remove multi record.

If server has an error, the response body should contain error message and error code optionally.

```js
{
  "error": "Can not connect to database",
  "code": 1233 // optional
}
```


#### 1. Get records list without paging.

`GET /path/to/res`

*Query params:*

param | type | default
---- | ---- | ----
_limit | number |
_sort | string |
_search | string |
...filters | string/Object |

*Result:*

```js
[ /* Records list */
  { id: 1 /* Record 1 */ },
  { id: 2 /* Record 2 */ }
]
```

*Example:*

* Find all records sort by `createdAt` DESC

  > GET /res?_sort=-createdAt
  > ```js
  > await akita('res').find().sort('-createdAt')
  > ```

* Find 100 records where `user` is 12

  > GET /res?user=12&_limit=100
  > ```js
  > await akita('res').find({ user: 12 }).limit(100)
  > ```

---------------------------------------


#### 2. Get records list with paging.

`GET /path/to/res/paginate`

*Query params:*

param | type | default
---- | ---- | ----
_page | number | 1
_limit | number |
_sort | string |
_search | string |
...filters | string/Object |

*Result:*

```js
{
  "total": 121, // total record
  "page": 1, // current page, default 1
  "limit": 10, // page limit
  "totalPage": 13,
  "previous": 0, // previous page index, zore for none
  "next": 2, // next page index, zore for none
  "search": "",
  "results":[ /* Records list */
    { id: 1 /* Record 1 */ },
    { id: 2 /* Record 2 */ }
  ]
}
```

*Example:*

* Find records sort by `createdAt` DESC

  > GET /res/paginate?_sort=-createdAt
  > ```js
  > await akita('res').paginate().sort('-createdAt')
  > ```

* Find records where `user` is 12

  > GET /res/paginate?user=12&_page=2
  > ```js
  > await akita('res').paginate().where('user',12).page(2)
  > ```

* Find records where `views` great than 100

  > GET /res/paginate?views[$gt]=100
  > ```js
  > await akita('res').paginate().where('views').gt(100)
  > ```


---------------------------------------


#### 3. Find one record by id

`GET /path/to/res/{ID}`

*Query params:*

param | type | default
---- | ---- | ----
...filters | string/Object |

*Result:*

```js
{
  "id": 123,
  // ... others
}
```

*Example:*

* find record 123 and ensure `user` is 12

  > GET /res/123?user=12
  > ```js
  > await akita('res').findByPk(123).where({ user: 12})
  > ```


---------------------------------------

#### 4. Get records count

`GET /path/to/res/count`

*Query params:*

param | type | default
---- | ---- | ----
_search | string |
...filters | string/Object |

*Result:*

```js
{
  "count": 123
}
```


---------------------------------------

#### 5. Create record

`POST /path/to/res`

*Post body:*

```js
{
  "title": "my book",
  // ... others data for creation
}
```

*Result:*

```js
{
  "id": 123,
  "title": "my book",
  // ... others data for creation
}
```

#### 6. Remove record by id

`DELETE /path/to/res/{ID}`

*Query params:*

param | type | default
---- | ---- | ----
...filters | string/Object |


---------------------------------------


#### 7. Remove multi records by filters

`DELETE /path/to/res`

*Query params:*

param | type | default
---- | ---- | ----
_limit | number |
_sort | string |
_search | string |
...filters | string/Object |


---------------------------------------

#### 8. Update one record by id

`PATCH /path/to/res/{ID}`

*Query params:*

param | type | default
---- | ---- | ----
...filters | string/Object |

*Post body:*

```js
{
  "title": "my book",
  // ... others data for update
}
```

*Result:*

```js
{
  "id": 123,
  "title": "my book",
  // ... others data for creation
}
```


---------------------------------------


#### 9. Update multi records by filters

`PATCH /path/to/res`

*Query params:*

param | type | default
---- | ---- | ----
_limit | number |
_sort | string |
_search | string |
...filters | string/Object |

*Post body:*

```js
{
  "title": "my book",
  // ... others data for update
}
```

*Result:*

```js
{
  "count": 2, // updated records count
  "ids": [127, 342] // updated records id
}
```


## Javascript client usage

#### Client Options

option | type | defualt | description
--- | --- | --- | ---
debug | boolean | false | enable debug mode
apiRoot | string | '' | API root path
fetch | Function | window.fetch | custom fetch function
FormData | Function | window.FormData | custom FormData class
init | Object | | `fetch(url,init)` init options https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch#Parameters

#### Client API

* client(path: string): Query;
> create a query object

* client.create(options: Object): Client;
> create a new client instance

* client.resolve(key: string): Client;
> resolve a client instance by `key`, create a new instance if not found

* client.setOptions(options: Object);
> update client instance options

* client.request(path: string, options:RequestOption): Promise;
> send a http request

* client.get(path: string, init?: Object): Promise;
> send a http request with GET method

* client.post(path: string, init?: Object): Promise;
> send a http request with POST method

* client.put(path: string, init?: Object): Promise;
> send a http request with PUT method

* client.patch(path: string, init?: Object): Promise;
> send a http request with PATCH method

* client.delete(path: string, init?: Object): Promise;
> send a http request with DELETE method

* client.head(path: string, init?: Object): Promise;
> send a http request with HEAD method

* client.options(path: string, init?: Object): Promise;
> send a http request with OPTIONS method

* client.trace(path: string, init?: Object): Promise;
> send a http request with TRACE method

* client.connect(path: string, init?: Object): Promise;
> send a http request with CONNECT method


#### Query API

* query.create(data?: Object): Query;
> Create new record

* query.arg(key:string | Object, value?:any): Query;
> Specifies custom arg.

* query.find(conditions?: Object): Query;
> Find multi records without paging.

* query.paginate(conditions?: Object): Query;
> Find records with paging. 

* query.findOne(conditions: Object): Query;
> Find one record by filters.

* query.findByPk(id: string): Query;
> Find one record by id.

* query.update(id?: Object, data: Object): Query;
> Update multi records or one record by id.

* query.remove(conditions?: string|Object): Query;
> Remove multi records or one record by id.

* query.search(keyword:string): Query;
> Specifies a search param

* query.where(conditions:Object|string, value?:any): Query;
> Specifies query filter conditions

* query.eq(value:any): Query;
> Specifies a filter condition

* query.lt(value:any): Query;
> Specifies a $lt filter condition

* query.lte(value:any): Query;
> Specifies a $lte filter condition

* query.gt(value:any): Query;
> Specifies a $gt filter condition

* query.gte(value:any): Query;
> Specifies a $gte filter condition

* query.sort(value:any): Query;
> Specifies query sort

* query.page(value:any): Query;
> Specifies query page

* query.limit(value:any): Query;
> Specifies query page limit or update/remove limit.

* query.exec(): Promise;
> Execute the query.

#### Create new client instance

```js

import akita from 'akita';

const client = akita.create({ /* options */});

```

#### Examples

```js

// import default client instance
import akita, { Model } from 'akita';

// set options for defualt instance
akita.setOptions({ /* options */});

// create new instance
const client = akita.create({ /* options */});
// set options for new client
client.setOptions({ apiRoot: 'http://your.domain/' /* other options */});

// send plain HTTP POST request
// POST http://your.domain/blog
await client.post('blog',{ body:{ title: 'my book' } });

// define akita model:

const User = client('user');

// define akita model by class extends

class Blog extends Model{
  static client = client;
  static path = 'blog';
  static pk = 'id';
}

// create / update record
let blog = await Blog.create({ title: 'my book' });
blog.title = 'changed';
await blog.save();

// find records with paging
await Blog.paginate();

// find one record by id
await Blog.findByPk(12);

// find one record by filters
await Blog.findOne({ category: 'js' }).sort('-createdAt');

// update multi records
await Blog.update({ hot: true }).sort('-views').limit(10);

// update one record by id
await Blog.update(12, { hot: true });

// update one record by filters & limit
await Blog.update({ hot: true }).sort('-views').limit(1);

// remove on record by id
await Blog.remove(12);

// remove multi records by filters
await Blog.remove({ state: 1 });

// or
await Blog.remove().where('views').lt(100);


```

## Contribute

[Maichong Software](http://maichong.it)

[Liang Xingchen](https://github.com/liangxingchen)

[Li Yudeng](https://github.com/maichonglyd)

[Zhao Lei](https://github.com/zhaolei69)

## License

This project is licensed under the terms of the MIT license

require('ts-node').register({});

let server = require('./server').default;

server.listen(28000);

require('./client.ts');
require('./model.ts');

require('tape').onFinish(() => {
  server.close();
});

require('tape').onFailure(() => {
  process.exit(1);
});

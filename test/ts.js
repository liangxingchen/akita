require('ts-node').register({});

let server = require('./server').default;

server.listen(28000);

require('./client.ts');
require('./errors.ts');

require('tape').onFinish(() => {
  server.close();
  process.exit();
});

require('tape').onFailure(() => {
  process.exit(1);
});

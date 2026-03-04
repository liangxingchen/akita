require('ts-node').register({});

let server = require('./server').default;

server.listen(28000);

require('./client.ts');
require('./errors.ts');
require('./parser.ts');
require('./stream-parser.ts');
require('./sse-stream.ts');

require('tape').onFinish(() => {
  server.close();
  process.exit();
});

require('tape').onFailure(() => {
  process.exit(1);
});

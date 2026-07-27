const { createServer, PORT } = require('./fakeBackend');

module.exports = async () => {
  const { server } = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', resolve);
  });
  globalThis.__FAKE_API__ = server;
};

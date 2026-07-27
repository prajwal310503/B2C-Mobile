module.exports = async () => {
  const server = globalThis.__FAKE_API__;
  if (server) await new Promise((resolve) => server.close(resolve));
};

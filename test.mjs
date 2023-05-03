import test from 'ava';
import { v2 as webdav } from 'webdav-server';
import nextdav from './dist/index.js';

async function setup() {
  // Setup user
  const userManager = new webdav.SimpleUserManager();
  const user = userManager.addUser('demo', 'demo', false);
  const privilegeManager = new webdav.SimplePathPrivilegeManager();
  privilegeManager.setRights(user, '/', ['all']);
  // Setup server
  const server = new webdav.WebDAVServer({
    port: 1900,
    httpAuthentication: new webdav.HTTPBasicAuthentication(
      userManager,
      'Default realm',
    ),
    privilegeManager: privilegeManager,
  });
  await server.startAsync();
  return server;
}
async function tearDown(server) {
  await server.stopAsync();
}

test('getCollectionContents should return empty folders and files', async (t) => {
  // ARRANGE
  const server = await setup();
  const instance = new nextdav('http://localhost:1900', 'demo', 'demo');
  // ACT
  const actual = await instance.getCollectionContents();
  // ASSERT
  const expect = [[], []];
  t.deepEqual(actual, expect);

  await tearDown(server);
});

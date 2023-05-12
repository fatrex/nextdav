import test from 'ava';
import { v2 as webdav } from 'webdav-server';
import nextdav from '../dist/index.js';

let webdavServer;
async function setup(withUser = false) {
  const config = {
    port: 1900,
  };

  if (withUser === true) {
    const userManager = new webdav.SimpleUserManager();
    const privilegeManager = new webdav.SimplePathPrivilegeManager();
    const user = userManager.addUser('demo', 'demo', false);
    privilegeManager.setRights(user, '/', ['all']);
    config['httpAuthentication'] = new webdav.HTTPBasicAuthentication(
      userManager,
      'Default realm',
    );
    config.privilegeManager = privilegeManager;
  }

  // Setup server
  webdavServer = new webdav.WebDAVServer({
    ...config,
  });
  await webdavServer.startAsync();
}

async function tearDown() {
  await webdavServer.stopAsync();
}

test.serial(
  'Server without auth - Client can connect without credentials',
  async (t) => {
    // ARRANGE
    await setup();
    const instance = new nextdav('http://localhost:1900');
    // ACT
    const actual = await instance.getCollectionContents();
    // ASSERT
    const expect = [[], []];
    t.deepEqual(actual, expect);

    await tearDown();
  },
);

test.serial(
  'Server with auth - Client can connect provided valid credentials',
  async (t) => {
    // ARRANGE
    await setup(true);
    const instance = new nextdav('http://localhost:1900', 'demo', 'demo');
    // ACT
    const actual = await instance.getCollectionContents();
    // ASSERT
    const expect = [[], []];
    t.deepEqual(actual, expect);

    await tearDown();
  },
);

test.serial(
  'Server with auth - Client cannot connect provided invalid credentials',
  async (t) => {
    // ARRANGE
    await setup(true);
    const instance = new nextdav('http://localhost:1900', 'demo', 'demoTest');
    // ACT
    const actual = await instance.getCollectionContents();
    // ASSERT
    const expect = false;
    t.deepEqual(actual, expect);

    await tearDown();
  },
);

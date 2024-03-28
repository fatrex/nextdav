import test from 'ava';
import { v2 as webdav } from 'webdav-server';
import nextdav from '../dist/index.js';

let webdavServer;
async function setup(withUser = false, withFileSystem = false) {
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

  if (withFileSystem === true) {
    webdavServer
      .rootFileSystem()
      .addSubTree(webdavServer.createExternalContext(), {
        testfolder1: {
          'file1.txt': webdav.ResourceType.File,
          'file2.txt': webdav.ResourceType.File,
        },
        'file0.txt': webdav.ResourceType.File,
      });
  }

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
    const actual = await instance.getFolderContents();
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
    const actual = await instance.getFolderContents();
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
    const actual = await instance.getFolderContents();
    // ASSERT
    const expect = false;
    t.deepEqual(actual, expect);

    await tearDown();
  },
);

test.serial('Client - Get folders contents', async (t) => {
  // ARRANGE
  await setup(true, true);
  const instance = new nextdav('http://localhost:1900', 'demo', 'demo');
  // ACT
  const actual = await instance.getFolderContents();
  // ASSERT
  const expect = [
    [
      {
        name: 'testfolder1',
        lastmod: new Date().toUTCString(),
      },
    ],
    [
      {
        name: 'file0.txt',
        dirname: '/',
        lastmod: new Date().toUTCString(),
        mime: 'text',
        length: 0,
        extension: 'txt',
      },
    ],
  ];
  t.deepEqual(actual, expect);

  await tearDown();
});

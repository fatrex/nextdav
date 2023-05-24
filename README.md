<img width="360" src="docs/logo.png" alt="Got">

> A WebDav client for [Node.js](https://nodejs.org/en)

---

### Installation

As simple as

```bash
npm add @fatrex/nextdav
```

### Usage

```js
import nextdav from 'nextdav';

// Create a client with your server username and password (ie: Nextcloud webdav server)
const client = new nextdav(
  'http://webdavhost.test',
  'yourusername', // If any
  'yourpassword', // If any
);

// Retrieve collections(directories) and files lists
const response = await client.getCollectionContents('/');
if (response) {
  const [collections, files] = response;
}
```

This lib is using [Roarr](https://github.com/gajus/roarr) as a debugging library. If you want to print debug logs you must prepend your starting script with `ROARR_LOG=true`

### Tests

- [x] Client connect to server with auth
- [x] Client connect to server without auth
- [ ] Client retrieves collections list
- [ ] Client retrieves files list

### TODO

- [x] Base client instance
- [x] Files and folders retrieval
- [x] Files download
- [ ] Files upload
- [ ] Files update and locks

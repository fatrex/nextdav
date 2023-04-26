<img width="360" src="docs/logo.png" alt="Got">

> A WebDav node.js client

---

> **⚠ WARNING:**  
> **This packages is still under heavy development so use at your own risk!**

### Installation

As simple as

```bash
npm add nextdav
```

### Usage

```js
import nextdav from 'nextdav';

// Create a client with your server username and password (ie: Nextcloud webdav server)
const client = new nextdav(
  'https://<nextcloudhost>/remote.php/dav/files/xxxxxx',
  'yourusername',
  'yourpassword',
);

// Retrieve collections(directories) and files lists
const response = await client.getCollectionContents('/');
if (response) {
  const [collections, files] = response;
}
```

### TODO

- [x] Base client instance
- [x] Files and folders retrieval
- [x] Files download
- [ ] Files upload
- [ ] Files update and locks
- [ ] Tests!

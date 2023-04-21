# nextdav

A WebDav client specifically created for Nextcloud

---

### This packages is still under active development so use at your own risk!

---

### Installation

As simple as

```bash
npm add nextdav
```

### Usage

```js
import nextdav from 'nextdav';

// Create a client with your nextcloud username and password
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

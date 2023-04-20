// src/index.ts
import { join } from "path";
import https from "https";
import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
var nextdav = class {
  constructor(url, username, password) {
    this.url = url;
    this.basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
  }
  async getClient() {
    const gotModule = await import("got");
    return gotModule.default.extend({
      headers: {
        Authorization: `Basic ${this.basicAuth}`
      },
      agent: {
        https: new https.Agent({
          secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT
        })
      }
    });
  }
  async getCollectionContents(path = "/") {
    const fullUrl = join(this.url, path);
    const client = await this.getClient();
    const rawResponse = await client(fullUrl, {
      method: "PROPFIND"
    });
    return this.buildContentsObject(rawResponse.body.toString());
  }
  parseXml(xmlData) {
    const parser = new XMLParser({
      ignoreAttributes: false,
      updateTag(tagName) {
        return tagName.replace("d:", "");
      }
    });
    return parser.parse(xmlData);
  }
  buildContentsObject(xmlString) {
    var _a, _b, _c, _d, _e;
    const data = this.parseXml(xmlString);
    const collections = [];
    const files = [];
    if (data.multistatus && data.multistatus.response) {
      const nonRootContents = data.multistatus.response.splice(1);
      for (const content of nonRootContents) {
        if (((_a = content.propstat.at(0)) == null ? void 0 : _a.prop.resourcetype) !== "") {
          const name = content.href.split("/").at(-2);
          if (name) {
            collections.push({
              name,
              lastmod: (_b = content.propstat.at(0)) == null ? void 0 : _b.prop.getlastmodified
            });
          }
        } else {
          const name = content.href.split("/").at(-1);
          const mime = (_c = content.propstat.at(0)) == null ? void 0 : _c.prop.getcontenttype;
          const length = Number((_d = content.propstat.at(0)) == null ? void 0 : _d.prop.getcontentlength);
          if (name && mime && length) {
            files.push({
              name,
              lastmod: (_e = content.propstat.at(0)) == null ? void 0 : _e.prop.getlastmodified,
              mime,
              length,
              extension: name.split(".").at(-1) || ""
            });
          }
        }
      }
    }
    return [collections, files];
  }
};
export {
  nextdav as default
};

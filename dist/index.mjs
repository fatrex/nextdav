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
  /**
   * Create WebDav client
   */
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
  /**
   * Retrive contents of the provided folder
   */
  async getCollectionContents(path = "/") {
    const fullUrl = join(this.url, path);
    const client = await this.getClient();
    try {
      const rawResponse = await client(fullUrl, {
        method: "PROPFIND"
      });
      return this.buildContentsObject(rawResponse.body.toString());
    } catch (error) {
      return false;
    }
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
    const data = this.parseXml(xmlString);
    const collections = [];
    const files = [];
    if (data.multistatus && data.multistatus.response) {
      let nonRootContents;
      if (!Array.isArray(data.multistatus.response)) {
        nonRootContents = [];
      } else {
        nonRootContents = data.multistatus.response.splice(1);
      }
      for (const content of nonRootContents) {
        let propstat;
        if (Array.isArray(content.propstat)) {
          propstat = content.propstat[0];
        } else {
          propstat = content.propstat;
        }
        if (propstat.prop.resourcetype !== "") {
          const name = content.href.split("/").at(-2);
          if (name) {
            collections.push({
              name,
              lastmod: propstat.prop.getlastmodified
            });
          }
        } else {
          const name = content.href.split("/").at(-1);
          const mime = propstat.prop.getcontenttype;
          const length = Number(propstat.prop.getcontentlength);
          if (name && mime && length) {
            files.push({
              name,
              lastmod: propstat.prop.getlastmodified,
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

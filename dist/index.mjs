// src/nextdav.class.ts
import { URL } from "url";
import { join, basename, dirname } from "path";
import { XMLParser } from "fast-xml-parser";
import HttpProxyAgent from "http-proxy-agent";
import HttpsProxyAgent from "https-proxy-agent";
import { SocksProxyAgent } from "socks-proxy-agent";
var nextdav = class {
  constructor(url, username, password, options) {
    this.url = new URL(url);
    this.options = options;
    this.basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
  }
  /**
   * Create WebDav client
   */
  async getClient() {
    var _a;
    const gotModule = await import("got");
    let httpAgent;
    let httpsAgent;
    if ((_a = this.options) == null ? void 0 : _a.proxy) {
      switch (this.options.proxy.protocol) {
        case "http":
          httpAgent = HttpProxyAgent({
            host: this.options.proxy.host,
            port: this.options.proxy.port
          });
          break;
        case "https":
          httpsAgent = HttpsProxyAgent({
            host: this.options.proxy.host,
            port: this.options.proxy.port
          });
          break;
        case "socks4":
        case "socks5":
          httpAgent = new SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`
          );
          httpsAgent = new SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`
          );
          break;
      }
    }
    return gotModule.default.extend({
      headers: {
        Authorization: `Basic ${this.basicAuth}`
      },
      agent: {
        https: httpsAgent,
        http: httpAgent
      }
    });
  }
  /**
   * Retrive contents of the provided folder
   */
  async getCollectionContents(path = "/") {
    const fullUrl = join(this.url.href, path);
    const client = await this.getClient();
    try {
      const rawResponse = await client(fullUrl, {
        method: "PROPFIND"
      });
      return this.buildContentsObject(rawResponse.body.toString());
    } catch (error) {
      console.error("[nextdav error] " + error);
      return false;
    }
  }
  /**
   * Download file as buffer
   */
  async getFileAsBuffer(path) {
    const fullUrl = join(this.url.href, path);
    const client = await this.getClient();
    try {
      const response = await client.get(fullUrl);
      return response.rawBody;
    } catch (error) {
      console.error("[nextdav error] " + error);
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
          const name = basename(content.href);
          if (name) {
            collections.push({
              name,
              lastmod: propstat.prop.getlastmodified
            });
          }
        } else {
          const name = basename(content.href);
          const mime = propstat.prop.getcontenttype;
          const length = Number(propstat.prop.getcontentlength);
          if (name && mime && length) {
            files.push({
              name,
              dirname: dirname(content.href).replace(this.url.pathname, ""),
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

// src/index.ts
var src_default = nextdav;
export {
  src_default as default
};

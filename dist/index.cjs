"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/nextdav.class.ts
var import_url = require("url");
var import_path = require("path");
var import_got = __toESM(require("got"), 1);
var import_fast_xml_parser = require("fast-xml-parser");
var import_http_proxy_agent = __toESM(require("http-proxy-agent"), 1);
var import_https_proxy_agent = __toESM(require("https-proxy-agent"), 1);
var import_socks_proxy_agent = require("socks-proxy-agent");
var nextdav = class {
  constructor(url, username, password, options) {
    this.url = new import_url.URL(url);
    this.options = options;
    if (username && password) {
      this.basicAuth = Buffer.from(`${username}:${password}`).toString(
        "base64"
      );
    }
  }
  /**
   * Create WebDav client
   */
  async getClient() {
    var _a, _b;
    let httpAgent;
    let httpsAgent;
    const headers = {};
    if ((_a = this.options) == null ? void 0 : _a.proxy) {
      switch (this.options.proxy.protocol) {
        case "http":
          httpAgent = (0, import_http_proxy_agent.default)({
            host: this.options.proxy.host,
            port: this.options.proxy.port
          });
          break;
        case "https":
          httpsAgent = (0, import_https_proxy_agent.default)({
            host: this.options.proxy.host,
            port: this.options.proxy.port
          });
          break;
        case "socks4":
        case "socks5":
          httpAgent = new import_socks_proxy_agent.SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`
          );
          httpsAgent = new import_socks_proxy_agent.SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`
          );
          break;
      }
    }
    if ((_b = this.options) == null ? void 0 : _b.customAgents) {
      if (this.options.customAgents.http) {
        httpAgent = this.options.customAgents.http;
      }
      if (this.options.customAgents.https) {
        httpsAgent = this.options.customAgents.https;
      }
    }
    if (this.basicAuth) {
      headers["Authorization"] = `Basic ${this.basicAuth}`;
    }
    return import_got.default.extend({
      headers,
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
    const fullUrl = (0, import_path.join)(this.url.href, path);
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
    const fullUrl = (0, import_path.join)(this.url.href, path);
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
    const parser = new import_fast_xml_parser.XMLParser({
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
          const name = (0, import_path.basename)(content.href);
          if (name) {
            collections.push({
              name,
              lastmod: propstat.prop.getlastmodified
            });
          }
        } else {
          const name = (0, import_path.basename)(content.href);
          const mime = propstat.prop.getcontenttype;
          const length = Number(propstat.prop.getcontentlength);
          if (name && mime && length) {
            files.push({
              name,
              dirname: (0, import_path.dirname)(content.href).replace(this.url.pathname, ""),
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

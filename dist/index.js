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
  default: () => nextdav
});
module.exports = __toCommonJS(src_exports);
var import_path = require("path");
var import_https = __toESM(require("https"));
var import_crypto = __toESM(require("crypto"));
var import_fast_xml_parser = require("fast-xml-parser");
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
        https: new import_https.default.Agent({
          secureOptions: import_crypto.default.constants.SSL_OP_LEGACY_SERVER_CONNECT
        })
      }
    });
  }
  /**
   * Retrive contents of the provided folder
   */
  async getCollectionContents(path = "/") {
    const fullUrl = (0, import_path.join)(this.url, path);
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

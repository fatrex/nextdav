"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const https_1 = __importDefault(require("https"));
const crypto_1 = __importDefault(require("crypto"));
const fast_xml_parser_1 = require("fast-xml-parser");
class nextdav {
    constructor(url, username, password) {
        this.url = url;
        this.basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    }
    getClient() {
        return __awaiter(this, void 0, void 0, function* () {
            const gotModule = yield Promise.resolve().then(() => __importStar(require('got')));
            return gotModule.default.extend({
                headers: {
                    Authorization: `Basic ${this.basicAuth}`,
                },
                agent: {
                    https: new https_1.default.Agent({
                        secureOptions: crypto_1.default.constants.SSL_OP_LEGACY_SERVER_CONNECT,
                    }),
                },
            });
        });
    }
    getCollectionContents(path = '/') {
        return __awaiter(this, void 0, void 0, function* () {
            const fullUrl = (0, path_1.join)(this.url, path);
            const client = yield this.getClient();
            const rawResponse = yield client(fullUrl, {
                method: 'PROPFIND',
            });
            return this.buildContentsObject(rawResponse.body.toString());
        });
    }
    parseXml(xmlData) {
        const parser = new fast_xml_parser_1.XMLParser({
            ignoreAttributes: false,
            updateTag(tagName) {
                return tagName.replace('d:', '');
            },
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
                if (((_a = content.propstat.at(0)) === null || _a === void 0 ? void 0 : _a.prop.resourcetype) !== '') {
                    const name = content.href.split('/').at(-2);
                    if (name) {
                        collections.push({
                            name,
                            lastmod: (_b = content.propstat.at(0)) === null || _b === void 0 ? void 0 : _b.prop.getlastmodified,
                        });
                    }
                }
                else {
                    const name = content.href.split('/').at(-1);
                    const mime = (_c = content.propstat.at(0)) === null || _c === void 0 ? void 0 : _c.prop.getcontenttype;
                    const length = Number((_d = content.propstat.at(0)) === null || _d === void 0 ? void 0 : _d.prop.getcontentlength);
                    if (name && mime && length) {
                        files.push({
                            name,
                            lastmod: (_e = content.propstat.at(0)) === null || _e === void 0 ? void 0 : _e.prop.getlastmodified,
                            mime,
                            length,
                            extension: name.split('.').at(-1) || '',
                        });
                    }
                }
            }
        }
        return [collections, files];
    }
}
exports.default = nextdav;

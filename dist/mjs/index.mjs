import { join } from 'path';
import https from 'https';
import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
export default class nextdav {
    url;
    basicAuth;
    constructor(url, username, password) {
        this.url = url;
        this.basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    }
    async getClient() {
        const gotModule = await import('got');
        return gotModule.default.extend({
            headers: {
                Authorization: `Basic ${this.basicAuth}`,
            },
            agent: {
                https: new https.Agent({
                    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
                }),
            },
        });
    }
    async getCollectionContents(path = '/') {
        const fullUrl = join(this.url, path);
        const client = await this.getClient();
        const rawResponse = await client(fullUrl, {
            method: 'PROPFIND',
        });
        return this.buildContentsObject(rawResponse.body.toString());
    }
    parseXml(xmlData) {
        const parser = new XMLParser({
            ignoreAttributes: false,
            updateTag(tagName) {
                return tagName.replace('d:', '');
            },
        });
        return parser.parse(xmlData);
    }
    buildContentsObject(xmlString) {
        const data = this.parseXml(xmlString);
        const collections = [];
        const files = [];
        if (data.multistatus && data.multistatus.response) {
            const nonRootContents = data.multistatus.response.splice(1);
            for (const content of nonRootContents) {
                if (content.propstat.at(0)?.prop.resourcetype !== '') {
                    const name = content.href.split('/').at(-2);
                    if (name) {
                        collections.push({
                            name,
                            lastmod: content.propstat.at(0)?.prop.getlastmodified,
                        });
                    }
                }
                else {
                    const name = content.href.split('/').at(-1);
                    const mime = content.propstat.at(0)?.prop.getcontenttype;
                    const length = Number(content.propstat.at(0)?.prop.getcontentlength);
                    if (name && mime && length) {
                        files.push({
                            name,
                            lastmod: content.propstat.at(0)?.prop.getlastmodified,
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

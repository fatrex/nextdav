import { join } from 'path';
import https from 'https';
import crypto from 'crypto';
import { Got, Method } from 'got';
import { XMLParser } from 'fast-xml-parser';
import {
  Collection,
  File,
  XMLBody,
  XMLPropstat,
  XMLResponse,
} from './interfaces.js';

export default class nextdav {
  private url: string;
  private basicAuth: string;

  constructor(url: string, username: string, password: string) {
    this.url = url;
    this.basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
  }

  /**
   * Create WebDav client
   */
  private async getClient(): Promise<Got> {
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

  /**
   * Retrive contents of the provided folder
   */
  async getCollectionContents(
    path = '/',
  ): Promise<[Collection[], File[]] | boolean> {
    const fullUrl = join(this.url, path);
    const client = await this.getClient();
    try {
      const rawResponse = await client(fullUrl, {
        method: 'PROPFIND' as Method,
      });
      return this.buildContentsObject(rawResponse.body.toString());
    } catch (error) {
      console.error('[nextdav error] ' + error + '');
      return false;
    }
  }

  private parseXml(xmlData: string): XMLBody {
    const parser = new XMLParser({
      ignoreAttributes: false,
      updateTag(tagName) {
        return tagName.replace('d:', '');
      },
    });
    return parser.parse(xmlData);
  }

  private buildContentsObject(xmlString: string): [Collection[], File[]] {
    const data = this.parseXml(xmlString);
    const collections: Collection[] = [];
    const files: File[] = [];
    if (data.multistatus && data.multistatus.response) {
      let nonRootContents: XMLResponse[];
      if (!Array.isArray(data.multistatus.response)) {
        // This means there's only the root folder so no othe content is available
        nonRootContents = [];
      } else {
        // There are other entries besides the root folder that we remove from the collection
        nonRootContents = data.multistatus.response.splice(1);
      }
      for (const content of nonRootContents) {
        let propstat: XMLPropstat;
        if (Array.isArray(content.propstat)) {
          propstat = content.propstat[0];
        } else {
          propstat = content.propstat;
        }

        if (propstat.prop.resourcetype !== '') {
          const name = content.href.split('/').at(-2);
          if (name) {
            collections.push({
              name,
              lastmod: propstat.prop.getlastmodified,
            });
          }
        } else {
          const name = content.href.split('/').at(-1);
          const mime = propstat.prop.getcontenttype;
          const length = Number(propstat.prop.getcontentlength);
          if (name && mime && length) {
            files.push({
              name,
              lastmod: propstat.prop.getlastmodified,
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

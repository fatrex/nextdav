import { Roarr as debug } from 'roarr';
import { URL } from 'url';
import { join, basename, dirname } from 'path';
import http from 'http';
import https from 'https';
import got, { Got, Method } from 'got';
import { XMLParser } from 'fast-xml-parser';
import { HttpProxyAgent } from 'http-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import {
  Collection,
  File,
  Nextdav,
  Options,
  XMLBody,
  XMLPropstat,
  XMLResponse,
} from './interfaces.js';

export default class nextdav implements Nextdav {
  private url: URL;
  private options?: Options;
  private basicAuth?: string;

  constructor(
    url: string,
    username?: string,
    password?: string,
    options?: Options,
  ) {
    this.url = new URL(url);
    this.options = options;
    if (username && password) {
      this.basicAuth = Buffer.from(`${username}:${password}`).toString(
        'base64',
      );
    }
  }

  /**
   * Create WebDav client
   */
  private async getClient(): Promise<Got> {
    let httpAgent: http.Agent | undefined;
    let httpsAgent: https.Agent | undefined;
    const headers: any = {};

    if (this.options?.proxy) {
      switch (this.options.proxy.protocol) {
        default:
        case 'http':
          httpAgent = new HttpProxyAgent(`http://${this.options.proxy.host}`, {
            port: this.options.proxy.port,
          });
          break;
        case 'https':
          httpsAgent = new HttpsProxyAgent(
            `https://${this.options.proxy.host}`,
            {
              port: this.options.proxy.port,
            },
          );
          break;
        case 'socks4':
        case 'socks5':
          httpAgent = new SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`,
          );
          httpsAgent = new SocksProxyAgent(
            `${this.options.proxy.protocol}://${this.options.proxy.host}:${this.options.proxy.port}`,
          );
          break;
      }
    }

    if (this.options?.customAgents) {
      if (this.options.customAgents.http) {
        httpAgent = this.options.customAgents.http;
      }
      if (this.options.customAgents.https) {
        httpsAgent = this.options.customAgents.https;
      }
    }

    if (this.basicAuth) {
      headers['Authorization'] = `Basic ${this.basicAuth}`;
    }

    if (httpsAgent !== undefined || httpAgent !== undefined) {
      debug({ application: 'nextdav' }, 'Using custom agents');
    }

    return got.extend({
      headers,
      agent: {
        https: httpsAgent,
        http: httpAgent,
      },
    });
  }

  /**
   * Retrive contents of the provided folder
   */
  async getFolderContents(
    path = '/',
  ): Promise<[Collection[], File[]] | boolean> {
    const fullUrl = join(this.url.href, path);
    const client = await this.getClient();
    try {
      const rawResponse = await client(fullUrl, {
        method: 'PROPFIND' as Method,
      });
      return this.buildContentsObject(rawResponse.body.toString());
    } catch (error: any) {
      debug({ application: 'nextdav' }, error.toString());
      return false;
    }
  }

  /**
   * Download file as buffer
   */
  async getFileAsBuffer(path: string): Promise<Buffer | false> {
    const fullUrl = join(this.url.href, path);
    const client = await this.getClient();
    try {
      const response = await client.get(fullUrl);
      return response.rawBody;
    } catch (error: any) {
      debug({ application: 'nextdav' }, error.toString());
      return false;
    }
  }

  private parseXml(xmlData: string): XMLBody {
    const parser = new XMLParser({
      ignoreAttributes: false,
      updateTag(tagName) {
        return tagName.replace('d:', '').replace('D:', '');
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
        // There are other entries beside the root folder that we remove from the collection
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
          const name = basename(content.href);
          if (name) {
            collections.push({
              name,
              lastmod: propstat.prop.getlastmodified,
            });
          }
        } else {
          const name = basename(content.href);
          const mime = propstat.prop.getcontenttype?.split(';').at(0);
          const length = Number(propstat.prop.getcontentlength);
          if (
            name !== undefined &&
            mime !== undefined &&
            length !== undefined
          ) {
            files.push({
              name,
              dirname: content.href
                .replace(name, '')
                .replace(this.url.href, '/'),
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

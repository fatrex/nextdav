import { Got } from 'got';
import http from 'http';
import https from 'https';

export interface Nextdav {
  getFolderContents(path: string): Promise<[Collection[], File[]] | boolean>;
  getFileAsBuffer(path: string): Promise<Buffer | false>;
}

export interface XMLPropstat {
  prop: {
    getlastmodified: Date;
    resourcetype: { collection?: string } | string;
    getcontenttype?: string;
    getcontentlength?: string;
  };
  status: string;
}

export interface XMLResponse {
  href: string;
  propstat: XMLPropstat | XMLPropstat[];
}

export interface XMLMultistatus {
  response: XMLResponse | XMLResponse[];
}

export interface XMLBody {
  multistatus: XMLMultistatus;
}

export interface Proxy {
  host: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface Options {
  proxy?: Proxy;
  customAgents?: {
    http: http.Agent;
    https: https.Agent;
  };
}

export interface Collection {
  name: string;
  lastmod?: Date;
}

export interface File {
  name: string;
  dirname: string;
  lastmod?: Date;
  mime: string;
  length: number;
  extension: string;
}

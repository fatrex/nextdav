import http from 'http';
import https from 'https';

interface Nextdav {
    getFolderContents(path: string): Promise<[Collection[], File[]] | boolean>;
    getFileAsBuffer(path: string): Promise<Buffer | false>;
}
interface Proxy {
    host: string;
    port: number;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
}
interface Options {
    proxy?: Proxy;
    customAgents?: {
        http?: http.Agent;
        https?: https.Agent;
    };
}
interface Collection {
    name: string;
    lastmod?: Date;
}
interface File {
    name: string;
    dirname: string;
    lastmod?: Date;
    mime: string;
    length: number;
    extension: string;
}

declare class nextdav implements Nextdav {
    private url;
    private options?;
    private basicAuth?;
    constructor(url: string, username?: string, password?: string, options?: Options);
    /**
     * Create WebDav client
     */
    private getClient;
    /**
     * Retrive contents of the provided folder
     */
    getFolderContents(path?: string): Promise<[Collection[], File[]] | boolean>;
    /**
     * Download file as buffer
     */
    getFileAsBuffer(path: string): Promise<Buffer | false>;
    private parseXml;
    private buildContentsObject;
}

export { type Collection, type File, type Nextdav, type Options, type Proxy, nextdav as default };

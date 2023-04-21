interface Proxy {
    host: string;
    port: number;
}
interface SocksProxy extends Proxy {
    protocol: 'socks5' | 'socks4';
}
interface Options {
    httpProxy?: Proxy;
    httpsProxy?: Proxy;
    socksProxy?: SocksProxy;
}
interface Collection {
    name: string;
    lastmod?: Date;
}
interface File {
    name: string;
    lastmod?: Date;
    mime: string;
    length: number;
    extension: string;
}

declare class nextdav {
    private url;
    private options?;
    private basicAuth;
    constructor(url: string, username: string, password: string, options?: Options);
    /**
     * Create WebDav client
     */
    private getClient;
    /**
     * Retrive contents of the provided folder
     */
    getCollectionContents(path?: string): Promise<[Collection[], File[]] | boolean>;
    private parseXml;
    private buildContentsObject;
}

export { nextdav as default };

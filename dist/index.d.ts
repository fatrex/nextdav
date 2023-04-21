interface Proxy {
    host: string;
    port: number;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
}
interface Options {
    proxy: Proxy;
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
    /**
     * Download file as buffer
     */
    getFileAsBuffer(path: string): Promise<Buffer | false>;
    private parseXml;
    private buildContentsObject;
}

export { Collection, File, Options, Proxy, nextdav as default };

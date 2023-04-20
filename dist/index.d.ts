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
    private basicAuth;
    constructor(url: string, username: string, password: string);
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

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
    private getClient;
    getCollectionContents(path?: string): Promise<[Collection[], File[]]>;
    private parseXml;
    private buildContentsObject;
}

export { nextdav as default };

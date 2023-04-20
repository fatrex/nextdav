import { Collection, File } from './interfaces.js';
export default class nextdav {
    private url;
    private basicAuth;
    constructor(url: string, username: string, password: string);
    private getClient;
    getCollectionContents(path?: string): Promise<[Collection[], File[]]>;
    private parseXml;
    private buildContentsObject;
}

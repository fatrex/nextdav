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
  response: XMLResponse[];
}

export interface XMLBody {
  multistatus: XMLMultistatus;
}

export interface Collection {
  name: string;
  lastmod?: Date;
}

export interface File {
  name: string;
  lastmod?: Date;
  mime: string;
  length: number;
  extension: string;
}

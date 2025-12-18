declare module 'react-native-smb' {
  export interface SmbConfig {
    ip: string;
    port?: number;
    username: string;
    password: string;
    workGroup?: string;
    shareName: string;
  }

  export class SMB2Client {
    constructor(ip: string, username: string, password: string, shareName: string);
    connect(callback: (error: any) => void): void;
    disconnect(callback: (error: any) => void): void;
    list(path: string, callback: (error: any, files: any[]) => void): void;
    upload(localPath: string, remotePath: string, callback: (error: any, id: string) => void): void;
    download(remotePath: string, localPath: string, callback: (error: any, id: string) => void): void;
  }

  export class SMBClient extends SMB2Client {}
}

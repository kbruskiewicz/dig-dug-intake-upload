import { Bucket, Storage } from "@google-cloud/storage";
import auth from "./auth";

type Configuration = {
    bucket: string
}

interface IUploadClient {
    upload_file: Function
}

abstract class UploadClient implements IUploadClient {
    configuration: Configuration;
    progressCallback: Function | undefined;
    constructor(configuration: Configuration, progressCallback?: Function) {
        this.configuration = configuration;
        this.progressCallback = progressCallback;
    }
    public async upload_file(input_file_path: string, file_key: string): Promise<any> {}
}

class GoogleUploadClient extends UploadClient {
    
    private storage : Storage;
    progressCallback: ((progressEvent: any) => void) | undefined;

    constructor(configuration: Configuration, progressCallback?: (progressEvent: any) => void ) {
        super(configuration, progressCallback);

        this.storage = new Storage();
        this.progressCallback = progressCallback;
    }
    
    private async maybe_bucket(bucket_name: string, location?: string) {
        const [bucket] = await this.storage.createBucket(bucket_name);
        return bucket;
    }
    
    public async upload_file(input_file_path: string, file_key: string, progressCallback?: (progressEvent: any) => void) {
        return this.storage.bucket(this.configuration.bucket).upload(input_file_path, {
            destination: file_key,
            onUploadProgress: !!progressCallback ? progressCallback : this.progressCallback,
        }, () => console.log('upload successful'));
    }

    public async reserve_upload() {}
    public async make_upload() {}

}

function file_key(namespace: string, delimiter: string = '/', ...pathnames: string[]) {
    return `${namespace}/${pathnames.join('/')}`
}

function new_file_location(label: string, namespace: string) {
    const accession_id = auth.shakeSalt()
    return [accession_id, file_key(namespace, accession_id)];
}

export default {
    new_file_location,
    GoogleUploadClient
}
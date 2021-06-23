import { LocalTokenCache, TokenCache } from "./token_cache"

enum Status {
    Idle = "IDLE",
    Progress = "PROGRESS",
    Done = "DONE",
    Fail = "FAIL",
    Interrupted = "INTERRUPTED",
    Error = "ERROR"
}

type Progress = {
    status: Status,
    current_position: Number,
    end_position: Number
}

export class ProgressCache {

    cache: TokenCache;
    private namespace: string;  // TODO: namespacing by date to allow for garbage collection later?
    constructor(namespace: string, cache: TokenCache) {
        this.namespace = namespace;
        this.cache = cache;
    }

    getProgress(token: string) {
        // TODO: handle try-catch
        if (this.cache.has_token(token, this.namespace)) {
            let { current_position, end_position } = this.cache.get_token_value(token, this.namespace) as Progress;

            let status: Status;
            
            if (end_position === 0) {
                status = Status.Idle;
            } else if (current_position < end_position) {
                status = Status.Progress
            } else if (current_position === end_position) {
                status = Status.Done
            } else if (current_position > end_position) {
                status = Status.Error
            } else {
                status = Status.Fail
            }
            
            return {
                status: status,
                current_position: current_position,
                end_position: end_position,
            }
        } else {
            console.warn(`no token ${token} in the progress cache!`)
            return null;
        }
    }

    setProgress(token_name: string, current_position: Number, end_position: Number, override: boolean = true) {
        let status: Status;
        
        if (end_position === 0) {
            status = Status.Idle;
        } else if (current_position < end_position) {
            status = Status.Progress
        } else if (current_position === end_position) {
            status = Status.Done
        } else if (current_position > end_position) {
            status = Status.Error
        } else {
            status = Status.Fail
        }

        // console.log(this.cache, status)
        // if (status !== Status.Done) {
        //     // overrides the value in the cache
        //     // NOTE: means that I have to guarantee that the token is unique!
        //     return this.cache.put_token(token_name, this.namespace, {
        //         status: status,
        //         current_position: current_position,
        //         end_position: end_position,
        //     });
        // } 
        // else {
        //     // force the token expiry
        //     this.cache.force_token_expiry()
        //     // return the last result
        //     return {
        //         status,
        //         current_position,
        //         end_position
        //     }
        // }

        return this.cache.put_token(token_name, this.namespace, {
            status: status,
            current_position: current_position,
            end_position: end_position,
        });

    };

}

const defaultProgressCache = new ProgressCache('progress', new LocalTokenCache());

export default {
    getProgress: defaultProgressCache.getProgress,
    setProgress: defaultProgressCache.setProgress,
    ProgressCache: ProgressCache,
    Status: Status
}
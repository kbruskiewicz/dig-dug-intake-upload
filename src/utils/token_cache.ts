export interface Tokens {
    put_token: (name: string, namespace?: string, value?: any, expiry?: number) => object
    has_token: (name: string, namespace?: string) => boolean
    get_token_value: (name: string, namespace?: string) => any
    force_token_expiry: (token: string) => boolean
}

export abstract class TokenCache implements Tokens {
    
    delimiter = ';'
    expiry = 10000 // time in ms
    constructor(expiry?: number, delimiter?: string) {
        this.expiry = typeof expiry !== 'undefined' ? expiry : this.expiry;  // use 'typeof' since 0 is valid and false-y
        this.delimiter = delimiter || this.delimiter;
    }
    
    has_token(name: string, namespace?: string) {
        return false;
    }

    put_token(name: string, namespace?: string, value?: any, expiry: number = this.expiry) {
        const token =  `${namespace}${this.delimiter}${name}`;
        return {
            token
        };
    }

    get_token_value(name: string, namespace?: string) {
        return {};
    }

    force_token_expiry(token: string) {
        return false;
    }

}

export class LocalTokenCache extends TokenCache {
    
    private tokens = new Map();
    constructor(expiry?: number, delimiter?: string) {
        super(expiry, delimiter);
    };

    has_token(name: string, namespace?: string) {
        if (!!namespace) {
            if (this.tokens.has(namespace)) {
                return this.tokens.get(namespace).has(name)
            }
        } else {
            return this.tokens.has(name);
        }
    }

    put_token(name: string, namespace?: string, value: any = '', expiry: number = this.expiry) {

        let self = this;
        function set_token(name: string, namespace?: string, delimiter=self.delimiter) {
            if (!!namespace) {
                if (!self.tokens.has(namespace)) {
                    self.tokens.set(namespace, new Map());
                }
                self.tokens.get(namespace).set(name, value)
            } else {
                self.tokens.set(name, value);
            }
            const token = `${!!namespace ? `${namespace}${self.delimiter}` : ''}${name}`;
            return token;
        }

        let token_exists = this.has_token(name, namespace);
        let token = '';
        if (!token_exists) {
            // only start expiry timer if the token doesn't already exist
            // to prevent races, only start expiry timer after token is created
            token = set_token(name, namespace);
            this.set_expiry_timer(token);
        } else {
            token = set_token(name, namespace);
        };
         
        return {
            token,
            expiry,
        };
    };

    get_token_value(name: string, namespace?: string) {
        if (!!namespace) {
            return this.tokens.get(namespace).get(name)
        } else {
            return this.tokens.get(name);
        }
    }

    force_token_expiry(token: string) {
        const maybe_split = token.split(this.delimiter);
        if (maybe_split.length > 1) {

            // NOTE: Doesn't delete the namespace, just the token
            const [namespace, name] = maybe_split;
            if (this.tokens.has(namespace) && this.tokens.get(namespace).has(name)) {
                this.tokens.get(namespace).delete(name);
            } else {
                // nothing to delete => delete failed
                return false;
            }

        } else {
            
            const [name] = maybe_split;
            if (this.tokens.has(name)) {
                this.tokens.delete(name);
            } else {
                // nothing to delete => delete failed
                return false;
            }

        }
        return true;
    };

    async set_expiry_timer(token: string, expiry: number=this.expiry, callback?: Function, warn: boolean = true) {

        let func = !!callback ? 
            () => {
                callback(token);
                console.log('token', token, 'expired');
            } 
        :   () => { 
                this.force_token_expiry(token);
                console.log('token', token, 'expired');
            };

        if (expiry > 0) {
            setTimeout(
                func,
                expiry
            )
        } else {
            if (warn) {
                console.warn('token', token, 'will not expire');
            }
        }
    }
}

// Tests
// const tokenCache = new LocalTokenCache(0);  // 0 => never deletes on expiry

// tokenCache.put_token('token', 'namespace', 'value');
// const tokenValue1 = tokenCache.get_token_value('token', 'namespace');
// console.log('has token', tokenValue1, tokenValue1 === 'value' === true);

// tokenCache.force_token_expiry(`${'namespace'}${tokenCache.delimiter}${'token'}`);
// const tokenValue2 = tokenCache.get_token_value('token', 'namespace');
// console.log('deleted token', tokenValue2, tokenValue2 === 'value' === false);

// setTimeout(() => console.log(tokenCache.get_token_value('token', 'namespace')), 20000)

export class RedisTokenCache extends TokenCache {
    private source: string;
    constructor(source: string, expiry: number, delimiter?: string) {
        super(expiry, delimiter);
        this.source = source;
        // TODO: Redis client connection
    }

    private queryRedis(query: any ) {
        return ''
    }
    private writeRedisMap(key: string, value: any) {
        return ''
    };

    has_token(name: string, namespace?: string) {
        const token_query = (name: string, namespace?: string) => {};
        this.queryRedis(token_query(name, namespace))
        return false;
    }

    put_token(name: string, namespace?: string, expiry: number = this.expiry) {
        if (!!namespace) {
            this.writeRedisMap(namespace, name);
        } else {
            this.writeRedisMap('', name);
        }
        return {
            token: `${namespace}${this.delimiter}${name}`,
            expiry
        };
    }
    force_token_expiry(token: string) {
        return false;
    }
}

// Tests


export default {
    TokenCache,
    LocalTokenCache,
    RedisTokenCache
}
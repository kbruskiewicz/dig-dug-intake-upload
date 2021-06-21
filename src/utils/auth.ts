import crypto from "crypto";

const shakeSalt = (
    buffer_size=10
) => {
    const buf = Buffer.alloc(buffer_size);
    return crypto.randomFillSync(buf).toString('hex');
}

// use pbkdf2 (node implementation)
const obscurePassword = (
    password: string,
    hash_implementation: string='sha512',
    salt=shakeSalt(),
) => crypto.pbkdf2Sync(password, salt, 100000, 32, hash_implementation).toString('hex');

// validate presented password strings against the obscured password
const validatePassword = (
    given_password: string, 
    password_salt: string, 
    hash_implementation: string='sha512'
) => (obscured_password: string) => obscurePassword(given_password, hash_implementation, password_salt) === obscured_password;

// TODO: AWT stuff

export default {
    shakeSalt,
    obscurePassword,
    validatePassword,
}
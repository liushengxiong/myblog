import crypto$1 from 'node:crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const strictDecoder = new TextDecoder('utf-8', { fatal: true });
function concat(...buffers) {
    const size = buffers.reduce((acc, { length }) => acc + length, 0);
    const buf = new Uint8Array(size);
    let i = 0;
    for (const buffer of buffers) {
        buf.set(buffer, i);
        i += buffer.length;
    }
    return buf;
}
function encode$1(string) {
    const bytes = new Uint8Array(string.length);
    for (let i = 0; i < string.length; i++) {
        const code = string.charCodeAt(i);
        if (code > 127) {
            throw new TypeError('non-ASCII string encountered in encode()');
        }
        bytes[i] = code;
    }
    return bytes;
}

const unusable = (name, prop = 'algorithm.name') => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
function checkUsage(key, usage) {
    if (usage && !key.usages.includes(usage)) {
        throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
    }
}
function checkModulusLength(alg, key) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== 'number' || modulusLength < 2048) {
        throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
}
function checkCryptoKey(key, expected, usage) {
    const algorithm = key.algorithm;
    if (algorithm.name !== expected.name) {
        throw unusable(expected.name);
    }
    if (expected.hash && algorithm.hash?.name !== expected.hash) {
        throw unusable(expected.hash, 'algorithm.hash');
    }
    if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve) {
        throw unusable(expected.namedCurve, 'algorithm.namedCurve');
    }
    if (expected.length !== undefined && algorithm.length !== expected.length) {
        throw unusable(expected.length, 'algorithm.length');
    }
    checkUsage(key, usage);
}

function message(msg, actual, ...types) {
    if (types.length > 2) {
        const last = types.pop();
        msg += `one of type ${types.join(', ')}, or ${last}.`;
    }
    else if (types.length === 2) {
        msg += `one of type ${types[0]} or ${types[1]}.`;
    }
    else {
        msg += `of type ${types[0]}.`;
    }
    if (actual == null) {
        msg += ` Received ${actual}`;
    }
    else if (typeof actual === 'function' && actual.name) {
        msg += ` Received function ${actual.name}`;
    }
    else if (typeof actual === 'object' && actual != null) {
        if (actual.constructor?.name) {
            msg += ` Received an instance of ${actual.constructor.name}`;
        }
    }
    return msg;
}
const withAlg = (alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types);

class JOSEError extends Error {
    static code = 'ERR_JOSE_GENERIC';
    code = 'ERR_JOSE_GENERIC';
    constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
    }
}
class JWTClaimValidationFailed extends JOSEError {
    static code = 'ERR_JWT_CLAIM_VALIDATION_FAILED';
    code = 'ERR_JWT_CLAIM_VALIDATION_FAILED';
    claim;
    reason;
    payload;
    constructor(message, payload, claim = 'unspecified', reason = 'unspecified') {
        super(message, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
    }
}
class JWTExpired extends JOSEError {
    static code = 'ERR_JWT_EXPIRED';
    code = 'ERR_JWT_EXPIRED';
    claim;
    reason;
    payload;
    constructor(message, payload, claim = 'unspecified', reason = 'unspecified') {
        super(message, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
    }
}
class JOSEAlgNotAllowed extends JOSEError {
    static code = 'ERR_JOSE_ALG_NOT_ALLOWED';
    code = 'ERR_JOSE_ALG_NOT_ALLOWED';
}
class JOSENotSupported extends JOSEError {
    static code = 'ERR_JOSE_NOT_SUPPORTED';
    code = 'ERR_JOSE_NOT_SUPPORTED';
}
class JWSInvalid extends JOSEError {
    static code = 'ERR_JWS_INVALID';
    code = 'ERR_JWS_INVALID';
}
class JWTInvalid extends JOSEError {
    static code = 'ERR_JWT_INVALID';
    code = 'ERR_JWT_INVALID';
}
class JWSSignatureVerificationFailed extends JOSEError {
    static code = 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED';
    code = 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED';
    constructor(message = 'signature verification failed', options) {
        super(message, options);
    }
}

const isCryptoKey = (key) => {
    if (key?.[Symbol.toStringTag] === 'CryptoKey')
        return true;
    try {
        return key instanceof CryptoKey;
    }
    catch {
        return false;
    }
};
const isKeyObject = (key) => key?.[Symbol.toStringTag] === 'KeyObject';
const isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);

function encodeBase64(input) {
    if (Uint8Array.prototype.toBase64) {
        return input.toBase64();
    }
    const CHUNK_SIZE = 0x8000;
    const arr = [];
    for (let i = 0; i < input.length; i += CHUNK_SIZE) {
        arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
    }
    return btoa(arr.join(''));
}
function decodeBase64(encoded) {
    if (Uint8Array.fromBase64) {
        return Uint8Array.fromBase64(encoded);
    }
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

const invalid = 'The input to be decoded is not correctly encoded.';
function decode(input) {
    if (Uint8Array.fromBase64) {
        try {
            return Uint8Array.fromBase64(typeof input === 'string' ? input : decoder.decode(input), {
                alphabet: 'base64url',
            });
        }
        catch (cause) {
            throw new TypeError(invalid, { cause });
        }
    }
    let encoded = input;
    if (encoded instanceof Uint8Array) {
        encoded = decoder.decode(encoded);
    }
    if (encoded.includes('+') || encoded.includes('/')) {
        throw new TypeError(invalid);
    }
    encoded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    try {
        return decodeBase64(encoded);
    }
    catch {
        throw new TypeError(invalid);
    }
}
function encode(input) {
    let unencoded = input;
    if (typeof unencoded === 'string') {
        unencoded = encoder.encode(unencoded);
    }
    if (Uint8Array.prototype.toBase64) {
        return unencoded.toBase64({ alphabet: 'base64url', omitPadding: true });
    }
    return encodeBase64(unencoded).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function isObject(input) {
    if (typeof input !== 'object' ||
        input === null ||
        Object.prototype.toString.call(input) !== '[object Object]') {
        return false;
    }
    const prototype = Object.getPrototypeOf(input);
    return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function assertNotSet(value, name) {
    if (value !== undefined) {
        throw new TypeError(`${name} can only be called once`);
    }
}
function decodeBase64url(value, label, ErrorClass) {
    try {
        return decode(value);
    }
    catch {
        throw new ErrorClass(`Failed to base64url decode the ${label}`);
    }
}
function encodeBase64url(value, label, ErrorClass) {
    try {
        return encode$1(value);
    }
    catch {
        throw new ErrorClass(`The ${label} is not a valid base64url string`);
    }
}
function parseJoseHeader(b64, ErrorClass, message) {
    let parsed;
    try {
        parsed = JSON.parse(strictDecoder.decode(decode(b64)));
    }
    catch {
        throw new ErrorClass(message);
    }
    if (!isObject(parsed)) {
        throw new ErrorClass(message);
    }
    return parsed;
}

async function jwkToKey(entry, jwk) {
    if (jwk.kty === 'RSA' && 'oth' in jwk && jwk.oth !== undefined) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
    }
    if (!entry.kty.includes(jwk.kty)) {
        throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
    }
    const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle;
    const isPrivate = !!(jwk.d || jwk.priv);
    const keyData = { ...jwk };
    if (keyData.kty !== 'AKP') {
        delete keyData.alg;
    }
    delete keyData.use;
    return crypto.subtle.importKey('jwk', keyData, algorithm, jwk.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}

function snapshotJwk(jwk) {
    return { __proto__: null, ...jwk };
}
function normalizeJwk(jwk) {
    const normalized = snapshotJwk(jwk);
    if (normalized.ext !== undefined && typeof normalized.ext !== 'boolean') {
        throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
    }
    if (normalized.key_ops !== undefined) {
        const value = normalized.key_ops;
        const keyOps = Array.isArray(value) ? [...value] : undefined;
        if (!keyOps ||
            keyOps.some((operation) => typeof operation !== 'string') ||
            new Set(keyOps).size !== keyOps.length) {
            throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
        }
        normalized.key_ops = keyOps;
    }
    return normalized;
}

const tag = (key) => key[Symbol.toStringTag];
const jwkMatchesOp = (entry, key, usage) => {
    const { alg } = entry;
    if (key.use !== undefined) {
        const expected = usage === 'sign' || usage === 'verify' ? 'sig' : 'enc';
        if (key.use !== expected) {
            throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
        }
    }
    if (key.alg !== undefined && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
    }
    if (Array.isArray(key.key_ops)) {
        const expectedKeyOp = usage === 'encrypt' || usage === 'decrypt' ? entry.ops?.[usage === 'encrypt' ? 0 : 1] : usage;
        if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp)) {
            throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
        }
    }
};
function checkKeyType(entry, key, usage) {
    const { alg, secret } = entry;
    const privateKey = usage === 'decrypt' || usage === 'sign';
    if (secret && key instanceof Uint8Array)
        return [BYTES, key];
    if (isObject(key)) {
        const normalized = normalizeJwk(key);
        if (typeof normalized.kty !== 'string') {
            throw new TypeError(secret
                ? withAlg(alg, key, 'CryptoKey', 'KeyObject', 'JSON Web Key', 'Uint8Array')
                : withAlg(alg, key, 'CryptoKey', 'KeyObject', 'JSON Web Key'));
        }
        const valid = secret
            ? normalized.kty === 'oct' && typeof normalized.k === 'string'
            : normalized.kty !== 'oct' &&
                (privateKey
                    ? (normalized.kty === 'AKP' && typeof normalized.priv === 'string') ||
                        typeof normalized.d === 'string'
                    : normalized.d === undefined && normalized.priv === undefined);
        if (!valid) {
            throw new TypeError(secret
                ? `JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`
                : `JSON Web Key for this operation must be a ${privateKey ? 'private' : 'public'} JWK`);
        }
        jwkMatchesOp(entry, normalized, usage);
        return [JWK, key, normalized];
    }
    if (!isKeyLike(key)) {
        throw new TypeError(secret
            ? withAlg(alg, key, 'CryptoKey', 'KeyObject', 'JSON Web Key', 'Uint8Array')
            : withAlg(alg, key, 'CryptoKey', 'KeyObject', 'JSON Web Key'));
    }
    if (secret) {
        if (key.type !== 'secret') {
            throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
        }
    }
    else {
        if (key.type === 'secret') {
            throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
        }
        const expectedType = privateKey ? 'private' : 'public';
        if ((key.type === 'public' || key.type === 'private') && key.type !== expectedType) {
            const operation = usage === 'sign'
                ? 'signing'
                : usage === 'verify'
                    ? 'verifying'
                    : `${usage.slice(0, -1)}tion`;
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm ${operation} must be of type "${expectedType}"`);
        }
    }
    return isCryptoKey(key) ? [CRYPTO, key] : [KEYOBJECT, key];
}
const BYTES = 0;
const CRYPTO = 1;
const KEYOBJECT = 2;
const JWK = 3;
let cache;
const nist = {
    __proto__: null,
    prime256v1: 'P-256',
    secp384r1: 'P-384',
    secp521r1: 'P-521',
};
function cached(key, alg, value) {
    cache ||= new WeakMap();
    const entry = cache.get(key);
    if (value) {
        if (entry) {
            entry[alg] = value;
        }
        else {
            cache.set(key, { [alg]: value });
        }
    }
    return value ?? entry?.[alg];
}
const handleJWK = async (key, jwk, entry) => cached(key, entry.alg) ??
    cached(key, entry.alg, await jwkToKey(entry, { ...jwk, alg: entry.alg }));
const handleKeyObject = (keyObject, entry) => {
    const hit = cached(keyObject, entry.alg);
    if (hit)
        return hit;
    const isPublic = keyObject.type === 'public';
    const usages = entry.usages[isPublic ? 0 : 1];
    const { asymmetricKeyType } = keyObject;
    const crv = nist[keyObject.asymmetricKeyDetails?.namedCurve];
    const params = entry.resolve?.({ crv, asymmetricKeyType }) ?? entry.subtle;
    return cached(keyObject, entry.alg, keyObject.toCryptoKey(params, isPublic, usages));
};
async function prepareKey(entry, key, usage) {
    const tagged = checkKeyType(entry, key, usage);
    switch (tagged[0]) {
        case BYTES:
        case CRYPTO:
            return tagged[1];
        case JWK: {
            const key = tagged[1];
            const normalized = tagged[2];
            if (normalized.kty === 'oct') {
                return decode(normalized.k);
            }
            if (!Object.isFrozen(key)) {
                const { key_ops } = key;
                if (Array.isArray(key_ops))
                    Object.freeze(key_ops);
                Object.freeze(key);
            }
            return handleJWK(key, normalized, entry);
        }
        case KEYOBJECT: {
            const keyObject = tagged[1];
            if (keyObject.type === 'secret') {
                return keyObject.export();
            }
            if ('toCryptoKey' in keyObject && typeof keyObject.toCryptoKey === 'function') {
                return handleKeyObject(keyObject, entry);
            }
            return handleJWK(keyObject, keyObject.export({ format: 'jwk' }), entry);
        }
    }
}

function table(entries) {
    const out = { __proto__: null };
    for (const alg in entries) {
        out[alg] = { ...entries[alg], alg };
    }
    return out;
}

const JWS_RECOGNIZED = { __proto__: null, b64: true };
function validateAlgorithms(option, algorithms) {
    if (algorithms !== undefined &&
        (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== 'string'))) {
        throw new TypeError(`"${option}" option must be an array of strings`);
    }
    if (!algorithms) {
        return undefined;
    }
    return new Set(algorithms);
}
function validateCritDuplicates(Err, protectedHeader) {
    const { crit } = protectedHeader ?? {};
    if (Array.isArray(crit) && new Set(crit).size !== crit.length) {
        throw new Err('"crit" (Critical) Header Parameter MUST NOT contain duplicate values');
    }
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
    if (joseHeader.crit !== undefined && protectedHeader?.crit === undefined) {
        throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
    }
    if (!protectedHeader || protectedHeader.crit === undefined) {
        return [];
    }
    if (!Array.isArray(protectedHeader.crit) ||
        protectedHeader.crit.length === 0 ||
        protectedHeader.crit.some((input) => typeof input !== 'string' || input.length === 0)) {
        throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
    }
    const recognized = recognizedOption === undefined
        ? recognizedDefault
        : { __proto__: null, ...recognizedOption, ...recognizedDefault };
    for (const parameter of protectedHeader.crit) {
        if (!(parameter in recognized)) {
            throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
        }
        if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === undefined) {
            throw new Err(`Extension Header Parameter "${parameter}" is missing`);
        }
        if (recognized[parameter] &&
            (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === undefined)) {
            throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
        }
    }
    return protectedHeader.crit;
}
function validateB64(protectedHeader, extensions) {
    if (extensions.includes('b64')) {
        const b64 = protectedHeader.b64;
        if (typeof b64 !== 'boolean') {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
        }
        return b64;
    }
    return true;
}
function serializeJoseHeader(Err, header) {
    let serialized;
    let parsed;
    try {
        serialized = JSON.stringify(header);
        parsed = JSON.parse(serialized);
    }
    catch (cause) {
        throw new Err('JOSE Header is not valid JSON', { cause });
    }
    if (!isObject(parsed)) {
        throw new Err('JOSE Header is not a JSON object');
    }
    return [parsed, serialized];
}

async function getSigKey(entry, key, usage) {
    if (key instanceof Uint8Array) {
        return crypto.subtle.importKey('raw', key, entry.subtle, false, [
            usage,
        ]);
    }
    checkCryptoKey(key, entry.subtle, usage);
    if (entry.minRsaBits)
        checkModulusLength(entry.alg, key);
    return key;
}
async function sign(entry, key, data) {
    const cryptoKey = await getSigKey(entry, key, 'sign');
    const signature = await crypto.subtle.sign(entry.signing, cryptoKey, data);
    return new Uint8Array(signature);
}
async function verify(entry, key, signature, data) {
    const cryptoKey = await getSigKey(entry, key, 'verify');
    try {
        return await crypto.subtle.verify(entry.signing, cryptoKey, signature, data);
    }
    catch {
        return false;
    }
}

const sig = [['verify'], ['sign']];
function hmac(bits) {
    const subtle = { name: 'HMAC', hash: `SHA-${bits}` };
    return { kty: ['oct'], secret: true, subtle, signing: subtle, usages: sig };
}
function rsa(bits, saltLength) {
    const name = saltLength ? 'RSA-PSS' : 'RSASSA-PKCS1-v1_5';
    const subtle = { name, hash: `SHA-${bits}` };
    return {
        kty: ['RSA'],
        subtle,
        signing: saltLength ? { ...subtle, saltLength } : subtle,
        usages: sig,
        minRsaBits: 2048,
    };
}
function ecdsa(crv, bits) {
    return {
        kty: ['EC'],
        crv,
        subtle: { name: 'ECDSA', namedCurve: crv },
        signing: { name: 'ECDSA', hash: `SHA-${bits}` },
        usages: sig,
    };
}
function eddsa() {
    const subtle = { name: 'Ed25519' };
    return {
        kty: ['OKP'],
        crv: 'Ed25519',
        subtle,
        signing: subtle,
        usages: sig,
    };
}
function mldsa(bits) {
    const name = `ML-DSA-${bits}`;
    const subtle = { name };
    return {
        kty: ['AKP'],
        subtle,
        signing: subtle,
        usages: sig,
    };
}
const JWS = table({
    HS256: hmac(256),
    HS384: hmac(384),
    HS512: hmac(512),
    RS256: rsa(256),
    RS384: rsa(384),
    RS512: rsa(512),
    PS256: rsa(256, 32),
    PS384: rsa(384, 48),
    PS512: rsa(512, 64),
    ES256: ecdsa('P-256', 256),
    ES384: ecdsa('P-384', 384),
    ES512: ecdsa('P-521', 512),
    EdDSA: eddsa(),
    Ed25519: eddsa(),
    'ML-DSA-44': mldsa(44),
    'ML-DSA-65': mldsa(65),
    'ML-DSA-87': mldsa(87),
});
function jwsAlgorithm(alg) {
    const entry = typeof alg === 'string' ? JWS[alg] : undefined;
    if (!entry) {
        throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
    }
    return entry;
}

function prepareVerify(options) {
    return [options && validateAlgorithms('algorithms', options.algorithms), options?.crit];
}
function parseProtectedHeader(encodedProtected, parsedProtected = encodedProtected === undefined
    ? {}
    : parseJoseHeader(encodedProtected, JWSInvalid, 'JWS Protected Header is invalid')) {
    return parsedProtected;
}
function validateJwsHeaders(parsedProt, joseHeader, shared) {
    const b64 = validateB64(parsedProt, validateCrit(JWSInvalid, JWS_RECOGNIZED, shared[1], parsedProt, joseHeader));
    const alg = joseHeader.alg;
    if (typeof alg !== 'string' || !alg) {
        throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    if (shared[0] && !shared[0].has(alg)) {
        throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
    }
    return [b64, alg];
}
function encodeCompactUnencodedPayload(payload) {
    try {
        return encode$1(payload);
    }
    catch {
        throw new JWSInvalid('JWS Compact Serialization payload must use only ASCII characters');
    }
}
async function verifyPrepared(jws, shared, key, encodedProtected, parsedProt, alg, signingPayload) {
    let resolvedKey = false;
    if (typeof key === 'function') {
        key = await key(parsedProt, jws);
        resolvedKey = true;
    }
    const b64 = typeof signingPayload === 'string';
    const entry = jwsAlgorithm(alg);
    const data = concat(encodedProtected !== undefined ? encode$1(encodedProtected) : new Uint8Array(), encode$1('.'), b64
        ?
            (shared[2] ??= encodeBase64url(signingPayload, 'payload', JWSInvalid))
        : signingPayload);
    const signature = decodeBase64url(jws.signature, 'signature', JWSInvalid);
    const k = await prepareKey(entry, key, 'verify');
    if (!(await verify(entry, k, signature, data))) {
        throw new JWSSignatureVerificationFailed();
    }
    const payload = b64 ? decodeBase64url(signingPayload, 'payload', JWSInvalid) : signingPayload;
    return [payload, parsedProt, b64, k, resolvedKey];
}
async function verifyCompact(jws, shared, key) {
    if (jws instanceof Uint8Array) {
        jws = decoder.decode(jws);
    }
    if (typeof jws !== 'string') {
        throw new JWSInvalid('Compact JWS must be a string or Uint8Array');
    }
    const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split('.');
    if (length !== 3) {
        throw new JWSInvalid('Invalid Compact JWS');
    }
    const compactJws = { payload, protected: protectedHeader, signature };
    const parsedProt = parseProtectedHeader(protectedHeader);
    const [b64, alg] = validateJwsHeaders(parsedProt, parsedProt, shared);
    const signingPayload = b64 ? payload : encodeCompactUnencodedPayload(payload);
    return verifyPrepared(compactJws, shared, key, protectedHeader, parsedProt, alg, signingPayload);
}

const epoch = (date) => Math.floor(date.getTime() / 1000);
const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
    y: 31557600,
};
const REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
const checkFailed = 'check_failed';
function invalidDuration() {
    throw new TypeError('Invalid time period format');
}
function secs(str) {
    if (typeof str !== 'string') {
        invalidDuration();
    }
    const matched = REGEX.exec(str);
    if (!matched || (matched[4] && matched[1])) {
        invalidDuration();
    }
    const value = parseFloat(matched[2]);
    const numericDate = Math.round(value * multipliers[matched[3][0].toLowerCase()]);
    if (!Number.isFinite(numericDate)) {
        invalidDuration();
    }
    if (matched[1] === '-' || matched[4] === 'ago') {
        return -numericDate;
    }
    return numericDate;
}
function validateInput(label, input) {
    if (!Number.isFinite(input)) {
        throw new TypeError(`Invalid ${label} input`);
    }
    return input;
}
function validateStringClaim(claim, value) {
    if (typeof value !== 'string') {
        throw new TypeError(`"${claim}" claim must be a string`);
    }
}
function validateAudienceClaim(value) {
    if (typeof value !== 'string' &&
        (!Array.isArray(value) || Array.from(value).some((member) => typeof member !== 'string'))) {
        throw new TypeError('"aud" claim must be a string or an array of strings');
    }
}
function numericDate(value, label) {
    if (typeof value === 'number')
        return validateInput(label, value);
    if (value instanceof Date)
        return validateInput(label, epoch(value));
    return epoch(new Date()) + secs(value);
}
const normalizeTyp = (value) => {
    const normalized = value.toLowerCase();
    return value.includes('/') ? normalized : `application/${normalized}`;
};
const checkAudiencePresence = (audPayload, audOption) => {
    if (typeof audPayload === 'string') {
        return audOption.includes(audPayload);
    }
    if (Array.isArray(audPayload)) {
        return audOption.some((aud) => audPayload.includes(aud));
    }
    return false;
};
function validateNumericDate(payload, claim, required = false) {
    const value = payload[claim];
    if (value === undefined && !required)
        return undefined;
    if (typeof value !== 'number') {
        throw new JWTClaimValidationFailed(`"${claim}" claim must be a number`, payload, claim, 'invalid');
    }
    return value;
}
function unexpectedClaim(payload, claim) {
    throw new JWTClaimValidationFailed(`unexpected "${claim}" claim value`, payload, claim, checkFailed);
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
    let payload;
    try {
        payload = JSON.parse(strictDecoder.decode(encodedPayload));
    }
    catch {
    }
    if (!isObject(payload)) {
        throw new JWTInvalid('JWT Claims Set must be a top-level JSON object');
    }
    const { typ } = options;
    if (typ !== undefined &&
        (typeof protectedHeader.typ !== 'string' ||
            normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
        throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, 'typ', checkFailed);
    }
    const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
    const presenceCheck = [...requiredClaims];
    if (maxTokenAge !== undefined)
        presenceCheck.push('iat');
    if (audience !== undefined)
        presenceCheck.push('aud');
    if (subject !== undefined)
        presenceCheck.push('sub');
    if (issuer !== undefined)
        presenceCheck.push('iss');
    for (const claim of new Set(presenceCheck.reverse())) {
        if (!Object.hasOwn(payload, claim)) {
            throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, 'missing');
        }
    }
    if (issuer !== undefined &&
        !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
        unexpectedClaim(payload, 'iss');
    }
    if (subject !== undefined && payload.sub !== subject) {
        unexpectedClaim(payload, 'sub');
    }
    if (audience !== undefined &&
        !checkAudiencePresence(payload.aud, typeof audience === 'string' ? [audience] : audience)) {
        unexpectedClaim(payload, 'aud');
    }
    const { clockTolerance } = options;
    let tolerance = 0;
    if (typeof clockTolerance === 'string') {
        tolerance = secs(clockTolerance);
    }
    else if (clockTolerance !== undefined) {
        if (typeof clockTolerance !== 'number') {
            throw new TypeError('Invalid clockTolerance option type');
        }
        tolerance = clockTolerance;
    }
    validateInput('clockTolerance option', tolerance);
    const { currentDate } = options;
    const now = validateInput('currentDate option', epoch(currentDate === undefined ? new Date() : currentDate));
    const iat = validateNumericDate(payload, 'iat', maxTokenAge !== undefined);
    const nbf = validateNumericDate(payload, 'nbf');
    if (nbf !== undefined) {
        if (nbf > now + tolerance) {
            throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, 'nbf', checkFailed);
        }
    }
    const exp = validateNumericDate(payload, 'exp');
    if (exp !== undefined) {
        if (exp <= now - tolerance) {
            throw new JWTExpired('"exp" claim timestamp check failed', payload, 'exp', checkFailed);
        }
    }
    if (maxTokenAge !== undefined) {
        const age = now - iat;
        const max = validateInput('maxTokenAge option', typeof maxTokenAge === 'number' ? maxTokenAge : secs(maxTokenAge));
        if (age - tolerance > max) {
            throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, 'iat', checkFailed);
        }
        if (age < -tolerance) {
            throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, 'iat', checkFailed);
        }
    }
    return payload;
}
let producerPayloads;
function producerPayload(producer) {
    return producerPayloads.get(producer);
}
function jwtData(producer) {
    const payload = producerPayload(producer);
    for (const claim of ['iat', 'nbf', 'exp']) {
        const value = payload[claim];
        if (typeof value === 'number' && !Number.isFinite(value)) {
            throw new TypeError(`"${claim}" claim must be a finite number`);
        }
    }
    return encoder.encode(JSON.stringify(payload));
}
class JWTClaimsBuilder {
    constructor(payload = {}) {
        if (!isObject(payload)) {
            throw new TypeError('JWT Claims Set MUST be an object');
        }
        (producerPayloads ||= new WeakMap()).set(this, structuredClone(payload));
    }
    setIssuer(value) {
        validateStringClaim('iss', value);
        producerPayload(this).iss = value;
        return this;
    }
    setSubject(value) {
        validateStringClaim('sub', value);
        producerPayload(this).sub = value;
        return this;
    }
    setAudience(value) {
        validateAudienceClaim(value);
        producerPayload(this).aud = value;
        return this;
    }
    setJti(value) {
        validateStringClaim('jti', value);
        producerPayload(this).jti = value;
        return this;
    }
    setNotBefore(value) {
        producerPayload(this).nbf = numericDate(value, 'setNotBefore');
        return this;
    }
    setExpirationTime(value) {
        producerPayload(this).exp = numericDate(value, 'setExpirationTime');
        return this;
    }
    setIssuedAt(value) {
        const payload = producerPayload(this);
        if (value === undefined) {
            payload.iat = epoch(new Date());
        }
        else if (typeof value === 'string') {
            payload.iat = validateInput('setIssuedAt', epoch(new Date()) + secs(value));
        }
        else {
            payload.iat = numericDate(value, 'setIssuedAt');
        }
        return this;
    }
}

async function jwtVerify(jwt, key, options) {
    const verified = await verifyCompact(jwt, prepareVerify(options), key);
    if (!verified[2]) {
        throw new JWTInvalid('JWTs MUST NOT use unencoded payload');
    }
    const payload = validateClaimsSet(verified[1], verified[0], options);
    const result = { payload, protectedHeader: verified[1] };
    if (typeof key === 'function') {
        return { ...result, key: verified[3] };
    }
    return result;
}

function serializeProtectedHeader(protectedHeader) {
    if (protectedHeader === undefined)
        return [undefined, ''];
    const normalized = serializeJoseHeader(JWSInvalid, protectedHeader);
    return [normalized[0], encode(normalized[1])];
}
function validateSignatureHeader(protectedHeader, joseHeader, crit) {
    validateCritDuplicates(JWSInvalid, protectedHeader);
    return validateB64(protectedHeader, validateCrit(JWSInvalid, JWS_RECOGNIZED, crit, protectedHeader, joseHeader));
}
function signatureAlgorithm(joseHeader) {
    const alg = joseHeader.alg;
    if (typeof alg !== 'string' || !alg) {
        throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
    }
    return jwsAlgorithm(alg);
}
async function signSignature(protectedHeader, payload, entry, key) {
    const data = concat(encode$1(protectedHeader), encode$1('.'), payload);
    const k = await prepareKey(entry, key, 'sign');
    return encode(await sign(entry, k, data));
}
async function createCompactSignature(payload, inputProtectedHeader, inputCrit, key, rejectUnencoded) {
    const [protectedHeader, protectedHeaderString] = serializeProtectedHeader(inputProtectedHeader);
    if (!protectedHeader) {
        throw new JWSInvalid('either setProtectedHeader or setUnprotectedHeader must be called before #sign()');
    }
    const b64 = validateSignatureHeader(protectedHeader, protectedHeader, inputCrit);
    if (!b64)
        rejectUnencoded();
    const entry = signatureAlgorithm(protectedHeader);
    const encodedPayload = encode(payload);
    const signature = await signSignature(protectedHeaderString, encode$1(encodedPayload), entry, key);
    return `${protectedHeaderString}.${encodedPayload}.${signature}`;
}

const SignJWT_base = JWTClaimsBuilder;
class SignJWT extends SignJWT_base {
    #protectedHeader;
    setProtectedHeader(protectedHeader) {
        assertNotSet(this.#protectedHeader, 'setProtectedHeader');
        this.#protectedHeader = protectedHeader;
        return this;
    }
    async sign(key, options) {
        return createCompactSignature(jwtData(this), this.#protectedHeader, options?.crit, key, () => {
            throw new JWTInvalid('JWTs MUST NOT use unencoded payload');
        });
    }
}

const SESSION_COOKIE = "admin_session";
const CSRF_COOKIE = "admin_csrf";
const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7;
const CSRF_MAX_AGE_S = 60 * 60 * 24;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, dkLen: 32 };
function isProd(ctx) {
  try {
    const host = ctx?.url?.hostname ?? "";
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local"))
      return false;
    return true;
  } catch {
    return process.env.NODE_ENV === "production";
  }
}
function ensureSecret(raw, name) {
  if (!raw || raw.length < 16) {
    throw new Error(
      `[auth] Missing or too short env var ${name}. Require >=16 chars; production >=32.`
    );
  }
  return new TextEncoder().encode(raw);
}
function jwtSecret() {
  return ensureSecret(process.env.ADMIN_JWT_SECRET, "ADMIN_JWT_SECRET");
}
function randomB64(bytes = 16) {
  return crypto$1.randomBytes(bytes).toString("base64url");
}
async function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  const parts = hash.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt" || parts[1] !== "N=16384,r=8,p=1")
    return false;
  const salt = Buffer.from(parts[2], "base64url");
  const expected = Buffer.from(parts[3], "base64url");
  return await new Promise((resolve, reject) => {
    crypto$1.scrypt(
      password,
      salt,
      SCRYPT_PARAMS.dkLen,
      SCRYPT_PARAMS,
      (err, actual) => {
        if (err) return reject(err);
        resolve(crypto$1.timingSafeEqual(expected, actual));
      }
    );
  });
}
async function signJwt(session) {
  const secret = jwtSecret();
  return await new SignJWT(session).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_MAX_AGE_S}s`).sign(secret);
}
async function verifyJwt(token) {
  if (!token) return null;
  try {
    const secret = jwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      requiredClaims: ["sub", "username", "jti"],
      maxTokenAge: `${SESSION_MAX_AGE_S}s`
    });
    return payload;
  } catch {
    return null;
  }
}
const CSRF_HMAC_MSG_PREFIX = "csrf:";
function csrfKeyData() {
  const raw = process.env.ADMIN_JWT_SECRET;
  if (!raw || raw.length < 16) {
    throw new Error("[auth] ADMIN_JWT_SECRET missing; cannot create CSRF.");
  }
  return Buffer.from(raw, "utf-8");
}
function createCsrfToken(session) {
  const rand = randomB64(18);
  const msg = `${CSRF_HMAC_MSG_PREFIX}${session.jti}:${rand}`;
  const mac = crypto$1.createHmac("sha256", csrfKeyData()).update(msg).digest("base64url");
  return `${rand}.${mac}`;
}
function verifyCsrfToken(token, session) {
  if (!token || !session) return false;
  const [rand, mac] = token.split(".");
  if (!rand || !mac) return false;
  const expectedMsg = `${CSRF_HMAC_MSG_PREFIX}${session.jti}:${rand}`;
  const expected = crypto$1.createHmac("sha256", csrfKeyData()).update(expectedMsg).digest("base64url");
  try {
    return crypto$1.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
  } catch {
    return false;
  }
}
const rateStore = /* @__PURE__ */ new Map();
function rateLimit(key, limit = 5, windowMs = 15 * 60 * 1e3) {
  const now = Date.now();
  const cur = rateStore.get(key);
  if (!cur || cur.resetAt < now) {
    rateStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      blocked: false,
      retryAfterMs: 0,
      remaining: Math.max(0, limit - 1)
    };
  }
  cur.count += 1;
  if (cur.count > limit) {
    return {
      blocked: true,
      retryAfterMs: Math.max(0, cur.resetAt - now),
      remaining: 0
    };
  }
  return {
    blocked: false,
    retryAfterMs: 0,
    remaining: Math.max(0, limit - cur.count)
  };
}
function extractClientIp(ctx) {
  try {
    const req = ctx.request ?? ctx.request;
    const header = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const first = header.split(",")[0]?.trim() || "127.0.0.1";
    return first;
  } catch {
    return "127.0.0.1";
  }
}
function setSessionCookie(ctx, token) {
  ctx.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(ctx),
    path: "/",
    maxAge: SESSION_MAX_AGE_S
  });
}
function setCsrfCookie(ctx, token) {
  ctx.cookies.set(CSRF_COOKIE, token, {
    httpOnly: false,
    // 前端 JS 读取后放 header，双提交模式
    sameSite: "lax",
    secure: isProd(ctx),
    path: "/",
    maxAge: CSRF_MAX_AGE_S
  });
}
function clearSessionCookie(ctx) {
  ctx.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(ctx),
    path: "/",
    maxAge: 0
  });
  ctx.cookies.set(CSRF_COOKIE, "", {
    httpOnly: false,
    sameSite: "lax",
    secure: isProd(ctx),
    path: "/",
    maxAge: 0
  });
}
function getSessionCookie(ctx) {
  return ctx.cookies.get(SESSION_COOKIE)?.value;
}
function getCsrfCookie(ctx) {
  return ctx.cookies.get(CSRF_COOKIE)?.value;
}
function getCsrfHeader(request) {
  return request.headers.get("X-CSRF-Token");
}
async function getSession(ctx) {
  const tok = getSessionCookie(ctx);
  if (!tok) return null;
  return await verifyJwt(tok);
}
function requireAuthSync(session) {
  if (!session) {
    const err = new Error("UNAUTHORIZED");
    err.code = "UNAUTHORIZED";
    throw err;
  }
}
async function requireAuth(ctx) {
  const s = await getSession(ctx);
  requireAuthSync(s);
  return s;
}
async function requireCsrf(ctx, session) {
  const header = getCsrfHeader(ctx.request);
  const cookie = getCsrfCookie(ctx);
  if (!header || !cookie || header !== cookie) {
    const err = new Error("INVALID_CSRF");
    err.code = "INVALID_CSRF";
    throw err;
  }
  if (!verifyCsrfToken(header, session) || !verifyCsrfToken(cookie, session)) {
    const err = new Error("INVALID_CSRF");
    err.code = "INVALID_CSRF";
    throw err;
  }
}

export { requireAuth as a, requireCsrf as b, getCsrfCookie as c, createCsrfToken as d, extractClientIp as e, verifyPassword as f, getSession as g, signJwt as h, setSessionCookie as i, clearSessionCookie as j, rateLimit as r, setCsrfCookie as s, verifyCsrfToken as v };

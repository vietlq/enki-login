import rlp = require('rlp');
import createKeccakHash = require('keccak');
import elliptic = require('elliptic');
const ecdsa = new elliptic.ec('secp256k1');

export const numToBE64Int = (n: number): string => {
    return n.toString(16).padStart(16, '0');
};

export const numToBE64IntBuf = (n: number): Buffer => {
    return new Buffer(numToBE64Int(n), 'hex');
};

export const numToRlpBE64IntBuf = (n: number): Buffer => {
    return rlp.encode(numToBE64IntBuf(n));
};

export const numFromRlpBE64IntBuf = (buf: Buffer): number => {
    return parseInt(rlp.decode(buf).toString('hex'), 16);
}

export const keccak256 = (inStr: string | Buffer): string => {
    return createKeccakHash('keccak256').update(inStr).digest();
};

export const pubKeyToAddr = (pubKey): string => {
    let pubKeyHash = keccak256(
        Buffer.concat([pubKey.x.toBuffer(), pubKey.y.toBuffer()]));
    return ('0x' + pubKeyHash.slice(-20).toString('hex'));
};

export const recoverPubKey = (msg: string, signatureHex: string) => {
    const sign_r = signatureHex.substr(0, 64);
    const sign_s = signatureHex.substr(64, 64);
    const sign_v = parseInt(signatureHex.substr(128), 16);
    const recoveryId = (sign_v % 2) ? 0 : 1;
    const msgHash = keccak256(msg);
    const pubKey = ecdsa.recoverPubKey(msgHash, {
        r: sign_r,
        s: sign_s,
    }, recoveryId);
    const acct = pubKeyToAddr(pubKey);
    const result = {
        pubKey: pubKey,
        acct: acct,
        s: sign_s,
        r: sign_r,
        v: sign_v
    };
    return result;
}

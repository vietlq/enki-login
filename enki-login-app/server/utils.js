const rlp = require('rlp');
const createKeccakHash = require('keccak');
const elliptic = require('elliptic');
const ecdsa = elliptic.ec('secp256k1');

const numToBE64Int = (n) => {
  return n.toString(16).padStart(16, '0');
};

const numToBE64IntBuf = (n) => {
  return new Buffer(numToBE64Int(n), 'hex');
};

const numToRlpBE64IntBuf = (n) => {
  return rlp.encode(numToBE64IntBuf(n));
};

const numFromRlpBE64IntBuf = (buf) => {
  return parseInt(rlp.decode(buf).toString('hex'), 16);
}

const keccak256 = (inStr) => {
  return createKeccakHash('keccak256').update(inStr).digest();
};

const pubKeyToAddr = (pubKey) => {
  let pubKeyHash = keccak256(Buffer.concat([pubKey.x.toBuffer(), pubKey.y.toBuffer()]));
  return ('0x' + pubKeyHash.slice(-20).toString('hex'));
};

const recoverPubKey = (msg, signatureHex) => {
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

module.exports = {
    numToBE64Int: numToBE64Int,
    numToBE64IntBuf: numToBE64IntBuf,
    numToRlpBE64IntBuf: numToRlpBE64IntBuf,
    numFromRlpBE64IntBuf: numFromRlpBE64IntBuf,
    keccak256: keccak256,
    pubKeyToAddr: pubKeyToAddr,
    recoverPubKey: recoverPubKey,
};

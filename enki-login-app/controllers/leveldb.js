const uuidv4 = require('uuid/v4');
const utils = require('../server/utils');

const levelup = require('levelup');
const leveldown = require('leveldown');

var db = levelup(leveldown('virtuous_id_db'));

const serveNonce = (req, res) => {
  const serverNonce = uuidv4();
  const serverEpoch = + new Date();

  db.get(serverNonce)
  .then(() => {
    return uuidv4();
  })
  .catch((err) => {
    if (err.notFound) {
      return serverNonce;
    } else {
      console.log(err);
      return serverNonce;
    }
  })
  .then((newServerNonce) => {
    const serverEpochBuf = utils.numToRlpBE64IntBuf(serverEpoch);
    db.put(serverNonce, serverEpochBuf)
    .then((value) => {
      res.send({
        serverNonce: newServerNonce,
        serverEpoch: serverEpoch
      });
    })
    .catch((err) => {
      console.log(err);
    });
  });
}

const serveSignup = (req, res) => {
  const postData = req.body;
  const rawObj = postData.rawObj;
  const signature = postData.signature;
  console.log(postData);

  // Check timeout: 0 <= Current Epoch - rawObj.serverEpoch <= TIME_OUT_LIMIT

  db.get(rawObj.serverNonce)
  .then((serverEpochBuf) => {
    const serverEpoch = utils.numFromRlpBE64IntBuf(serverEpochBuf);

    if (serverEpoch !== rawObj.serverEpoch) {
      throw `The server Epoch is not matching: Original (${serverEpoch}) vs Client (${rawObj.serverEpoch})`;
    }

    // Validate the schema of the input JSON

    // Verify the signature

    // Insert to the DB if not present
    const email = rawObj.email.trim().toLowerCase();

    db.get(email)
    .then((value) => {
      console.log(`Duplicate email found: ${email}`);

      res.send({
        success: false,
        errCode: 'SIGNUP_ERROR_EMAIL_DUP',
        errMsg: 'The email is in use!'
      });
    })
    .catch((err) => {
      if (err.notFound) {
        // ECDSA
        const acctHex = postData.acct.trim().toLowerCase();
        const signatureHex = postData.signature.trim().toLowerCase().substring(2);
        const theMessage = rawObj.netId +
                           rawObj.domain +
                           rawObj.intent +
                           rawObj.serverNonce +
                           rawObj.serverEpoch +
                           rawObj.clientNonce +
                           rawObj.clientEpoch +
                           rawObj.email +
                           rawObj.fullName;
        const recoveryResult = utils.recoverPubKey(theMessage, signatureHex);
        console.log(recoveryResult);

        if (acctHex !== recoveryResult.acct) {
          throw `Mismatch between recovered account & claimed account: Recovered(${recoveryResult.acct}) vs Client(${acctHex})`;
        }

        // Enroll the user
        db.put(email, acctHex)
        .then((value) => {
          console.log(`Successfully enrolled (${email}, ${acctHex})`);
          res.send({
            success: true,
            errCode: 'SIGNUP_SUCCESS',
            errMsg: 'Your are signed up!'
          });
        })
        .catch((err) => {
          console.log(`Error occured when saving (${email}, ${acctHex})`);
          res.send({
            success: false,
            errCode: 'SIGNUP_ERROR_NOT_SAVED',
            errMsg: 'Could not sign you up!'
          });
        });
      } else {
        console.log(`Error occured when searching for the email: ${email}`);
        res.send({
          success: false,
          errCode: 'SIGNUP_ERROR',
          errMsg: 'Could not sign you up!'
        });
      }
    });

    // Clean the DB
    db.del(rawObj.serverNonce)
    .then((value) => {
      console.log(value);
    })
    .catch((err) => {
      console.log(err);
    });
  })
  .catch((err) => {
    if (err.notFound) {
      console.log(`The nonce is not found: ${serverNonce}`);
    } else {
      console.log(err);
    }

    // Clean the DB
    db.del(rawObj.serverNonce)
    .then((value) => {
      console.log(value);
    })
    .catch((err) => {
      console.log(err);
    });

    res.send({
      success: false,
      errCode: 'SIGNUP_ERROR',
      errMsg: 'Could not sign you up!'
    });
  });
}

const serveLogin = (req, res) => {
  const postData = req.body;
  const rawObj = postData.rawObj;
  const signature = postData.signature;
  console.log(postData);

  // Check timeout: 0 <= Current Epoch - rawObj.serverEpoch <= TIME_OUT_LIMIT

  db.get(rawObj.serverNonce)
  .then((serverEpochBuf) => {
    const serverEpoch = utils.numFromRlpBE64IntBuf(serverEpochBuf);

    if (serverEpoch !== rawObj.serverEpoch) {
      throw `The server Epoch is not matching: Original (${serverEpoch}) vs Client (${rawObj.serverEpoch})`;
    }

    // Validate the schema of the input JSON

    // Verify the signature

    // Insert to the DB if not present
    const email = rawObj.email.trim().toLowerCase();

    db.get(email)
    .then((savedAcctBuf) => {
      // ECDSA
      const acctHex = postData.acct.trim().toLowerCase();
      const signatureHex = postData.signature.trim().toLowerCase().substring(2);
      const theMessage = rawObj.netId +
                         rawObj.domain +
                         rawObj.intent +
                         rawObj.serverNonce +
                         rawObj.serverEpoch +
                         rawObj.clientNonce +
                         rawObj.clientEpoch +
                         rawObj.email;
      const recoveryResult = utils.recoverPubKey(theMessage, signatureHex);
      console.log(recoveryResult);
      const savedAcctHex = savedAcctBuf.toString();

      if (acctHex !== recoveryResult.acct) {
        const errMsg = `Mismatch between recovered account & claimed account: Recovered(${recoveryResult.acct}) vs Client(${acctHex})`;
        console.log(errMsg);
        throw errMsg;
      }

      if (acctHex !== savedAcctHex) {
        const errMsg = `The claimed account has not been saved yet: Saved(${savedAcctHex}) vs Client(${acctHex})`;
        console.log(errMsg);
        throw errMsg;
      }

      // TODO: Record user login with IP, time, cookie...
      res.send({
        success: true,
        errCode: 'LOGIN_SUCCESS',
        errMsg: 'Successful login!'
      });
    })
    .catch((err) => {
      if (err.notFound) {
        console.log(`Email not found: ${email}`);
        res.send({
          success: false,
          errCode: 'LOGIN_ERROR_NO_EMAIL',
          errMsg: 'Could not login!'
        });
      } else {
        console.log(`Error occured when searching for the email: ${email}`);
        res.send({
          success: false,
          errCode: 'LOGIN_ERROR',
          errMsg: 'Could not login!'
        });
      }
    });

    // Clean the DB
    db.del(rawObj.serverNonce)
    .then((value) => {
      console.log(value);
    })
    .catch((err) => {
      console.log(err);
    });
  })
  .catch((err) => {
    if (err.notFound) {
      console.log(`The nonce is not found: ${serverNonce}`);
    } else {
      console.log(err);
    }

    // Clean the DB
    db.del(rawObj.serverNonce)
    .then((value) => {
      console.log(value);
    })
    .catch((err) => {
      console.log(err);
    });

    res.send({
      success: false,
      errCode: 'LOGIN_ERROR',
      errMsg: 'Could not login!'
    });
  });
}

module.exports = {
    serveNonce: serveNonce,
    serveSignup: serveSignup,
    serveLogin: serveLogin,
};

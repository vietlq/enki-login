const uuidv4 = require('uuid/v4');
const utils = require('../server/utils');
import { Request, Response, NextFunction } from 'express';

import mongoose = require('mongoose');
import { Nonce } from '../models/nonce';
import { User } from '../models/user';

import { runtimeCfg } from '../server/getconfig';

// https://scotch.io/tutorials/using-mongoosejs-in-node-js-and-mongodb-applications
mongoose.connect(runtimeCfg.connectionString)
.then((val) => {
    console.log("Successfully connected to the MongoDB");
})
.catch((error) => {
    console.error("Could not connect to the MongoDB:");
    console.error(error);
    throw ('Could not connect to the MongoDB!')
});

export const serveNonce = (req: Request, res: Response) => {
    const serverNonce = uuidv4();
    const serverEpoch = + new Date();

    Nonce.findOne({ serverNonce: serverNonce })
    .then((nonce) => {
        if (nonce === null) {
            return uuidv4();
        }
    })
    .catch((err) => {
        return serverNonce;
    })
    .then((newServerNonce: string) => {
        const nonce = new Nonce({
            serverNonce: newServerNonce,
            serverEpoch: serverEpoch
        });
        nonce.save()
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

export const serveSignup = (req: Request, res: Response) => {
    const postData = req.body;
    const rawObj = postData.rawObj;
    const signature = postData.signature;
    console.log(postData);

    // Check timeout: 0 <= Current Epoch - rawObj.serverEpoch <= TIME_OUT_LIMIT

    Nonce.findOne({ serverNonce: rawObj.serverNonce })
    .then((nonce) => {
        if (nonce === null || nonce === undefined) {
            const errMsg = `The server nonce is not found: ${rawObj.serverNonce}`;
            console.error(errMsg);
            throw errMsg;
        }

        const serverEpoch = parseInt(nonce.serverEpoch);

        if (serverEpoch !== rawObj.serverEpoch) {
            throw `The server Epoch is not matching: Original (${serverEpoch}) vs Client (${rawObj.serverEpoch})`;
        }

        // Validate the schema of the input JSON

        // Verify the signature

        // Insert to the DB if not present
        const email = rawObj.email.trim().toLowerCase();

        User.findOne({ email: email })
        .then((user) => {
            console.error(user);
            if (user !== undefined && user !== null) {
                console.log(user);
                console.log(`Duplicate email found: ${email}`);

                res.send({
                    success: false,
                    errCode: 'SIGNUP_ERROR_EMAIL_DUP',
                    errMsg: 'The email is in use!'
                });

                return false;
            } else {
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
                const user = new User({ email: email, addr: acctHex });
                user.save()
                .then((value) => {
                    console.log(`Successfully enrolled (${email}, ${acctHex})`);
                    res.send({
                        success: true,
                        errCode: 'SIGNUP_SUCCESS',
                        errMsg: 'Your are signed up!'
                    });
                })
                .catch((err) => {
                    console.error(`Error occured when saving (${email}, ${acctHex})`);
                    res.send({
                        success: false,
                        errCode: 'SIGNUP_ERROR_NOT_SAVED',
                        errMsg: 'Could not sign you up!'
                    });
                });

                return true;
            }
        })
        .catch((err) => {
            console.error(`Error occured when searching for the email: ${email}`);
            res.send({
                success: false,
                errCode: 'SIGNUP_ERROR',
                errMsg: 'Could not sign you up!'
            });
        });

        // Clean the DB
        Nonce.findOneAndRemove({ serverNonce: rawObj.serverNonce })
        .then((value) => {
            console.log(value);
        })
        .catch((err) => {
            console.log(err);
        });
    })
    .catch((err) => {
        console.log(err);

        // Clean the DB
        Nonce.findOneAndRemove({ serverNonce: rawObj.serverNonce })
        .catch((err) => {
            console.error(err);
        });

        res.send({
            success: false,
            errCode: 'SIGNUP_ERROR',
            errMsg: 'Could not sign you up!'
        });
    });
}

export const serveLogin = (req: Request, res: Response) => {
    const postData = req.body;
    const rawObj = postData.rawObj;
    const signature = postData.signature;
    console.log(postData);

    // Check timeout: 0 <= Current Epoch - rawObj.serverEpoch <= TIME_OUT_LIMIT

    Nonce.findOne({ serverNonce: rawObj.serverNonce })
    .then((nonce) => {
        if (nonce === null || nonce === undefined) {
            const errMsg = `The server nonce is not found: ${rawObj.serverNonce}`;
            console.error(errMsg);
            throw errMsg;
        }

        const serverEpoch = parseInt(nonce.serverEpoch);

        if (serverEpoch !== rawObj.serverEpoch) {
            throw `The server Epoch is not matching: Original (${serverEpoch}) vs Client (${rawObj.serverEpoch})`;
        }

        // Validate the schema of the input JSON

        // Verify the signature

        // Insert to the DB if not present
        const email = rawObj.email.trim().toLowerCase();

        User.findOne({ email: email })
        .then((user) => {
            if (user === undefined || user === null) {
                console.log(`Email not found: ${email}`);
                res.send({
                    success: false,
                    errCode: 'LOGIN_ERROR_NO_EMAIL',
                    errMsg: 'Could not login!'
                });
                return false;
            }
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

            if (acctHex !== recoveryResult.acct) {
                const errMsg = `Mismatch between recovered account & claimed account: Recovered(${recoveryResult.acct}) vs Client(${acctHex})`;
                console.log(errMsg);
                throw errMsg;
            }

            if (acctHex !== user.addr) {
                const errMsg = `The claimed account has not been saved yet: Saved(${user.addr}) vs Client(${acctHex})`;
                console.log(errMsg);
                throw errMsg;
            }

            // TODO: Record user login with IP, time, cookie...
            res.send({
                success: true,
                errCode: 'LOGIN_SUCCESS',
                errMsg: 'Successful login!'
            });

            return true;
        })
        .catch((err) => {
            console.log(`Error occured when searching for the email: ${email}`);
            res.send({
                success: false,
                errCode: 'LOGIN_ERROR',
                errMsg: 'Could not login!'
            });
        });

        // Clean the DB
        Nonce.findOneAndRemove({ serverNonce: rawObj.serverNonce })
        .then((value) => {
            console.log(value);
        })
        .catch((err) => {
            console.log(err);
        });
    })
    .catch((err) => {
        console.log(err);

        // Clean the DB
        Nonce.findOneAndRemove({ serverNonce: rawObj.serverNonce })
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

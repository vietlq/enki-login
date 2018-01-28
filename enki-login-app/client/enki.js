// https://www.uglifyjs.net/
// https://web3js.readthedocs.io/en/1.0/callbacks-promises-events.html

function Enki(domain) {
  this.web3js = null;

  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    this.web3js = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!');
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    this.web3js = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/"));
  }

  this._context = {
    domain: domain
  };

  this.ETH_NETWORKS = {
    '1': "Mainnet",
    '2': "Morden",
    '3': "Ropsten",
    '4': "Rinkeby",
    '42': "Kovan",
  };

  var self = this;

  ////////////////////////////////////////////////////////////////

  Enki.prototype.fetchNetworkId = () => {
    return new Promise(function(resolve, reject) {
      self.web3js.version.getNetwork((error, netId) => {
        if (error) {
          // Nullify
          self._context.netId = null;
          return reject(error);
        } else {
          // Give it to the context
          self._context.netId = netId;
          return resolve(netId);
        }
      });
    });
  }

  Enki.prototype.cachedAccounts = () => {
    return self._context.accounts;
  }

  Enki.prototype.fetchAccounts = () => {
    var promise = new Promise(function(resolve, reject) {
      self.web3js.eth.getAccounts(function(error, accounts) {
        if (error) {
          return reject(error);
        } else {
          return resolve(accounts);
        }
      });
    });

    return promise.then((accounts) => {
      // Give it to the context
      self._context.accounts = accounts;

      // Some logging would be nice
      console.log("Got accounts: ");
      console.log(accounts);
    })
    .catch((error) => {
      alert("Could not fetch accounts!");
      console.log(error);
      // Nullify
      self._context.accounts = null;
    })
  }

  Enki.prototype.getBalance = (acct) => {
    return new Promise((resolve, reject) => {
      self.web3js.eth.getBalance(acct, function(error, balance) {
        if (error) {
          console.error(error);
          reject(error);
        } else {
          const balanceInDec = balance.toNumber() / 1000000000000000000;
          console.log(`Balance for the account ${acct} is ${balanceInDec}`);
          return balanceInDec;
        }
      });
    })
  }

  Enki.prototype.startApp = () => {
    // Obtain Network ID
    return Enki.prototype.fetchNetworkId()
    .catch((error) => {
      alert("Could not retrieve Network ID!");
    })
    .then((netId) => {
      // Populate the accounts
      return Enki.prototype.fetchAccounts()
      .then((accounts) => {
        return { netId: netId, accounts: accounts }
      });
    });
  }

  Enki.prototype.getServerNonce = () => {
    return axios.get('/nonce')
    .then(function(response) {
      return response.data;
    })
    .catch(function(error) {
      alert('Could not obtain nonce from the server');
      console.log(error);
      return null;
    });
  }

  // Challenge: KECCAK256(NetId + cfgDomain + intent + serverNonce + serverEpoch + clientNonce + clientEpoch + email)
  Enki.prototype.prepareBaseMsg = (rawBaseObj, intent) => {
    return Enki.prototype.getServerNonce()
    .then(function(serverNonceObj) {
      const clientNonce = uuidv4();
      const clientEpoch = + new Date();

      const rawObj = {
        netId: self._context.netId,
        domain: self._context.domain,
        intent: intent,
        serverNonce: serverNonceObj.serverNonce,
        serverEpoch: serverNonceObj.serverEpoch,
        clientNonce: clientNonce,
        clientEpoch: clientEpoch,
        email: rawBaseObj.email
      };

      console.log(rawObj);

      const rawMsgObj = {
        acct: rawBaseObj.acct,
        rawObj: rawObj
      };

      return rawMsgObj;
    });
  }

  // Challenge: KECCAK256(NetId + cfgDomain + serverNonce + serverEpoch + clientNonce + clientEpoch + email)
  Enki.prototype.prepareSignupMsg = (rawBaseObj) => {
    return Enki.prototype.prepareBaseMsg(rawBaseObj, 'SIGNUP')
    .then((rawMsgObj) => {
      // Inject URL
      rawMsgObj.url = '/signup';
      // Inject the full name field
      rawMsgObj.rawObj.fullName = rawBaseObj.fullName;
      // TODO: Use RLP
      const theMessage = rawMsgObj.rawObj.netId +
                         rawMsgObj.rawObj.domain +
                         rawMsgObj.rawObj.intent +
                         rawMsgObj.rawObj.serverNonce +
                         rawMsgObj.rawObj.serverEpoch +
                         rawMsgObj.rawObj.clientNonce +
                         rawMsgObj.rawObj.clientEpoch +
                         rawMsgObj.rawObj.email +
                         rawMsgObj.rawObj.fullName;
      rawMsgObj.msg = theMessage;
      return rawMsgObj;
    });
  }

  // Challenge: KECCAK256(NetId + cfgDomain + serverNonce + serverEpoch + clientNonce + clientEpoch + email)
  Enki.prototype.prepareLoginMsg = (rawBaseObj) => {
    return Enki.prototype.prepareBaseMsg(rawBaseObj, 'LOGIN')
    .then((rawMsgObj) => {
      // Inject URL
      rawMsgObj.url = '/login';
      // TODO: Use RLP
      const theMessage = rawMsgObj.rawObj.netId +
                         rawMsgObj.rawObj.domain +
                         rawMsgObj.rawObj.intent +
                         rawMsgObj.rawObj.serverNonce +
                         rawMsgObj.rawObj.serverEpoch +
                         rawMsgObj.rawObj.clientNonce +
                         rawMsgObj.rawObj.clientEpoch +
                         rawMsgObj.rawObj.email;
      rawMsgObj.msg = theMessage;
      return rawMsgObj;
    });
  }

  Enki.prototype.signMessage = (rawMsgObj) => {
    /*
    String - The signed data.
    After the hex prefix, characters correspond to ECDSA values like this:

    r = signature[0:64]
    s = signature[64:128]
    v = signature[128:130]
    */

    // Error: MetaMask Message Signature: User denied message signature.
    // Error: "message length is invalid"
    // https://github.com/emn178/js-sha3
    const hashedMsg = "0x" + keccak256(rawMsgObj.msg);

    axios.defaults.headers['Content-Type'] = 'application/vnd.api+json';
    axios.defaults.headers['Accept'] = 'application/vnd.api+json';

    var promise = new Promise(function(resolve, reject) {
      // TODO: Use EIP-155
      self.web3js.eth.sign(rawMsgObj.acct, hashedMsg, function(error, signature) {
        if (error) {
          alert(error);
          return reject(error);
        } else {
          return resolve(signature);
        }
      });
    });

    return promise.then((signature) => {
      console.log(`Sending the signature: ${signature}`);
      const postData = {
        acct: rawMsgObj.acct,
        rawObj: rawMsgObj.rawObj,
        signature: signature
      }
      // Return the promise
      return axios.post(
        rawMsgObj.url,
        postData,
        { headers: { 'Content-Type': 'application/json;charset=UTF-8' } }
      )
      .then(function (response) {
        console.log(response);
        alert(`Response from ${rawMsgObj.url}: ${JSON.stringify(response.data)}`);
      })
      .catch(function (error) {
        alert('Could not send the signed message');
        console.log(error);
      });
    });
  }
}

module.exports = Enki;

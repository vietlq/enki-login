function populateNetworkId(netId) {
  const ETH_NETWORKS = window.enki.ETH_NETWORKS;
  var netIdMsg;

  switch (netId) {
    case "1":
      netIdMsg = `You are on the ${ETH_NETWORKS[netId]}.`;
      break;
    case "2":
    case "3":
    case "4":
    case "42":
      netIdMsg = `You are on the ${ETH_NETWORKS[netId]} test network.`;
      break;
    default:
      netIdMsg = `This is an unknown network with ID = ${netId}.`;
  }

  // Update UI
  $('#network-watcher').text(netIdMsg);
  console.log(netIdMsg);

  return { netId: netId, netIdMsg: netIdMsg };
}

function populateAccountMenu(modalId) {
  const accounts = window.enki.cachedAccounts();
  if (accounts === null || accounts === undefined || accounts.length === 0) {
    alert('No accounts to log in! Create or import one first.');
    return null;
  }

  var theModal = $(`#${modalId}`);
  var theAddrSelector = $(`#${modalId} .cst-input-vid-addr`).first();

  // Clear the address selector
  theAddrSelector.empty();

  accounts.map((acct) => {
    theAddrSelector.append(`<option value="${acct}">${acct}</option>`);
  });

  return theModal;
}

function showSignupModal() {
  const modalId = 'modal-signup';
  var theModal = populateAccountMenu(modalId);

  if (theModal === null || theModal === undefined) {
    return false;
  }

  theModal.modal('show');
}

function showLoginModal() {
  const modalId = 'modal-login';
  var theModal = populateAccountMenu(modalId);

  if (theModal === null || theModal === undefined) {
    return false;
  }

  theModal.modal('show');
}

function extractRawBaseObj(modalId) {
  var theEmail = $(`#${modalId} .cst-input-email`).first();
  const email = theEmail.prop('value');
  var theAddrSelector = $(`#${modalId} .cst-input-vid-addr`).first();
  const selectedIndex = theAddrSelector.prop('selectedIndex') || 0;
  const acct = theAddrSelector.children()[selectedIndex].value;

  return {
    email: email,
    acct: acct,
  };
}

function dismissSignupModal() {
  $('#modal-signup-form').trigger('reset');
  $('#modal-signup').modal('hide')
}

function dismissLoginModal() {
  $('#modal-login-form').trigger('reset');
  $('#modal-login').modal('hide')
}

function performSignup() {
  const modalId = 'modal-signup';
  var theModal = $(`#${modalId}`);

  if (theModal === null || theModal === undefined) {
    return false;
  }

  const rawBaseObj = extractRawBaseObj(modalId);

  // Inject the full name for sign up only
  rawBaseObj.fullName = $(`#${modalId} .cst-input-full-name`).first().prop('value');

  // Chain the promises
  window.enki.prepareSignupMsg(rawBaseObj)
  .then(window.enki.signMessage)
  .then((_) => {
      dismissSignupModal();
  })
  .catch((error) => {
    alert('Could not sign the message!');
  });
}

function performLogin() {
  const modalId = 'modal-login';
  var theModal = $(`#${modalId}`);

  if (theModal === null || theModal === undefined) {
    return false;
  }

  const rawBaseObj = extractRawBaseObj(modalId);

  // Chain the promises
  window.enki.prepareLoginMsg(rawBaseObj)
  .then(window.enki.signMessage)
  .then((_) => {
      dismissLoginModal();
  })
  .catch((error) => {
    alert('Could not sign the message!');
  });
}

////////////////////////////////////////////////////////////////

window.addEventListener('load', function() {
  // Now you can start your app & access web3 freely
  window.enki = new Enki('visc.network');
  window.enki.startApp()
  .then(({ netId, accounts }) => {
    populateNetworkId(netId);
  });
});

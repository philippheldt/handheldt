document.addEventListener('DOMContentLoaded', function () {
const declineButton = document.getElementById('decline');
const acceptButton = document.getElementById('accept');




Ecwid.OnAPILoaded.add(function() {
  function setConsent(consentValue) {
    // Set the consent value in Ecwid
    Ecwid.setTrackingConsent(consentValue);

    // Store the consent choice in local storage or cookies (optional for future reference)
    localStorage.setItem('cookieConsent', consentValue);

    console.log('Consent set to: ' + consentValue);

    // Hide the banner after selection
    document.getElementById('cookie-banner').style.display = 'none';
  }



  // Check if consent has already been set
  const existingConsent = localStorage.getItem('cookieConsent');
  console.log('Consent set to: ' + existingConsent);
  if (existingConsent === "ACCEPTED" || existingConsent === "DECLINED") {
    console.log('Consent already set');
    // Expose the setConsent function globally
    window.setConsent = setConsent;
  } else {

       // Set the consent in Ecwid without showing the banner
       Ecwid.setTrackingConsent(existingConsent);
       console.log('Consent not set yet');
       document.getElementById('cookie-banner').style.display = 'block';

  }

  declineButton.addEventListener('click', () => setConsent('DECLINED'));
  acceptButton.addEventListener('click', () => setConsent('ACCEPTED'));
});

});

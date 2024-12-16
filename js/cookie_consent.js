document.addEventListener('DOMContentLoaded', function () {
    const declineButton = document.getElementById('decline')
    const acceptButton = document.getElementById('accept')

    Ecwid.OnAPILoaded.add(function () {
        function setConsent(consentValue) {
            Ecwid.setTrackingConsent(consentValue)
            localStorage.setItem('cookieConsent', consentValue)
            console.log('Consent set to: ' + consentValue)
            document.getElementById('cookie-banner').style.display = 'none'
        }

        const existingConsent = localStorage.getItem('cookieConsent')

        if (existingConsent === 'ACCEPTED' || existingConsent === 'DECLINED') {
            window.setConsent = setConsent
        } else {
            Ecwid.setTrackingConsent(existingConsent)
            document.getElementById('cookie-banner').style.display = 'block'
        }

        declineButton.addEventListener('click', () => setConsent('DECLINED'))
        acceptButton.addEventListener('click', () => setConsent('ACCEPTED'))
    })
})

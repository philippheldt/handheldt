document.addEventListener('DOMContentLoaded', function () {
    const banner = document.getElementById('cookie-banner')
    const declineButton = document.getElementById('decline')
    const acceptButton = document.getElementById('accept')

    const existingConsent = localStorage.getItem('cookieConsent')
    const hasDecided = existingConsent === 'ACCEPTED' || existingConsent === 'DECLINED'

    // Ecwid wird nur auf Shop-Seiten geladen. Ohne Entscheidung gilt "abgelehnt".
    function applyEcwidConsent(consentValue) {
        if (typeof Ecwid === 'undefined') return
        if (typeof Ecwid.setTrackingConsent === 'function') {
            Ecwid.setTrackingConsent(consentValue)
        } else {
            Ecwid.OnAPILoaded.add(function () {
                Ecwid.setTrackingConsent(consentValue)
            })
        }
    }

    function setConsent(consentValue) {
        localStorage.setItem('cookieConsent', consentValue)
        applyEcwidConsent(consentValue)
        banner.style.display = 'none'
    }

    applyEcwidConsent(hasDecided ? existingConsent : 'DECLINED')
    banner.style.display = hasDecided ? 'none' : 'block'

    declineButton.addEventListener('click', () => setConsent('DECLINED'))
    acceptButton.addEventListener('click', () => setConsent('ACCEPTED'))

    // Erlaubt das erneute Öffnen des Banners (z. B. aus dem Footer)
    window.openCookieSettings = function () {
        banner.style.display = 'block'
    }
})

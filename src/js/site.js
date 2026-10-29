// Header und Footer kommen aus src/_includes, hier nur Warenkorb-Zähler und Mobilmenü

function updateCartCount() {
    let count = 0
    try {
        const cart = JSON.parse(localStorage.getItem('handheldt_cart')) || []
        count = cart.reduce((sum, item) => sum + item.quantity, 0)
    } catch (e) {}
    document.getElementById('cart-count').innerText = count > 0 ? count : ''
}
updateCartCount()
window.updateCartCount = updateCartCount

document
    .getElementById('hamburger-menu')
    .addEventListener('change', function () {
        const navMobile = document.getElementById('nav-mobile')
        navMobile.classList.toggle('closed', !this.checked)
        this.setAttribute('aria-label', this.checked ? 'Menü schließen' : 'Menü öffnen')
    })


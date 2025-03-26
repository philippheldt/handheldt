const productObject = document.querySelector('#produktauswahl')
const productColor = document.querySelector('#farbauswahl')
const frontConfig = document.querySelector('#vorne-konfiguration')
const backConfig = document.querySelector('#hinten-konfiguration')
const sonderwunschConfig = document.querySelector('#sonderwunsch-konfiguration')

const frontCheckbox = document.querySelector('#vorne-option')
const backCheckbox = document.querySelector('#hinten-option')
const sonderwunschCheckbox = document.querySelector('#sonderwunsch-option')

function createForm(data) {
    console.log(data)
    var i = 0
    Object.keys(data).forEach((product) => {
        // create a radio button for each product
        // add checked value to the first radio button

        const radio = document.createElement('input')
        if (i === 0) {
            radio.checked = true
            loadColors(product)
            loadConfiguration(product, true)
            loadConfiguration(product, false)
        }
        radio.type = 'radio'
        radio.name = 'product'
        radio.value = product
        radio.id = product
        radio.setAttribute('data-code', data[product].Produktcode)
        productObject.appendChild(radio)

        i++
    })
}

fetch('druckoptionen.json')
    .then((response) => response.json())
    .then((data) => createForm(data))
    .catch((error) => console.error('Fehler beim Laden der Daten:', error))

//depending on the selected product, the corresponding data gets loaded and displayed

productObject.addEventListener('change', (event) => {
    const product = event.target.value
    loadColors(product)
    loadConfiguration(product, true)
    loadConfiguration(product, false)
})

function loadColors(produktAuswahl) {
    fetch(`druckoptionen.json`)
        .then((response) => response.json())
        .then((data) => {
            productColor.innerHTML = '<h2>Farbe</h2>'
            const productData = data[produktAuswahl]

            var i = 0
            Object.entries(productData.Farben).forEach(
                ([colorName, colorCode]) => {
                    const radio = document.createElement('input')
                    if (i === 0) {
                        radio.checked = true
                    }
                    radio.type = 'radio'
                    radio.name = 'color'
                    radio.value = colorName
                    radio.id = colorName
                    radio.setAttribute('data-code', colorCode)
                    productColor.appendChild(radio)
                    i++
                }
            )
        })
        .catch((error) => console.error('Fehler beim Laden der Daten:', error))
}

function loadConfiguration(produktAuswahl, druckbereich) {
    fetch(`druckoptionen.json`)
        .then((response) => response.json())
        .then((data) => {
            const frontData = druckbereich
                ? data[produktAuswahl].Vorne
                : data[produktAuswahl].Hinten

            const frontBack = druckbereich
                ? '#vorne-konfiguration'
                : '#hinten-konfiguration'

            const frontBackValue = druckbereich ? 'front' : 'back'

            document.querySelector(frontBack).style.display = 'none'

            frontSizeElement = document.querySelector(frontBack + ' .size')

            var i = 0
            frontSizeElement.innerHTML = '<h4>Größe</h4>'
            Object.entries(frontData.Druckgroessen).forEach(
                ([sizeName, sizeCode]) => {
                    const radio = document.createElement('input')
                    if (i === 0) {
                        radio.checked = true
                    }
                    radio.type = 'radio'
                    radio.name = frontBackValue + '-size'
                    radio.value = sizeName
                    radio.id = sizeName
                    radio.setAttribute('data-code', sizeCode)
                    frontSizeElement.appendChild(radio)
                    i++
                }
            )

            const frontPositionElement = document.querySelector(
                frontBack + ' .position'
            )

            i = 0
            frontPositionElement.innerHTML = '<h4>Position</h4>'
            Object.entries(frontData.Druckpositionen).forEach(
                ([positionName, positionCode]) => {
                    const radio = document.createElement('input')
                    if (i === 0) {
                        radio.checked = true
                    }
                    radio.type = 'radio'
                    radio.name = frontBackValue + '-position'
                    radio.value = positionName
                    radio.id = positionName
                    radio.setAttribute('data-code', positionCode)
                    frontPositionElement.appendChild(radio)
                    i++

                    if (positionCode === 'HPSO' || positionCode === 'VPSO') {
                        const text = document.createElement('input')
                        text.type = 'text'
                        text.name = 'sonderwunsch-text'
                        text.placeholder = 'Sonderwunsch'
                        text.id = frontBackValue + '-sonderwunsch-text'
                        text.style.display = 'none'
                        frontPositionElement.appendChild(text)
                    }

                    //check if HPSO or VPSO is selected and show text input/ hide text input
                    radio.addEventListener('change', (event) => {
                        if (
                            positionCode === 'HPSO' ||
                            positionCode === 'VPSO'
                        ) {
                            const sonderwunschText = document.querySelector(
                                `#${frontBackValue}-sonderwunsch-text`
                            )
                            sonderwunschText.style.display = 'block'
                        } else {
                            const sonderwunschText = document.querySelector(
                                `#${frontBackValue}-sonderwunsch-text`
                            )
                            sonderwunschText.style.display = 'none'
                        }
                    })
                }
            )

            const frontColorElement = document.querySelector(
                frontBack + ' .farbe'
            )

            i = 0
            frontColorElement.innerHTML =
                '<h4>Anzahl der Farben auf dem Motiv</h4>'
            Object.entries(frontData.Druckfarben).forEach(
                ([colorName, colorCode]) => {
                    const radio = document.createElement('input')
                    if (i === 0) {
                        radio.checked = true
                    }
                    radio.type = 'radio'
                    radio.name = frontBackValue + '-color-number'
                    radio.value = colorName
                    radio.id = colorName
                    radio.setAttribute('data-code', colorCode)
                    frontColorElement.appendChild(radio)
                    i++
                }
            )
        })
        .catch((error) => console.error('Fehler beim Laden der Daten:', error))
}

frontCheckbox.addEventListener('change', (event) => {
    const checked = event.target.checked
    checked
        ? (frontConfig.style.display = 'block')
        : (frontConfig.style.display = 'none')
})

backCheckbox.addEventListener('change', (event) => {
    const checked = event.target.checked
    checked
        ? (backConfig.style.display = 'block')
        : (backConfig.style.display = 'none')
})

sonderwunschCheckbox.addEventListener('change', (event) => {
    const checked = event.target.checked
    checked
        ? (sonderwunschConfig.style.display = 'block')
        : (sonderwunschConfig.style.display = 'none')
})

const mengenauswahl = document.querySelectorAll('input[name="mengenauswahl"]')
const anzahlGenau = document.querySelector('#anzahl-genau')
const anzahlGrob = document.querySelector('#anzahl-grob')

mengenauswahl.forEach((radio) => {
    radio.addEventListener('change', (event) => {
        if (event.target.value === 'genau') {
            anzahlGenau.style.display = 'block'
            anzahlGrob.style.display = 'none'
        } else {
            anzahlGenau.style.display = 'none'
            anzahlGrob.style.display = 'block'
        }
    })
})

const lieferdatumauswahl = document.querySelectorAll(
    'input[name="lieferdatumauswahl"]'
)
const lieferdatumGenau = document.querySelector('#lieferdatum')
lieferdatumauswahl.forEach((radio) => {
    radio.addEventListener('change', (event) => {
        if (event.target.value === 'datum') {
            lieferdatumGenau.style.display = 'block'
        } else {
            lieferdatumGenau.style.display = 'none'
        }
    })
})

document.addEventListener('change', (event) => {
    const selectedProduct = document.querySelector(
        'input[name="product"]:checked'
    )
    const selectedColor = document.querySelector('input[name="color"]:checked')

    //LOG FRONT CONFIGURATION

    const selectedFrontSize = document.querySelector(
        'input[name="front-size"]:checked'
    )
    const selectedFrontPosition = document.querySelector(
        'input[name="front-position"]:checked'
    )
    const selectedFrontColorNumber = document.querySelector(
        'input[name="front-color-number"]:checked'
    )

    var frontSetup = `${selectedProduct.getAttribute(
        'data-code'
    )}-${selectedColor.getAttribute('data-code')}`

    const frontCheckedQuery = document.querySelector(
        'input[name="vorne-option"]:checked'
    )

    frontCheckedQuery
        ? (frontSetup += `-${selectedFrontSize.getAttribute(
              'data-code'
          )}-${selectedFrontPosition.getAttribute(
              'data-code'
          )}-${selectedFrontColorNumber.getAttribute('data-code')}`)
        : null

    console.log('front: ' + frontSetup)

    //LOG BACK CONFIGURATION

    const selectedBackSize = document.querySelector(
        'input[name="back-size"]:checked'
    )
    const selectedBackPosition = document.querySelector(
        'input[name="back-position"]:checked'
    )
    const selectedBackColorNumber = document.querySelector(
        'input[name="back-color-number"]:checked'
    )

    var backSetup = `${selectedProduct.getAttribute(
        'data-code'
    )}-${selectedColor.getAttribute('data-code')}`

    const backCheckedQuery = document.querySelector(
        'input[name="hinten-option"]:checked'
    )

    backCheckedQuery
        ? (backSetup += `-${selectedBackSize.getAttribute(
              'data-code'
          )}-${selectedBackPosition.getAttribute(
              'data-code'
          )}-${selectedBackColorNumber.getAttribute('data-code')}`)
        : null

    console.log('back: ' + backSetup)
})

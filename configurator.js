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
        productObject.innerHTML =
            productObject.innerHTML +
            `<label for="${product}" class="radio-item">
                <img src="img/configurator/test-image.png" alt="">
                <div class="label-text">${product}</div>
                <input type="radio" name="product" value="${product}" id="${product}" data-code="${
                data[product].Produktcode
            }" ${i === 0 ? 'checked' : ''}>
            </label>`

        if (i === 0) {
            loadColors(product)
            loadConfiguration(product, true)
            loadConfiguration(product, false)
        }
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
            productColor.innerHTML = ''
            const productData = data[produktAuswahl]

            var i = 0
            Object.entries(productData.Farben).forEach(
                ([colorName, colorCode]) => {
                    productColor.innerHTML =
                        productColor.innerHTML +
                        `<label for="${colorName}" class="radio-item">
                            <img src="img/configurator/test-image.png" alt="">
                            <div class="label-text">${colorName}</div>
                            <input type="radio" name="color" value="${colorName}" id="${colorName}" data-code="${colorCode}" ${
                            i === 0 ? 'checked' : ''
                        } >
                        </label>`
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
                    frontSizeElement.innerHTML =
                        frontSizeElement.innerHTML +
                        `<label for="${frontBackValue}-${sizeName}" class="radio-item">
                            <img src="img/configurator/test-image.png" alt="">
                            <div class="label-text">${sizeName}</div>
                            <input type="radio" name="${frontBackValue}-size" value="${frontBackValue}-${sizeName}" id="${frontBackValue}-${sizeName}" data-code="${sizeCode}" ${
                            i === 0 ? 'checked' : ''
                        }>
                        </label>`
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
                    frontPositionElement.innerHTML =
                        frontPositionElement.innerHTML +
                        `<label for="${frontBackValue}-${positionName}" class="radio-item">
                            <img src="img/configurator/test-image.png" alt="">
                            <div class="label-text">${positionName}</div>
                            <input type="radio" name="${frontBackValue}-position" value="${frontBackValue}-${positionName}" id="${frontBackValue}-${positionName}" data-code="${positionCode}" ${
                            i === 0 ? 'checked' : ''
                        }>
                        </label>`

                    i++
                    if (positionCode === 'HPSO' || positionCode === 'VPSO') {
                        frontPositionElement.innerHTML =
                            frontPositionElement.innerHTML +
                            `<input type="text" name="sonderwunsch-text" placeholder="Sonderwunsch" id="${frontBackValue}-sonderwunsch-text" style="display:none">`
                    }

                    document
                        .querySelectorAll(
                            "input[name='" + frontBackValue + "-position']"
                        )
                        .forEach((radio) => {
                            radio.addEventListener('change', (event) => {
                                if (
                                    event.target.getAttribute('data-code') ===
                                        'HPSO' ||
                                    event.target.getAttribute('data-code') ===
                                        'VPSO'
                                ) {
                                    document.querySelector(
                                        '#' +
                                            frontBackValue +
                                            '-sonderwunsch-text'
                                    ).style.display = 'block'
                                    console.log('show')
                                } else {
                                    document.querySelector(
                                        '#' +
                                            frontBackValue +
                                            '-sonderwunsch-text'
                                    ).style.display = 'none'
                                    console.log('hide')
                                }
                            })
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
                    frontColorElement.innerHTML =
                        frontColorElement.innerHTML +
                        `
                    <label for="${frontBackValue}-${colorName}" class="radio-item">
                        <img src="img/configurator/test-image.png" alt="">
                        <div class="label-text">${colorName}</div>
                            <input type="radio" name="${frontBackValue}-anzahl" value="${frontBackValue}-${colorName}" id="${frontBackValue}-${colorName}" data-code="${colorCode}" ${
                            i === 0 ? 'checked' : ''
                        }>
                        </label>`
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

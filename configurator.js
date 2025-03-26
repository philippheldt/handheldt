const productObject = document.querySelector('#produktauswahl')
const productColor = document.querySelector('#farbauswahl')
const frontConfig = document.querySelector('#vorne-konfiguration')
const backConfig = document.querySelector('#hinten-konfiguration')
const sonderwunschConfig = document.querySelector('#sonderwunsch-konfiguration')

const frontCheckbox = document.querySelector('#vorne-option')
const backCheckbox = document.querySelector('#hinten-option')
const sonderwunschCheckbox = document.querySelector('#sonderwunsch-option')

const colorHexMapping = {
    C001: '#F1F1F1',
    C002: '#2F2F2F',
    C004: '#A32E40',
    C005: '#FEBCCA',
    C007: '#ECE8DC',
    C018: '#EDE9E6',
    C028: '#BCAC9D',
    C036: '#013D3E',
    C048: '#BE7D1A',
    C053: '#4E7DB1',
    C054: '#F9EFD8',
    C063: '#B9B7CC',
    C088: '#1E2D70',
    C089: '#A6B8AC',
    C101: '#F0AE96',
    C112: '#D4A77E',
    C116: '#52323A',
    C129: '#EC98BA',
    C142: '#E6B372',
    C143: '#FB6445',
    C144: '#6B8883',
    C145: '#4AC1E8',
    C146: '#EBE6ED',
    C147: '#F6E9E2',
    C149: '#B2D0EC',
    C115: '#614790',
    C204: '#F6B846',
    C223: '#636359',
    C244: '#592930',
    C250: '#D3D3D3',
    C253: '#5D5D5D',
    C355: '#BD8D99',
    C356: '#E8CC87',
    C357: '#69AEAA',
    C358: '#AAA696',
    C504: '#EFEBE7',
    C591: '#41455B',
    C651: '#A2A1A6',
    C652: '#464D5D',
    C702: '#405361',
    C715: '#444A5D',
    C727: '#1F1E30',
    C728: '#D8E2E3',
    C729: '#306FA4',
    C730: '#A64D3B',
    C731: '#DED4CB',
    C735: '#A4CDAF',
}

function createForm(data) {
    console.log(data)
    var i = 0
    Object.keys(data).forEach((product) => {
        productObject.innerHTML =
            productObject.innerHTML +
            `<label for="${product}" class="radio-item">
                <img src="img/configurator/${
                    data[product].Produktcode
                }.png" alt="">
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
                    //take colorCode and get the corresponding hex value
                    const colorHex = colorHexMapping[colorCode]
                    productColor.innerHTML =
                        productColor.innerHTML +
                        `<label for="${colorName}" class="radio-item color">
                            <div class="color-preview" style="background-color: ${colorHex};"></div>
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
                            i === 1 ? 'checked' : ''
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
var grobQuery = true

mengenauswahl.forEach((radio) => {
    radio.addEventListener('change', (event) => {
        if (event.target.value === 'genau') {
            anzahlGenau.style.display = 'grid'
            anzahlGrob.style.display = 'none'
            grobQuery = false
        } else {
            anzahlGenau.style.display = 'none'
            anzahlGrob.style.display = 'block'
            grobQuery = true
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
        'input[name="front-anzahl"]:checked'
    )

    var frontSetup = `${selectedProduct.getAttribute('data-code')}`

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
        'input[name="back-anzahl"]:checked'
    )

    var backSetup = `${selectedProduct.getAttribute('data-code')}`

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

    //SONDERWUNSCH SETUP
    const sonderwunschSize = document.querySelector(
        'input[name="sonderwunsch-size"]:checked'
    )
    const sonderwunschAnzahl = document.querySelector(
        'input[name="sonderwunsch-anzahl"]:checked'
    )

    const sonderwunschCheckboxQuery = document.querySelector(
        'input[name="sonderwunsch-option"]:checked'
    )

    var sonderwunschSetup = sonderwunschCheckboxQuery
        ? `${sonderwunschSize.getAttribute(
              'data-code'
          )}-${sonderwunschAnzahl.getAttribute('data-code')}`
        : '-'
    console.log('sonderwunsch: ' + sonderwunschSetup)

    //PREVIEW UPDATER:

    const colorPreview = document.querySelector('.background-color')
    colorPreview.style.backgroundColor =
        colorHexMapping[selectedColor.getAttribute('data-code')]

    const productPreview = document.querySelector('.product-preview')
    productPreview.src = `img/configurator/config/${frontSetup}.png`

    //PRICE UPDATER
    var priceMin = 0
    var priceMax = 0

    //Get all data-codes form each selected element and take the corresponding price from the Prices object
    frontSetup.split('-').forEach((element) => {
        console.log(element)
        if (element in Prices) {
            priceMin += Prices[element]
            priceMax += Prices[element]
        } else if (element + 'MIN' in Prices && element + 'MAX' in Prices) {
            priceMax += Prices[element + 'MAX']
            priceMin += Prices[element + 'MIN']
        }
    })

    backSetup.split('-').forEach((element) => {
        console.log(element)
        if (element in Prices) {
            priceMin += Prices[element]
            priceMax += Prices[element]
        }
    })

    sonderwunschSetup.split('-').forEach((element) => {
        console.log(element)
        if (element in Prices) {
            priceMin += Prices[element]
            priceMax += Prices[element]
        }
    })

    const priceElement = document.querySelector('#gesamtpreis')
    const priceSingleElement = document.querySelector('#stueckpreis')
    const multiplicatorGrob = document.querySelector(
        '#mengenauswahl-grob'
    ).value
    const multiplicatorGenauArray = document.querySelectorAll(
        '.mengenauswahl-genau'
    )
    var multiplicatorGenau = 0
    multiplicatorGenauArray.forEach((element) => {
        multiplicatorGenau += Number(element.value)
    })

    const multiplicator = grobQuery ? multiplicatorGrob : multiplicatorGenau
    console.log(grobQuery)

    priceElement.innerHTML = `${priceMin * multiplicator} € - ${
        priceMax * multiplicator
    } €`

    if (multiplicator > 1) {
        priceSingleElement.innerHTML = `${priceMin} € - ${priceMax} € stk.`
    } else {
        priceSingleElement.innerHTML = ''
    }

    console.log('min: ' + priceMin)
    console.log('max: ' + priceMax)
})

const Prices = {
    TSHIMIN: 6,
    TSHIMAX: 12,
    TOTEMIN: 3,
    TOTEMAX: 6,
    VKLE: 1,
    VMIT: 2,
    VGRO: 3,
    HKLE: 1,
    HMIT: 2,
    HGRO: 3,
    SKLE: 1,
    SMIT: 2,
    SGRO: 3,
    VZ1F: 0,
    VZ2F: 2,
    VZME: 4,
    HZ1F: 0,
    HZ2F: 2,
    HZME: 4,
    SZ1F: 0,
    SZ2F: 2,
    SZME: 4,
    MARGMIN: 2,
    MARGMAX: 6,
}

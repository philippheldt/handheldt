const swiper = new Swiper('.swiper', {
    // Optional parameters
    direction: 'horizontal',
    loop: false,
    effect: 'cards',

    cardsEffect: {
        perSlideOffset: 6, // Space between cards in px
        perSlideRotate: 2, // Rotation of cards in degrees
        slideShadows: false,
    },

    // If we need pagination
    pagination: {
        el: '.swiper-pagination',
    },

    // Navigation arrows
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },

    // And if we need scrollbar
    scrollbar: {
        el: '.swiper-scrollbar',
        hide: 'true',
    },
})

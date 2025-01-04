const swiper = new Swiper('.swiper', {
    // Optional parameters
    direction: 'horizontal',
    loop: true,
    effect: 'cards',
    speed: 700,

    autoplay: {
        delay: 10000,
        disableOnInteraction: true,
        pauseOnMouseEnter: true,
    },

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

// Select all videos in the Swiper slides
const videos = document.querySelectorAll('.blog-video')

// Listen for play events on each video
videos.forEach((video) => {
    video.addEventListener('play', () => {
        // Stop Swiper autoplay when a video starts playing
        swiper.autoplay.stop()
    })
})

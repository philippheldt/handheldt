document.querySelector('.video-overlay').addEventListener('click', function () {
    const video = document.querySelector('#nepal-video')
    const mutedIcon = document.querySelector('.loudspeaker-icon.muted')
    const unmutedIcon = document.querySelector('.loudspeaker-icon.unmuted')

    if (video.muted) {
        video.muted = false
        video.currentTime = 0
        video.play()

        mutedIcon.style.display = 'none'
        unmutedIcon.style.display = 'block'
    } else {
        video.muted = true
        mutedIcon.style.display = 'block'
        unmutedIcon.style.display = 'none'
    }
})

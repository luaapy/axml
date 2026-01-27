/**
 * Studio Mixer Logic
 */
function initMixerEvents(player) {
    const faders = document.querySelectorAll('.fader-cap');
    faders.forEach(cap => {
        cap.onmousedown = (e) => {
            e.preventDefault();
            const track = cap.parentElement;
            const bounds = track.getBoundingClientRect();

            const moveHandler = (moveEvent) => {
                let y = moveEvent.clientY - bounds.top;
                y = Math.max(0, Math.min(bounds.height, y));
                const percent = 1 - (y / bounds.height);
                cap.style.bottom = (percent * 100) + '%';

                // Apply volume change
                const channel = track.closest('.mixer-channel');
                const trackName = channel.dataset.track;
                if (trackName === 'master') {
                    if (player.master) player.master.gain.value = percent;
                } else {
                    if (player.trackGains && player.trackGains[trackName]) {
                        player.trackGains[trackName].gain.value = percent;
                    }
                }
            };

            const upHandler = () => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', upHandler);
            };

            window.addEventListener('mousemove', moveHandler);
            window.addEventListener('mouseup', upHandler);
        };
    });
}

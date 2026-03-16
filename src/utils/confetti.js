import confetti from 'canvas-confetti'

export function launchCompletionConfetti() {
  const end = Date.now() + 900
  const colors = ['#EC0017', '#E2B43C', '#00FFF7']

  ;(function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    })
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    })

    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

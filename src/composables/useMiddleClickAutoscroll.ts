import { onMounted, onBeforeUnmount } from 'vue'

export function useMiddleClickAutoscroll() {
  let isAutoscrolling = false
  let startX = 0
  let startY = 0
  let targetContainer: HTMLElement | null = null
  let animId: number | null = null
  let indicatorEl: HTMLElement | null = null
  let currentY = 0

  const getScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
    let current: HTMLElement | null = el
    while (current && current !== document.body && current !== document.documentElement) {
      const style = window.getComputedStyle(current)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight) {
        return current
      }
      current = current.parentElement
    }
    const mainContent = document.querySelector('.main-content') as HTMLElement | null
    if (mainContent && mainContent.scrollHeight > mainContent.clientHeight) {
      return mainContent
    }
    return document.documentElement
  }

  const stopAutoscroll = () => {
    if (!isAutoscrolling) return
    isAutoscrolling = false
    if (animId) {
      cancelAnimationFrame(animId)
      animId = null
    }
    if (indicatorEl && indicatorEl.parentNode) {
      indicatorEl.parentNode.removeChild(indicatorEl)
      indicatorEl = null
    }
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onStopEvent)
    window.removeEventListener('mousedown', onStopEvent, true)
    window.removeEventListener('wheel', stopAutoscroll)
    window.removeEventListener('keydown', onKeyDown)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') stopAutoscroll()
  }

  const onStopEvent = () => {
    stopAutoscroll()
  }

  const onMouseMove = (e: MouseEvent) => {
    currentY = e.clientY
  }

  const scrollLoop = () => {
    if (!isAutoscrolling || !targetContainer) return

    const deltaY = currentY - startY
    const deadZone = 12

    if (Math.abs(deltaY) > deadZone) {
      const dir = deltaY > 0 ? 1 : -1
      const dist = Math.abs(deltaY) - deadZone
      // Desplazamiento dinámico y suave que permite navegar cientos de canciones con rapidez
      const speed = dir * Math.min(65, Math.pow(dist / 14, 1.35))
      targetContainer.scrollTop += speed
    }

    animId = requestAnimationFrame(scrollLoop)
  }

  const onMouseDown = (e: MouseEvent) => {
    if (e.button !== 1) { // 1 = Botón central del ratón (rueda)
      if (isAutoscrolling) stopAutoscroll()
      return
    }

    if (isAutoscrolling) {
      stopAutoscroll()
      e.preventDefault()
      return
    }

    const container = getScrollContainer(e.target as HTMLElement)
    if (!container) return

    e.preventDefault()
    isAutoscrolling = true
    startX = e.clientX
    startY = e.clientY
    currentY = e.clientY
    targetContainer = container

    // Icono flotante con indicador visual de autoscroll
    indicatorEl = document.createElement('div')
    indicatorEl.className = 'autoscroll-circle-indicator'
    indicatorEl.innerHTML = `<i class="bi bi-arrow-down-up"></i>`
    indicatorEl.style.left = `${startX - 18}px`
    indicatorEl.style.top = `${startY - 18}px`
    document.body.appendChild(indicatorEl)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('wheel', stopAutoscroll, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    setTimeout(() => {
      window.addEventListener('mousedown', onStopEvent, { once: true, capture: true })
    }, 120)

    animId = requestAnimationFrame(scrollLoop)
  }

  onMounted(() => {
    window.addEventListener('mousedown', onMouseDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('mousedown', onMouseDown)
    stopAutoscroll()
  })
}

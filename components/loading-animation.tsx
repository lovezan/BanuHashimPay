"use client"

import { useRef, useEffect, useState } from "react"

export default function LoadingAnimation({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"))

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768)
    }

    updateCanvasSize()

    const bgColor = isDark ? "#1a1512" : "#f9f7f4"
    const primaryColor = isDark ? "#d4a373" : "#2d2520"
    const accentColor = isDark ? "#c9a87a" : "#a0826d"
    const particleColor = isDark ? "#d4a373" : "#2d2520"

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      life: number
    }[] = []

    let textImageData: ImageData | null = null

    function createTextImage() {
      if (!ctx || !canvas) return 0

      ctx.fillStyle = particleColor
      ctx.save()

      const fontSize = isMobile ? 40 : 80
      ctx.font = `bold ${fontSize}px sans-serif`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const text = "BANI HASHIM PAY"
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width

      ctx.fillText(text, canvas.width / 2, canvas.height / 2)

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return fontSize / 80
    }

    function createParticle(scale: number) {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          return {
            x: x + (Math.random() * 20 - 10),
            y: y + (Math.random() * 20 - 10),
            baseX: x,
            baseY: y,
            size: Math.random() * 1.5 + 0.5,
            color: particleColor,
            scatteredColor: accentColor,
            life: Math.random() * 100 + 50,
          }
        }
      }

      return null
    }

    function createInitialParticles(scale: number) {
      const baseParticleCount = 5000
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle(scale)
        if (particle) particles.push(particle)
      }
    }

    let animationFrameId: number
    const startTime = Date.now()
    const animationDuration = 5000

    function animate(scale: number) {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 240
      const elapsedTime = Date.now() - startTime
      const animationProgress = Math.min(elapsedTime / animationDuration, 1)

      if (elapsedTime >= animationDuration) {
        cancelAnimationFrame(animationFrameId)
        onComplete()
        return
      }

      const formingPhase = animationProgress < 0.4
      const stablePhase = animationProgress >= 0.4 && animationProgress < 0.8
      const scatterPhase = animationProgress >= 0.8

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        if (formingPhase) {
          p.x += (p.baseX - p.x) * 0.1
          p.y += (p.baseY - p.y) * 0.1
          ctx.fillStyle = particleColor
        } else if (stablePhase) {
          p.x = p.baseX + Math.sin(Date.now() * 0.001 + i) * 1
          p.y = p.baseY + Math.cos(Date.now() * 0.002 + i) * 1
          ctx.fillStyle = particleColor
        } else if (scatterPhase) {
          const scatterFactor = (animationProgress - 0.8) / 0.2
          const angle = Math.random() * Math.PI * 2
          const distance = 50 + Math.random() * 200

          p.x += Math.cos(angle) * distance * 0.05 * scatterFactor
          p.y += Math.sin(angle) * distance * 0.05 * scatterFactor

          ctx.globalAlpha = 1 - scatterFactor
          ctx.fillStyle = accentColor
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)
        ctx.globalAlpha = 1
      }

      animationFrameId = requestAnimationFrame(() => animate(scale))
    }

    const scale = createTextImage()
    createInitialParticles(scale)
    animate(scale)

    const handleResize = () => {
      updateCanvasSize()
      const newScale = createTextImage()
      particles = []
      createInitialParticles(newScale)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile, isDark, onComplete])

  return (
    <div className="fixed inset-0 z-50 dark:bg-[#1a1512] bg-[#f9f7f4]">
      <canvas
        ref={canvasRef}
        className="w-full h-full absolute top-0 left-0 touch-none"
        aria-label="Bani Hashim Pay loading animation"
      />
    </div>
  )
}

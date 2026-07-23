import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'

const SignaturePad = forwardRef(function SignaturePad({ penColor = '#ffffff' }, ref) {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width || 400
    canvas.height = rect.height || 160

    ctx.strokeStyle = penColor
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [penColor])

  const startDrawing = (e) => {
    isDrawingRef.current = true
    setIsEmpty(false)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    ctx.beginPath()
    ctx.moveTo(clientX - rect.left, clientY - rect.top)
  }

  const draw = (e) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    ctx.lineTo(clientX - rect.left, clientY - rect.top)
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const toDataURL = () => {
    const canvas = canvasRef.current
    return canvas ? canvas.toDataURL('image/png') : ''
  }

  useImperativeHandle(ref, () => ({
    clear,
    toDataURL,
    isEmpty: () => isEmpty,
  }))

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      className="w-full h-36 bg-surface-lowest border border-white/8 rounded-lg cursor-crosshair touch-none"
    />
  )
})

export default SignaturePad

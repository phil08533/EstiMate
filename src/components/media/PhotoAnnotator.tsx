'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Pencil, Square, ArrowRight, Type, Undo2, Save, X } from 'lucide-react'

// Konva must be client-only
const Stage = dynamic(() => import('react-konva').then(m => m.Stage), { ssr: false })
const Layer = dynamic(() => import('react-konva').then(m => m.Layer), { ssr: false })
const Line = dynamic(() => import('react-konva').then(m => m.Line), { ssr: false })
const Rect = dynamic(() => import('react-konva').then(m => m.Rect), { ssr: false })
const Arrow = dynamic(() => import('react-konva').then(m => m.Arrow), { ssr: false })
const Text = dynamic(() => import('react-konva').then(m => m.Text), { ssr: false })
const KonvaImage = dynamic(() => import('react-konva').then(m => m.Image), { ssr: false })

type Tool = 'pen' | 'rect' | 'arrow' | 'text'

interface Shape {
  type: Tool
  id: string
  points?: number[]
  x?: number
  y?: number
  width?: number
  height?: number
  text?: string
  color: string
  strokeWidth: number
}

interface PhotoAnnotatorProps {
  photoUrl: string
  annotationData: object | null
  onSave: (data: object) => Promise<void>
  onClose: () => void
}

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ffffff', '#000000']

export default function PhotoAnnotator({ photoUrl, annotationData, onSave, onClose }: PhotoAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 400, height: 300 })
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [imageSize, setImageSize] = useState({ width: 400, height: 300 })

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#ef4444')
  const [shapes, setShapes] = useState<Shape[]>([])
  const [history, setHistory] = useState<Shape[][]>([[]])
  const [historyIdx, setHistoryIdx] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentShape, setCurrentShape] = useState<Shape | null>(null)
  const [saving, setSaving] = useState(false)

  // Load image
  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = photoUrl
    img.onload = () => {
      setImage(img)
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }, [photoUrl])

  // Load existing annotations
  useEffect(() => {
    if (annotationData && Array.isArray((annotationData as { shapes?: Shape[] }).shapes)) {
      const saved = (annotationData as { shapes: Shape[] }).shapes
      setShapes(saved)
      setHistory([saved])
      setHistoryIdx(0)
    }
  }, [annotationData])

  // Measure container
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      // Maintain aspect ratio
      const ratio = imageSize.height / imageSize.width
      setSize({ width: w, height: Math.round(w * ratio) })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [imageSize])

  const scale = size.width / imageSize.width

  function genId() { return Math.random().toString(36).slice(2) }

  function pushHistory(newShapes: Shape[]) {
    const newHistory = [...history.slice(0, historyIdx + 1), newShapes]
    setHistory(newHistory)
    setHistoryIdx(newHistory.length - 1)
    setShapes(newShapes)
  }

  function undo() {
    if (historyIdx <= 0) return
    const idx = historyIdx - 1
    setHistoryIdx(idx)
    setShapes(history[idx])
  }

  function getPos(e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) {
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return { x: pos.x / scale, y: pos.y / scale }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseDown(e: any) {
    if (tool === 'text') {
      const { x, y } = getPos(e)
      const text = window.prompt('Enter text:')
      if (!text) return
      const shape: Shape = { type: 'text', id: genId(), x, y, text, color, strokeWidth: 2 }
      pushHistory([...shapes, shape])
      return
    }

    setIsDrawing(true)
    const { x, y } = getPos(e)

    if (tool === 'pen') {
      setCurrentShape({ type: 'pen', id: genId(), points: [x, y], color, strokeWidth: 3 })
    } else if (tool === 'rect') {
      setCurrentShape({ type: 'rect', id: genId(), x, y, width: 0, height: 0, color, strokeWidth: 3 })
    } else if (tool === 'arrow') {
      setCurrentShape({ type: 'arrow', id: genId(), points: [x, y, x, y], color, strokeWidth: 3 })
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseMove(e: any) {
    if (!isDrawing || !currentShape) return
    const { x, y } = getPos(e)

    if (tool === 'pen') {
      setCurrentShape(prev => prev ? {
        ...prev, points: [...(prev.points ?? []), x, y]
      } : null)
    } else if (tool === 'rect') {
      setCurrentShape(prev => prev ? {
        ...prev,
        width: x - (prev.x ?? 0),
        height: y - (prev.y ?? 0),
      } : null)
    } else if (tool === 'arrow') {
      setCurrentShape(prev => prev ? {
        ...prev,
        points: [prev.points![0], prev.points![1], x, y],
      } : null)
    }
  }

  function handleMouseUp() {
    if (!isDrawing || !currentShape) return
    setIsDrawing(false)
    pushHistory([...shapes, currentShape])
    setCurrentShape(null)
  }

  async function handleSave() {
    setSaving(true)
    await onSave({ shapes })
    setSaving(false)
    onClose()
  }

  const allShapes = currentShape ? [...shapes, currentShape] : shapes

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-gray-900">
        {/* Tools */}
        {([
          { t: 'pen' as Tool, icon: Pencil },
          { t: 'rect' as Tool, icon: Square },
          { t: 'arrow' as Tool, icon: ArrowRight },
          { t: 'text' as Tool, icon: Type },
        ]).map(({ t, icon: Icon }) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className={`p-2.5 rounded-xl ${tool === t ? 'bg-blue-600 text-white' : 'text-gray-300 active:bg-gray-700'}`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
        <div className="w-px h-8 bg-gray-700 mx-1" />
        {/* Colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <div className="ml-auto flex gap-2">
          <button onClick={undo} disabled={historyIdx === 0} className="p-2.5 text-gray-300 disabled:opacity-30 active:bg-gray-700 rounded-xl">
            <Undo2 className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2.5 text-gray-300 active:bg-gray-700 rounded-xl">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-black p-2">
        <div ref={containerRef} className="w-full max-w-2xl">
          {image && (
            <Stage
              width={size.width}
              height={size.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchMove={handleMouseMove}
              onTouchEnd={handleMouseUp}
              style={{ cursor: tool === 'text' ? 'text' : 'crosshair', touchAction: 'none' }}
            >
              {/* Background photo layer */}
              <Layer>
                <KonvaImage
                  image={image}
                  width={size.width}
                  height={size.height}
                />
              </Layer>
              {/* Drawing layer */}
              <Layer>
                {allShapes.map(shape => {
                  if (shape.type === 'pen') {
                    return (
                      <Line
                        key={shape.id}
                        points={(shape.points ?? []).map((p, i) => i % 2 === 0 ? p * scale : p * scale)}
                        stroke={shape.color}
                        strokeWidth={shape.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation="source-over"
                      />
                    )
                  }
                  if (shape.type === 'rect') {
                    return (
                      <Rect
                        key={shape.id}
                        x={(shape.x ?? 0) * scale}
                        y={(shape.y ?? 0) * scale}
                        width={(shape.width ?? 0) * scale}
                        height={(shape.height ?? 0) * scale}
                        stroke={shape.color}
                        strokeWidth={shape.strokeWidth}
                        fill="transparent"
                      />
                    )
                  }
                  if (shape.type === 'arrow') {
                    return (
                      <Arrow
                        key={shape.id}
                        points={(shape.points ?? []).map(p => p * scale)}
                        stroke={shape.color}
                        fill={shape.color}
                        strokeWidth={shape.strokeWidth}
                      />
                    )
                  }
                  if (shape.type === 'text') {
                    return (
                      <Text
                        key={shape.id}
                        x={(shape.x ?? 0) * scale}
                        y={(shape.y ?? 0) * scale}
                        text={shape.text ?? ''}
                        fill={shape.color}
                        fontSize={18}
                        fontStyle="bold"
                      />
                    )
                  }
                  return null
                })}
              </Layer>
            </Stage>
          )}
        </div>
      </div>
    </div>
  )
}

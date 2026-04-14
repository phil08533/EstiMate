'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Pencil, Type, Eraser, Hand, Undo2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import type { NoteCanvasData, NoteCanvasShape, NoteCanvasTool } from '@/lib/types'

const Stage = dynamic(() => import('react-konva').then(m => m.Stage), { ssr: false })
const Layer = dynamic(() => import('react-konva').then(m => m.Layer), { ssr: false })
const Line = dynamic(() => import('react-konva').then(m => m.Line), { ssr: false })
const Text = dynamic(() => import('react-konva').then(m => m.Text), { ssr: false })

const COLORS = ['#111827', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7']
const MIN_SCALE = 0.2
const MAX_SCALE = 5
const SCALE_BY = 1.12

interface StagePos { x: number; y: number; scale: number }

interface NoteCanvasProps {
  data: NoteCanvasData | null
  onChange?: (data: NoteCanvasData) => void
  readOnly?: boolean
}

export default function NoteCanvas({ data, onChange, readOnly = false }: NoteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 400, height: 500 })
  const [tool, setTool] = useState<NoteCanvasTool>('pen')
  const [color, setColor] = useState('#111827')
  const [strokeWidth, setStrokeWidth] = useState(3)
  const [shapes, setShapes] = useState<NoteCanvasShape[]>(data?.shapes ?? [])
  const [history, setHistory] = useState<NoteCanvasShape[][]>([data?.shapes ?? []])
  const [histIdx, setHistIdx] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [current, setCurrent] = useState<NoteCanvasShape | null>(null)
  const [stagePos, setStagePos] = useState<StagePos>({ x: 0, y: 0, scale: 1 })
  const lastDist = useRef<number | null>(null)
  const lastCenter = useRef<{ x: number; y: number } | null>(null)

  // Load external data changes
  useEffect(() => {
    const s = data?.shapes ?? []
    setShapes(s)
    setHistory([s])
    setHistIdx(0)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Measure container
  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      setSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  function genId() { return Math.random().toString(36).slice(2) }

  function pushHistory(next: NoteCanvasShape[]) {
    const h = [...history.slice(0, histIdx + 1), next]
    setHistory(h)
    setHistIdx(h.length - 1)
    setShapes(next)
    onChange?.({ shapes: next })
  }

  function undo() {
    if (histIdx <= 0) return
    const idx = histIdx - 1
    setHistIdx(idx)
    setShapes(history[idx])
    onChange?.({ shapes: history[idx] })
  }

  // Convert screen pos → logical canvas pos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getLogicalPos(e: any) {
    const stage = e.target.getStage()
    const pos = stage?.getPointerPosition()
    if (!pos) return { x: 0, y: 0 }
    return {
      x: (pos.x - stagePos.x) / stagePos.scale,
      y: (pos.y - stagePos.y) / stagePos.scale,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseDown(e: any) {
    if (readOnly || tool === 'pan') return
    if (tool === 'text') {
      const { x, y } = getLogicalPos(e)
      const text = window.prompt('Enter text:')
      if (!text) return
      pushHistory([...shapes, { type: 'text', id: genId(), x, y, text, color, strokeWidth }])
      return
    }
    setIsDrawing(true)
    const { x, y } = getLogicalPos(e)
    setCurrent({ type: tool as 'pen' | 'eraser', id: genId(), points: [x, y], color: tool === 'eraser' ? '#fff' : color, strokeWidth: tool === 'eraser' ? strokeWidth * 4 : strokeWidth })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleMouseMove(e: any) {
    if (!isDrawing || !current || readOnly || tool === 'pan') return
    const { x, y } = getLogicalPos(e)
    setCurrent(prev => prev ? { ...prev, points: [...(prev.points ?? []), x, y] } : null)
  }

  function handleMouseUp() {
    if (!isDrawing || !current) return
    setIsDrawing(false)
    pushHistory([...shapes, current])
    setCurrent(null)
  }

  // Wheel zoom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleWheel(e: any) {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const oldScale = stagePos.scale
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE,
      e.evt.deltaY < 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY
    ))
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    }
    setStagePos({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  // Pinch zoom (mobile)
  function getTouchDist(touches: React.TouchList) {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
  }
  function getTouchCenter(touches: React.TouchList) {
    return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleTouchStart(e: any) {
    if (e.evt.touches.length === 2) {
      lastDist.current = getTouchDist(e.evt.touches)
      lastCenter.current = getTouchCenter(e.evt.touches)
    } else {
      handleMouseDown(e)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleTouchMove(e: any) {
    if (e.evt.touches.length === 2 && lastDist.current !== null && lastCenter.current !== null) {
      e.evt.preventDefault()
      const newDist = getTouchDist(e.evt.touches)
      const newCenter = getTouchCenter(e.evt.touches)
      const scaleChange = newDist / lastDist.current
      const oldScale = stagePos.scale
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * scaleChange))
      setStagePos(prev => ({
        scale: newScale,
        x: newCenter.x - (newCenter.x - prev.x) * (newScale / oldScale),
        y: newCenter.y - (newCenter.y - prev.y) * (newScale / oldScale),
      }))
      lastDist.current = newDist
      lastCenter.current = newCenter
    } else {
      handleMouseMove(e)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  function handleTouchEnd(_e: any) {
    lastDist.current = null
    lastCenter.current = null
    handleMouseUp()
  }

  function zoomIn() {
    setStagePos(prev => {
      const newScale = Math.min(MAX_SCALE, prev.scale * SCALE_BY)
      const cx = size.width / 2
      const cy = size.height / 2
      return { scale: newScale, x: cx - (cx - prev.x) * (newScale / prev.scale), y: cy - (cy - prev.y) * (newScale / prev.scale) }
    })
  }

  function zoomOut() {
    setStagePos(prev => {
      const newScale = Math.max(MIN_SCALE, prev.scale / SCALE_BY)
      const cx = size.width / 2
      const cy = size.height / 2
      return { scale: newScale, x: cx - (cx - prev.x) * (newScale / prev.scale), y: cy - (cy - prev.y) * (newScale / prev.scale) }
    })
  }

  function resetView() {
    setStagePos({ x: 0, y: 0, scale: 1 })
  }

  const allShapes = current ? [...shapes, current] : shapes

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 flex-wrap">
          {/* Drawing tools */}
          {([
            { t: 'pen' as NoteCanvasTool, icon: Pencil, label: 'Pen' },
            { t: 'text' as NoteCanvasTool, icon: Type, label: 'Text' },
            { t: 'eraser' as NoteCanvasTool, icon: Eraser, label: 'Erase' },
            { t: 'pan' as NoteCanvasTool, icon: Hand, label: 'Pan' },
          ]).map(({ t, icon: Icon }) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`p-2 rounded-xl transition-colors ${tool === t ? 'bg-blue-600 text-white' : 'text-gray-400 active:bg-gray-700'}`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}

          <div className="w-px h-6 bg-gray-700 mx-0.5" />

          {/* Stroke width */}
          {[2, 4, 8].map(w => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`flex items-center justify-center w-7 h-7 rounded-xl transition-colors ${strokeWidth === w ? 'bg-blue-600' : 'active:bg-gray-700'}`}
            >
              <div className="rounded-full bg-white" style={{ width: w * 1.5, height: w * 1.5 }} />
            </button>
          ))}

          <div className="w-px h-6 bg-gray-700 mx-0.5" />

          {/* Colors */}
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-white' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="ml-auto flex items-center gap-1">
            <button onClick={undo} disabled={histIdx <= 0} className="p-2 text-gray-400 disabled:opacity-30 active:bg-gray-700 rounded-xl">
              <Undo2 className="w-4 h-4" />
            </button>
            <button onClick={zoomOut} className="p-2 text-gray-400 active:bg-gray-700 rounded-xl">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={zoomIn} className="p-2 text-gray-400 active:bg-gray-700 rounded-xl">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={resetView} className="p-2 text-gray-400 active:bg-gray-700 rounded-xl">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-white overflow-hidden"
        style={{ cursor: readOnly ? 'default' : tool === 'pan' ? 'grab' : tool === 'eraser' ? 'cell' : 'crosshair' }}
      >
        <Stage
          width={size.width}
          height={size.height}
          scaleX={stagePos.scale}
          scaleY={stagePos.scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={tool === 'pan' && !readOnly}
          onDragEnd={e => setStagePos(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }))}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <Layer>
            {allShapes.map(shape => {
              if (shape.type === 'pen' || shape.type === 'eraser') {
                return (
                  <Line
                    key={shape.id}
                    points={shape.points ?? []}
                    stroke={shape.type === 'eraser' ? 'white' : shape.color}
                    strokeWidth={shape.strokeWidth}
                    tension={0.4}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={shape.type === 'eraser' ? 'destination-out' : 'source-over'}
                    listening={false}
                  />
                )
              }
              if (shape.type === 'text') {
                return (
                  <Text
                    key={shape.id}
                    x={shape.x ?? 0}
                    y={shape.y ?? 0}
                    text={shape.text ?? ''}
                    fill={shape.color}
                    fontSize={16}
                    fontStyle="normal"
                    listening={false}
                  />
                )
              }
              return null
            })}
          </Layer>
        </Stage>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-lg pointer-events-none">
        {Math.round(stagePos.scale * 100)}%
      </div>
    </div>
  )
}

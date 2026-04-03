export function calcArea(length: number, width: number): number {
  if (!length || !width || isNaN(length) || isNaN(width)) return 0
  return parseFloat((length * width).toFixed(4))
}

export function sumAreas(areas: number[]): number {
  return parseFloat(areas.reduce((acc, a) => acc + a, 0).toFixed(4))
}

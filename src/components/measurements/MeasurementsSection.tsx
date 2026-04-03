'use client'

import { useMeasurements } from '@/lib/hooks/useMeasurements'
import MeasurementForm from './MeasurementForm'
import MeasurementList from './MeasurementList'
import TotalAreaDisplay from './TotalAreaDisplay'
import Spinner from '@/components/ui/Spinner'

export default function MeasurementsSection({ estimateId }: { estimateId: string }) {
  const { measurements, loading, addMeasurement, deleteMeasurement, totalArea } = useMeasurements(estimateId)

  if (loading) {
    return <div className="flex justify-center py-4"><Spinner /></div>
  }

  return (
    <div className="space-y-3">
      <TotalAreaDisplay totalArea={totalArea} count={measurements.length} />
      <MeasurementList measurements={measurements} onDelete={deleteMeasurement} />
      <MeasurementForm onAdd={async (m) => { await addMeasurement(m) }} />
    </div>
  )
}

import TopBar from '@/components/layout/TopBar'
import QuickCaptureForm from '@/components/estimates/QuickCaptureForm'

export default function NewEstimatePage() {
  return (
    <>
      <TopBar title="New Estimate" backHref="/estimates" />
      <QuickCaptureForm />
    </>
  )
}

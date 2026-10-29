import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

const PdfTools = lazy(() => import('./pages/PdfTools'))
const QrScanner = lazy(() => import('./pages/QrScanner'))
const ExcelTools = lazy(() => import('./pages/ExcelTools'))
const Notebook = lazy(() => import('./pages/Notebook'))
const VoiceTools = lazy(() => import('./pages/VoiceTools'))
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'))
const ImageOptimizer = lazy(() => import('./pages/ImageOptimizer'))
const CodePlayground = lazy(() => import('./pages/CodePlayground'))
const UnitConverter = lazy(() => import('./pages/UnitConverter'))
const ColorTools = lazy(() => import('./pages/ColorTools'))
const MediaTools = lazy(() => import('./pages/MediaTools'))
const ChecksumTool = lazy(() => import('./pages/ChecksumTool'))
const SvgOptimizer = lazy(() => import('./pages/SvgOptimizer'))
const DiffChecker = lazy(() => import('./pages/DiffChecker'))
const ExpenseTracker = lazy(() => import('./pages/ExpenseTracker'))
const TextTools = lazy(() => import('./pages/TextTools'))
const CalcTools = lazy(() => import('./pages/CalcTools'))
const TimerTools = lazy(() => import('./pages/TimerTools'))
const Base64Tools = lazy(() => import('./pages/Base64Tools'))
const UuidGenerator = lazy(() => import('./pages/UuidGenerator'))
const CronExplainer = lazy(() => import('./pages/CronExplainer'))
const WatermarkTool = lazy(() => import('./pages/WatermarkTool'))
const ScreenRecorder = lazy(() => import('./pages/ScreenRecorder'))
const QrGenerator = lazy(() => import('./pages/QrGenerator'))
const BarcodeGenerator = lazy(() => import('./pages/BarcodeGenerator'))
const TotpAuthenticator = lazy(() => import('./pages/TotpAuthenticator'))
const BarcodeScanner = lazy(() => import('./pages/BarcodeScanner'))
const DatabaseSandbox = lazy(() => import('./pages/DatabaseSandbox'))
const SyncHub = lazy(() => import('./pages/SyncHub'))
const SolarAutonomy = lazy(() => import('./pages/SolarAutonomy'))
const RainwaterEstimator = lazy(() => import('./pages/RainwaterEstimator'))
const MortarConcreteEstimator = lazy(() => import('./pages/MortarConcreteEstimator'))
const SwaleGradient = lazy(() => import('./pages/SwaleGradient'))

function Loading() {
  return (
    <div className="flex h-48 items-center justify-center text-sm text-slate-600 dark:text-slate-400">
      Loading tool…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="pdf"
            element={
              <Suspense fallback={<Loading />}>
                <PdfTools />
              </Suspense>
            }
          />
          <Route
            path="qr-scanner"
            element={
              <Suspense fallback={<Loading />}>
                <QrScanner />
              </Suspense>
            }
          />
          <Route path="qr" element={<Navigate to="/qr-scanner" replace />} />
          <Route
            path="excel"
            element={
              <Suspense fallback={<Loading />}>
                <ExcelTools />
              </Suspense>
            }
          />
          <Route
            path="notebook"
            element={
              <Suspense fallback={<Loading />}>
                <Notebook />
              </Suspense>
            }
          />
          <Route
            path="voice"
            element={
              <Suspense fallback={<Loading />}>
                <VoiceTools />
              </Suspense>
            }
          />
          <Route
            path="passwords"
            element={
              <Suspense fallback={<Loading />}>
                <PasswordGenerator />
              </Suspense>
            }
          />
          <Route
            path="image-optimizer"
            element={
              <Suspense fallback={<Loading />}>
                <ImageOptimizer />
              </Suspense>
            }
          />
          <Route
            path="playground"
            element={
              <Suspense fallback={<Loading />}>
                <CodePlayground />
              </Suspense>
            }
          />
          <Route
            path="convert"
            element={
              <Suspense fallback={<Loading />}>
                <UnitConverter />
              </Suspense>
            }
          />
          <Route
            path="colors"
            element={
              <Suspense fallback={<Loading />}>
                <ColorTools />
              </Suspense>
            }
          />
          <Route
            path="media"
            element={
              <Suspense fallback={<Loading />}>
                <MediaTools />
              </Suspense>
            }
          />
          <Route
            path="checksum"
            element={
              <Suspense fallback={<Loading />}>
                <ChecksumTool />
              </Suspense>
            }
          />
          <Route
            path="svg"
            element={
              <Suspense fallback={<Loading />}>
                <SvgOptimizer />
              </Suspense>
            }
          />
          <Route
            path="diff"
            element={
              <Suspense fallback={<Loading />}>
                <DiffChecker />
              </Suspense>
            }
          />
          <Route
            path="expenses"
            element={
              <Suspense fallback={<Loading />}>
                <ExpenseTracker />
              </Suspense>
            }
          />
          <Route
            path="text-tools"
            element={
              <Suspense fallback={<Loading />}>
                <TextTools />
              </Suspense>
            }
          />
          <Route
            path="calc-tools"
            element={
              <Suspense fallback={<Loading />}>
                <CalcTools />
              </Suspense>
            }
          />
          <Route
            path="timer"
            element={
              <Suspense fallback={<Loading />}>
                <TimerTools />
              </Suspense>
            }
          />
          <Route
            path="codec"
            element={
              <Suspense fallback={<Loading />}>
                <Base64Tools />
              </Suspense>
            }
          />
          <Route
            path="uuid"
            element={
              <Suspense fallback={<Loading />}>
                <UuidGenerator />
              </Suspense>
            }
          />
          <Route
            path="cron"
            element={
              <Suspense fallback={<Loading />}>
                <CronExplainer />
              </Suspense>
            }
          />
          <Route
            path="watermark"
            element={
              <Suspense fallback={<Loading />}>
                <WatermarkTool />
              </Suspense>
            }
          />
          <Route
            path="screen-recorder"
            element={
              <Suspense fallback={<Loading />}>
                <ScreenRecorder />
              </Suspense>
            }
          />
          <Route
            path="qr-generator"
            element={
              <Suspense fallback={<Loading />}>
                <QrGenerator />
              </Suspense>
            }
          />
          <Route
            path="barcode"
            element={
              <Suspense fallback={<Loading />}>
                <BarcodeGenerator />
              </Suspense>
            }
          />
          <Route
            path="totp"
            element={
              <Suspense fallback={<Loading />}>
                <TotpAuthenticator />
              </Suspense>
            }
          />
          <Route
            path="barcode-scanner"
            element={
              <Suspense fallback={<Loading />}>
                <BarcodeScanner />
              </Suspense>
            }
          />
          <Route
            path="sql"
            element={
              <Suspense fallback={<Loading />}>
                <DatabaseSandbox />
              </Suspense>
            }
          />
          <Route
            path="sync"
            element={
              <Suspense fallback={<Loading />}>
                <SyncHub />
              </Suspense>
            }
          />
          <Route
            path="solar"
            element={
              <Suspense fallback={<Loading />}>
                <SolarAutonomy />
              </Suspense>
            }
          />
          <Route
            path="rainwater"
            element={
              <Suspense fallback={<Loading />}>
                <RainwaterEstimator />
              </Suspense>
            }
          />
          <Route
            path="mix"
            element={
              <Suspense fallback={<Loading />}>
                <MortarConcreteEstimator />
              </Suspense>
            }
          />
          <Route
            path="swale"
            element={
              <Suspense fallback={<Loading />}>
                <SwaleGradient />
              </Suspense>
            }
          />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

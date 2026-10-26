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
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

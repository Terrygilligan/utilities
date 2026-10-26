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
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

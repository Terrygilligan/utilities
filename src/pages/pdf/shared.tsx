import { pdfjs } from 'react-pdf'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjs }
export { saveBlob, baseName } from '../../lib/download'
export { IconButton, LoadingNote } from '../../components/ui'

import { PdfProps } from "../types";
import * as PDFJS from "pdfjs-dist";
import type {
  PDFDocumentProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";
import { useCallback, useRef, useState, useEffect } from "react";

export default function PdfJs(props: PdfProps) {
  PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
  const { src } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
  const [currentPage, setCurrentPage] = useState(1);
  let renderTask: PDFJS.RenderTask;
  const renderPage = useCallback(
    (pageNum: number, pdf = pdfDoc) => {
      const canvas = canvasRef.current;
      if (!canvas || !pdf) return;
      canvas.height = 0;
      canvas.width = 0;
      pdf
        .getPage(pageNum)
        .then((page) => {
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          const renderContext: RenderParameters = {
            canvasContext: canvas.getContext("2d")!,
            viewport: viewport,
          };
          try {
            if (renderTask) {
              renderTask.cancel();
            }
            renderTask = page.render(renderContext);
            return renderTask.promise;
          } catch (error) {}
        })
        .catch((error) => console.log(error));
    },
    [pdfDoc]
  );
  useEffect(() => {
    renderPage(currentPage, pdfDoc);
  }, [pdfDoc, currentPage, renderPage]);
  useEffect(() => {
    const loadingTask = PDFJS.getDocument(src);
    loadingTask.promise.then(
      (loadedDoc) => {
        setPdfDoc(loadedDoc);
      },
      (error) => {
        console.error(error);
      }
    );
  }, [src]);
  const nextPage = () =>
    pdfDoc && currentPage < pdfDoc.numPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  return (
    <div>
      <button onClick={prevPage} disabled={currentPage <= 1}>
        Previous
      </button>
      <button
        onClick={nextPage}
        disabled={currentPage >= (pdfDoc?.numPages ?? -1)}
      >
        Next
      </button>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

import * as PDFJS from "pdfjs-dist";
import type {
  PDFDocumentProxy,
  TextItem,
} from "pdfjs-dist/types/src/display/api";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

export const PDF_STATUS = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
} as const;

export interface ProcessedTextItem extends TextItem {
  style: CSSProperties;
}

export const usePdfDocument = (src: string) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState<
    (typeof PDF_STATUS)[keyof typeof PDF_STATUS]
  >(PDF_STATUS.idle);
  const [error, setError] = useState<Error | null>(null);
  const [sentences, setSentences] = useState<ProcessedTextItem[][]>([]);

  useEffect(() => {
    setStatus(PDF_STATUS.loading);
    setError(null);
    setPdfDoc(undefined);
    setCurrentPage(1);
    setSentences([]);

    const loadingTask = PDFJS.getDocument(src);
    loadingTask.promise
      .then((loadedDoc) => {
        setPdfDoc(loadedDoc);
        setStatus(PDF_STATUS.success);
      })
      .catch((err) => {
        if (err.name === "AbortException") {
          return;
        }
        console.error("Failed to load PDF:", err);
        setError(
          err instanceof Error ? err : new Error("An unknown error occurred"),
        );
        setStatus(PDF_STATUS.error);
      });
  }, [src]);

  const goToNextPage = () => {
    if (pdfDoc && currentPage < pdfDoc.numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return {
    pdfDoc,
    currentPage,
    status,
    error,
    sentences,
    setSentences,
    goToNextPage,
    goToPrevPage,
  };
};

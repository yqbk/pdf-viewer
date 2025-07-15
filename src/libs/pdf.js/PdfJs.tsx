import * as PDFJS from "pdfjs-dist";
import type {
	PDFDocumentProxy,
	PDFPageProxy,
	RenderParameters,
} from "pdfjs-dist/types/src/display/api";
import { useEffect, useRef, useState } from "react";
import {
	CanvasWrapper,
	ControlButton,
	ControlsContainer,
	PageInfo,
	StatusMessage,
	ViewerContainer,
} from "./styles";
import type { PdfProps } from "./types";

// It's best practice to set the worker path once at the application's entry point,
// but if this component is the only place it's used, setting it here is acceptable.
PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

// --- Custom Hook for PDF Logic ---
// This encapsulates all the complex logic related to loading and rendering the PDF.
function usePdfDocument(src: string) {
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
	const [currentPage, setCurrentPage] = useState(1);
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [error, setError] = useState<Error | null>(null);

	// Load the PDF document
	useEffect(() => {
		// Reset state when the src changes
		setStatus("loading");
		setError(null);
		setPdfDoc(undefined);
		setCurrentPage(1);

		const loadingTask = PDFJS.getDocument(src);
		loadingTask.promise
			.then((loadedDoc) => {
				setPdfDoc(loadedDoc);
				setStatus("success");
			})
			.catch((err) => {
				// Ignore destroy errors
				if (err.name === "AbortException") {
					return;
				}
				console.error("Failed to load PDF:", err);
				setError(
					err instanceof Error ? err : new Error("An unknown error occurred"),
				);
				setStatus("error");
			});

		// Cleanup function to destroy the loading task if the component unmounts
		return () => {
			// Check if the task is still active before destroying it.
			if (!loadingTask.destroyed) {
				loadingTask.destroy();
			}
		};
	}, [src]);

	const nextPage = () => {
		if (pdfDoc && currentPage < pdfDoc.numPages) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const prevPage = () => {
		if (currentPage > 1) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	return {
		pdfDoc,
		currentPage,
		status,
		error,
		nextPage,
		prevPage,
		setCurrentPage,
	};
}

// --- PdfViewer Component ---
function PdfViewer({
	pdfDoc,
	currentPage,
	status,
	error,
	nextPage,
	prevPage,
	canvasRef,
}: {
	pdfDoc: PDFDocumentProxy | undefined;
	currentPage: number;
	status: "idle" | "loading" | "success" | "error";
	error: Error | null;
	nextPage: () => void;
	prevPage: () => void;
	canvasRef: React.RefObject<HTMLCanvasElement>;
}) {
	if (status === "loading") {
		return (
			<ViewerContainer>
				<StatusMessage>Loading PDF...</StatusMessage>
			</ViewerContainer>
		);
	}
	if (status === "error") {
		return (
			<ViewerContainer>
				<StatusMessage>Error loading PDF: {error?.message}</StatusMessage>
			</ViewerContainer>
		);
	}
	return (
		<ViewerContainer>
			<CanvasWrapper $isVisible={status === "success"}>
				<canvas ref={canvasRef} />
			</CanvasWrapper>
			<ControlsContainer>
				<ControlButton
					type="button"
					onClick={prevPage}
					disabled={currentPage <= 1 || status !== "success"}
				>
					Previous
				</ControlButton>
				<PageInfo>
					Page {currentPage} of {pdfDoc?.numPages ?? "..."}
				</PageInfo>
				<ControlButton
					type="button"
					onClick={nextPage}
					disabled={
						!pdfDoc || currentPage >= pdfDoc.numPages || status !== "success"
					}
				>
					Next
				</ControlButton>
			</ControlsContainer>
		</ViewerContainer>
	);
}

// --- Main Component ---
// Now the component is much cleaner and only responsible for UI.
export default function PdfJs(props: PdfProps) {
	const { src } = props;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const renderTaskRef = useRef<PDFJS.RenderTask | null>(null);
	const { pdfDoc, currentPage, status, error, nextPage, prevPage } =
		usePdfDocument(src);

	// Render a page
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !pdfDoc) return;

		// Cancel any previous render task to prevent race conditions
		if (renderTaskRef.current) {
			renderTaskRef.current.cancel();
		}

		let isCancelled = false;

		pdfDoc.getPage(currentPage).then((page: PDFPageProxy) => {
			if (isCancelled) return;

			const viewport = page.getViewport({ scale: 1.5 });
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const renderContext: RenderParameters = {
				canvasContext: canvas.getContext("2d")!,
				viewport: viewport,
			};

			renderTaskRef.current = page.render(renderContext);
			renderTaskRef.current.promise.catch((err) => {
				// Ignore cancellation errors
				if (err.name !== "RenderingCancelledException") {
					console.error("Failed to render page:", err);
				}
			});
		});

		// Cleanup function to run when currentPage or pdfDoc changes
		return () => {
			isCancelled = true;
			if (renderTaskRef.current) {
				renderTaskRef.current.cancel();
			}
		};
	}, [pdfDoc, currentPage]);

	return (
		<PdfViewer
			pdfDoc={pdfDoc}
			currentPage={currentPage}
			status={status}
			error={error}
			nextPage={nextPage}
			prevPage={prevPage}
			canvasRef={canvasRef}
		/>
	);
}

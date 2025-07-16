import * as PDFJS from "pdfjs-dist";
import type {
	PDFDocumentProxy,
	PDFPageProxy,
	RenderParameters,
	TextItem,
} from "pdfjs-dist/types/src/display/api";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import styled from "styled-components";

// It's best practice to set the worker path once at the application's entry point,
// but if this component is the only place it's used, setting it here is acceptable.
PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

// --- Styled Components ---
const ViewerContainer = styled.div`
	background-color: var(--background);
	color: var(--foreground);
`;

const ControlsContainer = styled.div`
	margin-bottom: 1rem;
	display: flex;
	align-items: center;
	gap: 1rem;
`;

const ControlButton = styled.button`
	padding: 0.5rem 1rem;
	border-radius: 4px;
	border: 1px solid rgba(0, 0, 0, 0.1);
	background-color: var(--background);
	color: var(--foreground);
	cursor: pointer;
	transition: background-color 0.2s ease-in-out;

	&:hover:not(:disabled) {
		background-color: rgba(0, 0, 0, 0.05);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
`;

const PageInfo = styled.span`
	margin: 0 1rem;
`;

const StatusMessage = styled.div`
	padding: 1rem;
	text-align: center;
`;

const PdfWrapper = styled.div`
	position: relative;
`;

const CanvasWrapper = styled.div<{ $isVisible: boolean }>`
	border: 1px solid rgba(0, 0, 0, 0.1);
	display: ${(props) => (props.$isVisible ? "block" : "none")};
`;

const TextLayer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none; /* Pass clicks through to the canvas */
`;

const TextSpan = styled.span<{ $isHighlighted: boolean; $isActive: boolean }>`
	position: absolute;
	white-space: pre;
	pointer-events: all; /* Allow mouse events on the spans */
	cursor: pointer;
	/* The text is made visible here for debugging alignment. Set to 'transparent' for final use. */
	color: transparent;
	background-color: ${(props) => {
		if (props.$isActive) return "rgba(255, 165, 0, 0.4)"; // Active color
		if (props.$isHighlighted) return "rgba(255, 255, 0, 0.3)"; // Hover color
		return "transparent";
	}};
`;

// --- Types ---
interface ProcessedTextItem extends TextItem {
	style: CSSProperties;
}

export interface PdfProps {
	src: string;
}

// --- Custom Hook for PDF Logic ---
// This encapsulates all the complex logic related to loading and rendering the PDF.
function usePdfDocument(src: string) {
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy>();
	const [currentPage, setCurrentPage] = useState(1);
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const [error, setError] = useState<Error | null>(null);
	const [sentences, setSentences] = useState<ProcessedTextItem[][]>([]);

	// Load the PDF document
	useEffect(() => {
		// Reset state when the src changes
		setStatus("loading");
		setError(null);
		setPdfDoc(undefined);
		setCurrentPage(1);
		setSentences([]);

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
		sentences,
		setSentences,
		nextPage,
		prevPage,
	};
}

// --- Main Component ---
export default function PdfJs(props: PdfProps) {
	const { src } = props;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const renderTaskRef = useRef<PDFJS.RenderTask | null>(null);
	const [hoveredSentence, setHoveredSentence] = useState<number | null>(null);
	const [activeSentence, setActiveSentence] = useState<number | null>(null);
	const {
		pdfDoc,
		currentPage,
		status,
		error,
		sentences,
		setSentences,
		nextPage,
		prevPage,
	} = usePdfDocument(src);

	// Render a page and extract text content
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || !pdfDoc || status !== "success") return;

		// Cancel any previous render task to prevent race conditions
		if (renderTaskRef.current) {
			renderTaskRef.current.cancel();
		}

		let isCancelled = false;

		pdfDoc.getPage(currentPage).then(async (page: PDFPageProxy) => {
			if (isCancelled) return;

			const viewport = page.getViewport({ scale: 1.5 });
			canvas.height = viewport.height;
			canvas.width = viewport.width;

			const context = canvas.getContext("2d");
			if (!context) {
				console.error("Failed to get 2D context from canvas");
				return;
			}

			const renderContext: RenderParameters = {
				canvasContext: context,
				viewport: viewport,
			};

			renderTaskRef.current = page.render(renderContext);
			await renderTaskRef.current.promise.catch((err) => {
				if (err.name !== "RenderingCancelledException") {
					console.error("Failed to render page:", err);
				}
			});

			// Get text content to build the highlight layer
			const textContent = await page.getTextContent();
			const allWords: ProcessedTextItem[] = [];

			textContent.items.forEach((item) => {
				if (!("str" in item) || !item.str.trim()) return;

				const itemWords = item.str.split(/(\s+)/); // Split by space, keeping spaces
				const style = textContent.styles[item.fontName];
				const itemTransform = PDFJS.Util.transform(
					viewport.transform,
					item.transform,
				);

				context.font = `${Math.hypot(itemTransform[2], itemTransform[3])}px ${
					style.fontFamily
				}`;

				let accumulatedWidth = 0;

				itemWords.forEach((word) => {
					if (!word.trim()) {
						// It's whitespace, just accumulate width
						accumulatedWidth += context.measureText(word).width;
						return;
					}

					const wordWidth = context.measureText(word).width;

					const wordTransform = [...itemTransform];
					wordTransform[0] = wordWidth;
					wordTransform[4] += accumulatedWidth;

					const wordStyle: CSSProperties = {
						left: 0,
						top: 0,
						height: "1px",
						width: "1px",
						fontFamily: style.fontFamily,
						fontSize: "1px",
						transform: `matrix(${wordTransform.join(", ")})`,
						transformOrigin: "0% 0%",
					};

					allWords.push({
						...item,
						str: word,
						width: wordWidth,
						style: wordStyle,
					});

					accumulatedWidth += wordWidth;
				});
			});

			// Group words into sentences
			const groupedSentences: ProcessedTextItem[][] = [];
			let currentSentence: ProcessedTextItem[] = [];
			allWords.forEach((word) => {
				currentSentence.push(word);
				if (/[.?!]/.test(word.str)) {
					groupedSentences.push(currentSentence);
					currentSentence = [];
				}
			});
			if (currentSentence.length > 0) {
				groupedSentences.push(currentSentence);
			}

			setSentences(groupedSentences);
		});

		// Cleanup function to run when currentPage or pdfDoc changes
		return () => {
			isCancelled = true;
			if (renderTaskRef.current) {
				renderTaskRef.current.cancel();
			}
		};
	}, [pdfDoc, currentPage, status, setSentences]);

	const handleSentenceClick = (sentenceIndex: number) => {
		setActiveSentence((prev) =>
			prev === sentenceIndex ? null : sentenceIndex,
		);
	};

	if (status === "loading") {
		return <StatusMessage>Loading PDF...</StatusMessage>;
	}

	if (status === "error") {
		return <StatusMessage>Error loading PDF: {error?.message}</StatusMessage>;
	}

	return (
		<ViewerContainer>
			<ControlsContainer>
				<ControlButton
					type="button"
					onClick={prevPage}
					disabled={currentPage <= 1}
				>
					Previous
				</ControlButton>
				<PageInfo>
					Page {currentPage} of {pdfDoc?.numPages ?? "..."}
				</PageInfo>
				<ControlButton
					type="button"
					onClick={nextPage}
					disabled={!pdfDoc || currentPage >= pdfDoc.numPages}
				>
					Next
				</ControlButton>
			</ControlsContainer>

			<PdfWrapper>
				<CanvasWrapper $isVisible={status === "success"}>
					<canvas ref={canvasRef} />
				</CanvasWrapper>
				<TextLayer>
					{sentences.map((sentence, sentenceIndex) =>
						sentence.map((word, wordIndex) => (
							<TextSpan
								key={`${sentenceIndex}-${wordIndex}`}
								style={word.style}
								onMouseEnter={() => setHoveredSentence(sentenceIndex)}
								onMouseLeave={() => setHoveredSentence(null)}
								onClick={() => handleSentenceClick(sentenceIndex)}
								$isHighlighted={hoveredSentence === sentenceIndex}
								$isActive={activeSentence === sentenceIndex}
							>
								{word.str}
							</TextSpan>
						)),
					)}
				</TextLayer>
			</PdfWrapper>
		</ViewerContainer>
	);
}

import * as PDFJS from "pdfjs-dist";
import type {
  PDFPageProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  CanvasWrapper,
  ControlButton,
  ControlsContainer,
  PageInfo,
  PdfWrapper,
  StatusMessage,
  TextLayer,
  TextSpan,
  ViewerContainer,
} from "./styles";
import {
  PDF_STATUS,
  type ProcessedTextItem,
  usePdfDocument,
} from "./usePdfDocument";

interface PdfProps {
  src: string;
}

PDFJS.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

const PdfJs = ({ src }: PdfProps) => {
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
    goToNextPage: nextPage,
    goToPrevPage: prevPage,
  } = usePdfDocument(src);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc || status !== PDF_STATUS.success) return;
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
      const textContent = await page.getTextContent();
      const allWords: ProcessedTextItem[] = [];

      textContent.items.forEach((item) => {
        if (!("str" in item) || !item.str.trim()) return;

        const itemWords = item.str.split(/(\s+)/);
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

  if (status === PDF_STATUS.loading) {
    return <StatusMessage>Loading PDF...</StatusMessage>;
  }

  if (status === PDF_STATUS.error) {
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
        <CanvasWrapper $isVisible={status === PDF_STATUS.success}>
          <canvas ref={canvasRef} />
        </CanvasWrapper>

        <TextLayer>
          {sentences.map((sentence, sentenceIndex) =>
            sentence.map((word, wordIndex) => (
              <TextSpan
                // biome-ignore lint/suspicious/noArrayIndexKey: using mixed key
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
};

export default PdfJs;

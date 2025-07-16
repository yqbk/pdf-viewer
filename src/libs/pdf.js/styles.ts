import styled from "styled-components";

export const ViewerContainer = styled.div`
    background-color: var(--background);
    color: var(--foreground);
`;

export const ControlsContainer = styled.div`
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
`;

export const ControlButton = styled.button`
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

export const PageInfo = styled.span`
    margin: 0 1rem;
`;

export const StatusMessage = styled.div`
    padding: 1rem;
    text-align: center;
`;

export const PdfWrapper = styled.div`
    position: relative;
`;

export const CanvasWrapper = styled.div<{ $isVisible: boolean }>`
    border: 1px solid rgba(0, 0, 0, 0.1);
    display: ${(props) => (props.$isVisible ? "block" : "none")};
`;

export const TextLayer = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none; /* Pass clicks through to the canvas */
`;

export const TextSpan = styled.span<{
  $isHighlighted: boolean;
  $isActive: boolean;
}>`
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

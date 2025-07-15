import styled from "styled-components";

// --- Styled Components ---
export const ViewerContainer = styled.div`
    font-family: sans-serif;
`;

export const ControlsContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: space-between;
    // margin: 1rem;
`;

export const ControlButton = styled.button`
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: #f0f0f0;
    cursor: pointer;

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

export const CanvasWrapper = styled.div<{ $isVisible: boolean }>`
    border: 1px solid #ccc;
    display: ${(props) => (props.$isVisible ? "block" : "none")};
`;

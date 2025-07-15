"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { getDocument } from "./pdfjsConfig";

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  margin-top: 20px;
`;

export default function HomeContent() {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        console.log('0. start', )
        if (getDocument) {
            
            console.log('1. getDocument', )
          const loadingTask = getDocument("/pan_tadeusz.pdf");
          const pdf = await loadingTask.promise;
          console.log('2. pdf', pdf)

          setNumPages(pdf.numPages);
        }
      } catch (err: any) {
        setError("Failed to load PDF: " + (err?.message || "Unknown error"));
      }
    };
    
    loadPdf();
  }, []);

  return (
    <Page>
      <Main>
        <p>main</p>
        <Title>PDF Example</Title>

        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : numPages !== null ? (
          <p>Number of pages: {numPages}</p>
        ) : (
          <p>Loading PDF...</p>
        )}
      </Main>
    </Page>
  );
}

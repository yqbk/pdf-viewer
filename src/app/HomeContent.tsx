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

  useEffect(() => {
    const loadPdf = async () => {
      if (getDocument) {
        const loadingTask = getDocument("public/pan_tadeusz.pdf");
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
      }
    };
    loadPdf();
  }, []);

  return (
    <Page>
      <Main>
        <p>main</p>
        <Title>PDF Example</Title>
        {numPages !== null ? (
          <p>Number of pages: {numPages}</p>
        ) : (
          <p>Loading PDF...</p>
        )}
      </Main>
    </Page>
  );
}

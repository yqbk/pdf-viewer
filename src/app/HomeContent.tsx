"use client";

import dynamic from "next/dynamic";
import { Main, Page, Title } from "./styles";

const PdfJs = dynamic(() => import("@/libs/pdf.js/PdfJs"), {
  ssr: false,
});

const FILE = "example";

export default function HomeContent() {
  return (
    <Page>
      <Main>
        <Title>{FILE}</Title>

        <PdfJs src={`/${FILE}.pdf`} />
      </Main>
    </Page>
  );
}

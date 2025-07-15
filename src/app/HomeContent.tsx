"use client";

import dynamic from "next/dynamic";
import { Main, Page, Title } from "./styles";

const PdfJs = dynamic(() => import("@/libs/pdf.js/PdfJs"), {
	ssr: false,
});

export default function HomeContent() {
	return (
		<Page>
			<Main>
				<Title>PDF Example</Title>

				<PdfJs src="/pan_tadeusz.pdf" />
			</Main>
		</Page>
	);
}

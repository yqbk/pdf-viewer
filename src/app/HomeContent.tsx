"use client";

import PdfJs from "../libs/pdf.js/PdfJs";
import { Main, Page, Title } from "./styles";

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

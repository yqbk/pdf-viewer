# PDF Word & Sentence Highlighter POC

This project is a Proof of Concept built with Next.js and `pdf.js` to demonstrate a high-accuracy, frontend-first approach to highlighting individual words and sentences within a PDF document.

The core challenge is to overcome the inaccuracies of backend text-coordinate estimation by using the precise data provided by `pdf.js`'s `getTextContent()` API to create a perfectly aligned, interactive text layer on top of a rendered PDF canvas.

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (with React & TypeScript)
* **PDF Rendering:** [pdf.js](https://mozilla.github.io/pdf.js/)
* **Styling:** [styled-components](https://styled-components.com/)
* **Tooling:** [Biome](https://biomejs.dev/) for formatting and linting

## Getting Started

Follow these steps to get the project running locally.

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or later)
* [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation & Setup


1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

2.  **Add a PDF file:**
    Place the PDF file you want to view inside the `/public` directory. For example, `/public/my-document.pdf`.

3.  **Update the PDF source:**
    In `src/app/page.tsx` (or wherever you are using the `PdfJs` component), update the `src` prop to point to your PDF file:
    ```tsx
    <PdfJs src="/my-document.pdf" />
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

* `pnpm dev`: Runs the app in development mode.
* `pnpm build`: Builds the app for production.
* `pnpm start`: Starts a production server.

## Technical Approach

This POC validates the approach discussed in the [mozilla/pdf.js#15922](https://github.com/mozilla/pdf.js/issues/15922) issue. The core strategy involves two main layers:

1.  **Canvas Layer:** The PDF page is rendered to a standard HTML `<canvas>` element. This layer is for visual presentation only and has no direct user interaction.

2.  **Text Overlay Layer:** A transparent `<div>` is positioned absolutely on top of the canvas. This layer is populated with individual `<span>` elements, one for each word on the page.

### High-Accuracy Positioning

The key to the high accuracy is how these `<span>` elements are positioned:

* After rendering the canvas, we call `page.getTextContent()` to get an array of all text items on the page.
* Each item contains a `transform` matrix, which defines its precise position, scale, and skew.
* The code iterates through each text item, splits it into individual words, and calculates a new, unique transform matrix for each word by offsetting it based on the measured width of the preceding words.
* This matrix is then applied to the `<span>` element using a CSS `transform: matrix(...)`, resulting in a pixel-perfect overlay.

### Sentence Detection

To highlight entire sentences, the flat array of words is processed and grouped into sentences. The logic detects a sentence break based on condition:
1.  The word ends with punctuation (`.`, `?`, `!`).

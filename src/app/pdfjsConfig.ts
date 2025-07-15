let pdfjs: any;
let GlobalWorkerOptions: any;
let getDocument: any;
let version: string;

(async () => {
  pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  GlobalWorkerOptions = pdfjs.GlobalWorkerOptions;
  getDocument = pdfjs.getDocument;
  version = pdfjs.version;
  GlobalWorkerOptions.workerSrc = "/pdf.worker.js";
})();

export { GlobalWorkerOptions, getDocument, version };

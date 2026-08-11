// 1. 設定 PDF.js Worker 檔案路徑
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// 2. 設定 PDF 檔案清單與當前狀態
const pdfFiles = [
    'pdfs/00_toc.pdf',
    'pdfs/01_pref1.pdf',
    'pdfs/02_pref2.pdf',
    'pdfs/03_pref3.pdf',
    'pdfs/04_pref4.pdf'
];

let currentPdfIndex = 0;
let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
const scale = 1.5;

// 3. 渲染指定頁面 (加入 null 安全檢查)
function renderPage(num) {
    const canvas = document.getElementById('pdf-render');
    if (!canvas) {
        console.error('錯誤：找不到 id="pdf-render" 的 canvas 元素！');
        return;
    }
    const ctx = canvas.getContext('2d');

    pageRendering = true;
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(function() {
            pageRendering = false;
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });

    const pageNumElem = document.getElementById('page-num');
    if (pageNumElem) {
        pageNumElem.textContent = num;
    }
}

// 4. 佇列渲染頁面
function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

// 5. 載入 PDF 檔案
function loadPDF(url) {
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
        pdfDoc = pdfDoc_;
        const pageCountElem = document.getElementById('page-count');
        if (pageCountElem) {
            pageCountElem.textContent = pdfDoc.numPages;
        }
        pageNum = 1;
        renderPage(pageNum);
    }).catch(function(error) {
        console.error('PDF 載入失敗：', error);
    });
}

// 6. 切換上一頁 / 下一頁
function onPrevPage() {
    if (pageNum <= 1) {
        if (currentPdfIndex > 0) {
            currentPdfIndex--;
            loadPDF(pdfFiles[currentPdfIndex]);
        }
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) {
        if (currentPdfIndex < pdfFiles.length - 1) {
            currentPdfIndex++;
            loadPDF(pdfFiles[currentPdfIndex]);
        }
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
}

// 7. 確保 DOM 載入 completed 後才綁定與初始化
window.addEventListener('DOMContentLoaded', function() {
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    if (prevBtn) prevBtn.addEventListener('click', onPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', onNextPage);

    // 載入第一個 PDF 檔案
    loadPDF(pdfFiles[currentPdfIndex]);
});
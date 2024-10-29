$(function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    function isTablet(screenWidth) {
        return screenWidth >= 768 && screenWidth <= 1024; // Kiểm tra nếu là kích thước của iPad
    }

    function isMobile(screenWidth) {
        return screenWidth < 768; // Kiểm tra nếu là kích thước của mobile
    }

    function lockOrientation() {
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(function(error) {
                console.error("Không thể khóa chiều xoay: ", error);
            });
        } else {
            console.warn("Trình duyệt không hỗ trợ khóa chiều xoay.");
        }
    }
    
    function getDeviceScale() {
        let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (isTablet(screenWidth)) {
            return 0.7; // scale cho iPad
        } else if (isMobile(screenWidth)) {
            lockOrientation(); // Tự động xoay chiều ngang nếu là di động
            return 0.5; // scale cho thiết bị di động
        }
        return 1; // scale mặc định cho desktop
    }

    let pdfUrl = '/file/AN_PHAM_LUU_TRU_CAN_THO_XUA_VA_NAY_nen_4.pdf';
    let scale = getDeviceScale();
    let pdfDoc = null;
    let pagesRendered = {}; // Lưu trữ các trang đã render để tránh render lại

    function renderPage(pageNum, callback) {
        if (pagesRendered[pageNum]) {
            callback(pagesRendered[pageNum]);
            return;
        }

        // Tạo một placeholder cho trang đang tải với hiệu ứng loading
        let pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>'; // Hiển thị thông báo "Loading..."
        callback(pageDiv);

        pdfDoc.getPage(pageNum).then(function(page) {
            let viewport = page.getViewport({ scale: scale });
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            let renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            page.render(renderContext).promise.then(function() {
                pageDiv.innerHTML = ''; // Xóa nội dung "Loading..." khi đã render xong
                pageDiv.appendChild(canvas); // Thêm canvas vào pageDiv
                pagesRendered[pageNum] = pageDiv; // Lưu trang đã render vào bộ nhớ cache
            });
        });
    }

    function initTurnJSWithDimensions(pageWidth, pageHeight, totalPages) {
        $('.magazine').turn({
            width: pageWidth * 2,
            height: pageHeight,
            autoCenter: true,
            display: 'double',
            gradients: true,
            acceleration: true,
            pages: totalPages,
            when: {
                turning: function(event, page) {
                    let pagesToRender = [page, page + 1];
                    pagesToRender.forEach(pageNum => {
                        if (pageNum <= totalPages && !pagesRendered[pageNum]) {
                            renderPage(pageNum, function(pageDiv) {
                                $('.magazine').turn('addPage', pageDiv, pageNum);
                            });
                        }
                    });
                }
            }
        });
    }

    pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
        pdfDoc = pdf;
        let totalPages = pdf.numPages;

        pdf.getPage(1).then(function(page) {
            let viewport = page.getViewport({ scale: scale });
            let pageWidth = viewport.width;
            let pageHeight = viewport.height;

            // Render và thêm hai trang đầu tiên vào Turn.js
            renderPage(1, function(pageDiv) {
                $('.magazine').append(pageDiv);
            });
            renderPage(2, function(pageDiv) {
                $('.magazine').append(pageDiv);
            });

            // Khởi tạo Turn.js với kích thước và số lượng trang
            initTurnJSWithDimensions(pageWidth, pageHeight, totalPages);

            // Chỉ render trang đầu tiên ban đầu, để trống các trang khác
            renderPage(2, function(pageDiv) {
                pagesRendered[2] = pageDiv;
            });

            $('.magazine').turn('page', 1); // Hiển thị trang 1 ban đầu
        });
    });
});
$(function () {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

    function isTablet(screenWidth) {
        return screenWidth >= 768 && screenWidth <= 1024;
    }

    function isMobile(screenWidth) {
        return screenWidth < 768;
    }

    function getDeviceScale() {
        let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;

        if (isTablet(screenWidth)) {
            return 0.7;
        } else if (isMobile(screenWidth)) {
            return 0.5;
        }
        return 1;
    }

    let pdfUrl = 'https://lehoangdung0609.github.io/sachdientu2/file/AN_PHAM_LUU_TRU_CAN_THO_XUA_VA_NAY_nen_4.pdf';
    let scale = getDeviceScale();
    let pdfDoc = null;
    let pagesRendered = {};

    function renderPage(pageNum, callback) {
        if (pagesRendered[pageNum]) {
            callback(pagesRendered[pageNum]);
            return;
        }

        let pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.innerHTML = '<div class="loading"><div class="loader"></div></div>';
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
                pageDiv.innerHTML = '';
                pageDiv.appendChild(canvas);
                pagesRendered[pageNum] = pageDiv;
            });
        });
    }

    function initTurnJSWithDimensions(pageWidth, pageHeight, totalPages) {
        let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        let isMobileDevice = isMobile(screenWidth);

        $('.magazine').turn({
            width: isMobileDevice ? pageWidth : pageWidth * 2,
            height: pageHeight,
            autoCenter: true,
            display: isMobileDevice ? 'single' : 'double', // Hiển thị một trang trên mobile
            gradients: true,
            acceleration: true,
            pages: totalPages,
            /*elevation: 50,
            duration: 1000,*/
            when: {
                turning: function(event, page) {
                    let pagesToRender;
                    if (isMobileDevice) {
                        pagesToRender = [page]; // Chỉ render một trang trên mobile
                    } else {
                        pagesToRender = [page, page + 1];
                    }

                    pagesToRender.forEach(pageNum => {
                        if (pageNum <= totalPages && !pagesRendered[pageNum]) {
                            renderPage(pageNum, function(pageDiv) {
                                $('.magazine').turn('addPage', pageDiv, pageNum);
                            });
                        }
                    });
                },
                turned: function(event, page) {
                    $(this).turn('center');
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

            // Render tất cả các trang ngay khi PDF được tải
            for (let i = 3; i <= totalPages; i++) {
                renderPage(i, function(pageDiv) {
                    $('.magazine').append(pageDiv);
                });
            }

            initTurnJSWithDimensions(pageWidth, pageHeight, totalPages);
        });
    });

    // Xử lý sự kiện thay đổi kích thước màn hình
    $(window).resize(function() {
        let screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        if ($('.magazine').turn('is')) {
            $('.magazine').turn('display', isMobile(screenWidth) ? 'single' : 'double');
            $('.magazine').turn('size',
                isMobile(screenWidth) ? $('.magazine').width() / 2 : $('.magazine').width(),
                $('.magazine').height()
            );
        }
    });
});
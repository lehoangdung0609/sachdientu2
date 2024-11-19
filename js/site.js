$(function () {
    function isEmbeddedBrowser() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const embeddedAgents = [
            "FBAN", // Facebook for iOS
            "FBAV", // Facebook for Android
            "Instagram",
            "Zalo", // Zalo
        ];

        return embeddedAgents.some(agent => userAgent.includes(agent));
    }

    function isIOS() {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    function isAndroid() {
        return /Android/i.test(navigator.userAgent);
    }

    if (isEmbeddedBrowser() && !sessionStorage.getItem('externalBrowserPromptShown')) {
        const openExternalBrowser = confirm("Để có trải nghiệm tốt nhất, vui lòng mở link này trong trình duyệt mặc định của bạn. Nhấn Đồng ý để mở, nếu không mở được vui lòng copy link.");
        // Lưu trạng thái người dùng đã nhìn thấy hộp thoại vào sessionStorage
        sessionStorage.setItem('externalBrowserPromptShown', 'true');
        if (openExternalBrowser) {
            if (isIOS()) {
                // Chuyển hướng sang Safari trên iOS
                setTimeout(() => {
                    window.location.replace("https://" + window.location.hostname + window.location.pathname);
                }, 500);
            } else if (isAndroid()) {
                // Mở trong Chrome trên Android
                window.open(window.location.href, '_blank');
            }
        }
    }

    // Quản lý hành vi "Back" trên iOS mà không chặn vuốt
    if (isIOS()) {
        // Đẩy một state vào lịch sử để ngăn việc quay lại
        window.history.pushState(null, null, window.location.href);

        // Lắng nghe sự kiện "popstate" (khi người dùng cố quay lại)
        window.onpopstate = function() {
            // Khi họ cố quay lại, ta đẩy lại state vào lịch sử để ngăn việc quay lại
            window.history.pushState(null, null, window.location.href);
        };
    }
    
    let pdfWidth = 1200; // Thay bằng chiều rộng thực tế của PDF
    let pdfHeight = 800; // Thay bằng chiều cao thực tế của PDF

    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    let margin = 0.05; // 5% không gian ở đầu và cuối

    let availableHeight = screenHeight - (screenHeight * margin * 2); // Chiều cao khả dụng sau khi để lại margin

    let pdfRatio = pdfWidth / pdfHeight;
    let screenRatio = screenWidth / screenHeight;

    let flipbookWidth, flipbookHeight;
    let isMobile = window.innerWidth <= 768;
    let displayMode = isMobile ? 'single' : 'double';

    if (isMobile) {
        flipbookHeight = screenHeight * (2/3);
        flipbookWidth = flipbookHeight * pdfRatio; // Duy trì tỷ lệ khung hình
    } else {
        if (pdfRatio > screenRatio) {
            flipbookWidth = screenWidth;
            flipbookHeight = screenWidth / pdfRatio;
        } else {
            flipbookHeight = availableHeight;
            flipbookWidth = availableHeight * pdfRatio;
        }
    }

    $("#flipbook").turn({
        width: flipbookWidth,
        height: flipbookHeight,
        autoCenter: true,
        display: displayMode,
        gradients: true, // Thêm tùy chọn gradients
        elevation: 200, // Để tạo cảm giác nổi cho trang khi lật
        shadows: true,
        when: {
            ready: function() {
                $(this).turn('peel', 'br'); // Lật trang đầu tiên về bên phải
            }
        },
        tap: function(event) {
            let flipbook = $(this);
            if (flipbook.turn('page') == 1) {
                flipbook.turn('next'); // Lật sang trang tiếp theo nếu đang ở trang đầu
            } else if (flipbook.turn('page') == flipbook.turn('pages')){
                flipbook.turn('previous'); // Lật về trang trước nếu đang ở trang cuối
            } else {
                let isRight = (event.pageX - flipbook.offset().left) > flipbook.width()/2;
                if (isRight) {
                    flipbook.turn('next');
                } else {
                    flipbook.turn('previous');
                }
            }

        }
    });
    
    let hammertime = new Hammer(document.getElementById('flipbook')); // Sử dụng Hammer.js
    hammertime.on('swipeleft', function(ev) {
        if (!isZoomed) {
            $('#flipbook').turn('next');
        }
    });
    hammertime.on('swiperight', function(ev) {
        if (!isZoomed) {
            ev.preventDefault();
            $('#flipbook').turn('previous');
        }
    });


    // Phóng to/thu nhỏ
    let flipbook = $("#flipbook");
    let zoomLevel = 1; // Mức zoom hiện tại (1: bình thường, 2: 2x, 3: 3x, 4:4x, 5: 5x)
    let isZoomed = false;
    let zoomScales = [1, 2, 3, 4, 5]; // Mảng chứa các mức zoom
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let translateX = 0, translateY = 0;
    let slider = $("#pageSlider");

    // Thêm biến để theo dõi thời gian giữa các lần chạm
    let lastTap = 0;
    let touchZoomScale = 1;
    let touchStartDistance = 0;
    let initialTouchZoomScale = 1;

    // Thêm các biến để xử lý pan (di chuyển) trên mobile
    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchTranslateX = 0;
    let touchTranslateY = 0;
    // Thêm biến để theo dõi vị trí ban đầu của touch
    let touchInitialLeft = 0;
    let touchInitialTop = 0;

    let currentTranslateX = 0;
    let currentTranslateY = 0;

    // Cập nhật giá trị của slider khi trang thay đổi
    flipbook.on('turning', function(event, page, view) {
        slider.val(page);
        let currentPage = flipbook.turn('page');
        let nextPage = currentPage + 1;
        let prevPage = currentPage - 1;

        if (view === 1) {
            if (page === nextPage) {
                flipbook.turn('page', nextPage).css('transform', 'rotateY(10deg)');
            } else if (page === prevPage) {
                flipbook.turn('page', prevPage).css('transform', 'rotateY(-10deg)');
            }
        } else if (view === 2) {
            if (page === nextPage) {
                flipbook.turn('page', nextPage).css('transform', 'rotateY(10deg)');
                flipbook.turn('page', prevPage).css('transform', 'rotateY(-10deg)');
            } else if (page === prevPage) {
                flipbook.turn('page', prevPage).css('transform', 'rotateY(-10deg)');
                flipbook.turn('page', nextPage).css('transform', 'rotateY(10deg)');
            }
        }
    });

    let autoFlipInterval = null; // Khởi tạo bằng null

    $("#auto-flip-button").on("click", function(e) { // Thêm e để xử lý event
        e.preventDefault();

        if (autoFlipInterval === null) { // Sử dụng autoFlipInterval
            autoFlipInterval = setInterval(function() {
                if (flipbook.turn('page') < flipbook.turn('pages')) { // Kiểm tra xem đã đến trang cuối chưa
                    flipbook.turn("next");
                } else {
                    clearInterval(autoFlipInterval); // Dừng interval khi đến trang cuối
                    autoFlipInterval = null;
                    $(this).text("Tự động"); // Đặt lại text của button
                }
            }, 3500); // Chuyển trang sau 2 giây
            $(this).text("Dừng tự động");
        } else {
            clearInterval(autoFlipInterval);
            autoFlipInterval = null;
            $(this).text("Tự động");
        }
    });

    // Thay đổi trang khi giá trị của slider thay đổi
    slider.on('input', function() {
        let page = parseInt($(this).val());
        if (page >= 1 && page <= flipbook.turn('pages')) {
            flipbook.turn('page', page);
        }
    });

    // Đảm bảo rằng giá trị tối đa của slider được cập nhật nếu số trang thay đổi
    slider.attr('max', flipbook.turn('pages'));

    flipbook.on('dblclick', function() {
        if (!isZoomed) {
            $("#zoom-in-button").click();
        } else {
            $("#zoom-out-button").click();
        }
    });

    /*test zoom trên mobile ipad*/
    // Xử lý double tap để zoom
    flipbook.on('touchend', function(e) {
        let currentTime = new Date().getTime();
        let tapLength = currentTime - lastTap;

        if (tapLength < 300 && tapLength > 0) {
            if (!isZoomed) {
                $("#zoom-in-button").click();
            } else {
                $("#zoom-out-button").click();
            }
            e.preventDefault();
        }
        lastTap = currentTime;
    });

    // Thêm CSS để cải thiện hiệu suất và ngăn chặn các hành vi mặc định
    $('#flipbook').css({
        'touch-action': 'none',
        '-webkit-user-select': 'none',
        'user-select': 'none',
        'position': 'relative'
    });

    // Ngăn chặn scroll trang khi đang zoom
    document.body.addEventListener('touchmove', function(e) {
        if (isZoomed) {
            e.preventDefault();
        }
    }, { passive: false });

    flipbook.on('touchstart', function(e) {
        if (isZoomed) {
            $(this).addClass('dragging');
        }
    });

    flipbook.on('touchend', function(e) {
        $(this).removeClass('dragging');
    });

    // Xử lý pinch zoom
    flipbook.on('touchstart', function(e) {
        let touches = e.originalEvent.touches;

        if (touches.length === 2) {
            // Xử lý pinch zoom
            touchStartDistance = Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY
            );
            initialTouchZoomScale = touchZoomScale;
        } else if (touches.length === 1 && isZoomed) {
            e.preventDefault();
            // Lưu vị trí touch ban đầu
            lastTouchX = touches[0].pageX;
            lastTouchY = touches[0].pageY;
            touchInitialLeft = parseInt($(this).css('left')) || 0;
            touchInitialTop = parseInt($(this).css('top')) || 0;
        }
    });

    flipbook.on('touchmove', function(e) {
        let touches = e.originalEvent.touches;

        if (touches.length === 2) {
            // Xử lý pinch zoom
            e.preventDefault();
            const distance = Math.hypot(
                touches[0].pageX - touches[1].pageX,
                touches[0].pageY - touches[1].pageY
            );

            touchZoomScale = initialTouchZoomScale * (distance / touchStartDistance);
            touchZoomScale = Math.min(Math.max(1, touchZoomScale), 3);

            $(this).css('transform', `scale(${touchZoomScale})`);
        } else if (touches.length === 1 && isZoomed) {
            e.preventDefault();
            const touch = touches[0];
            const deltaX = touch.pageX - lastTouchX;
            const deltaY = touch.pageY - lastTouchY;

            // Tính toán vị trí mới
            let newLeft = touchInitialLeft + deltaX;
            let newTop = touchInitialTop + deltaY;

            // Giới hạn khoảng di chuyển dựa trên kích thước flipbook sau khi zoom
            const zoomedWidth = flipbookWidth * touchZoomScale;
            const zoomedHeight = flipbookHeight * touchZoomScale;

            const maxLeft = (zoomedWidth - flipbookWidth) / 2;
            const maxTop = (zoomedHeight - flipbookHeight) / 2;
            const minLeft = -maxLeft;
            const minTop = -maxTop;

            newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
            newTop = Math.min(maxTop, Math.max(minTop, newTop));

            // Áp dụng vị trí mới
            flipbook.css({
                'left': newLeft + 'px',
                'top': newTop + 'px'
            });
        }
    });

    document.body.addEventListener('touchmove', function(e) {
        if (isZoomed) {
            e.preventDefault();
        }
    }, { passive: false });

    // Reset zoom khi orientation change
    $(window).on('orientationchange', function() {
        isZoomed = false;
        touchZoomScale = 1;
        touchTranslateX = 0;
        touchTranslateY = 0;
        flipbook.css('transform', 'scale(1)');
        flipbook.css('left', '0');
        flipbook.css('top', '0');
        // Reset trạng thái nút
        $("#zoom-in-button").prop('disabled', false).css('opacity', '1');
        $("#zoom-out-button").prop('disabled', true).css('opacity', '0.5');
    });
    

    /**** end test zoom trên mobile ipad ****/

    flipbook.on('mousedown', function(e) {
        if (isZoomed) {
            isDragging = true;
            startX = e.pageX;
            startY = e.pageY;
            initialLeft = parseInt($(this).css('left')) || 0;
            initialTop = parseInt($(this).css('top')) || 0;
            $(this).css('cursor', 'grabbing');
            $(this).addClass('grabbing');
        }
    });

    $(document).on('mousemove', function(e) {
        if (isZoomed && isDragging) {
            let deltaX = e.pageX - startX;
            let deltaY = e.pageY - startY;

            // Cập nhật vị trí translate cho ảnh
            translateX += deltaX;
            translateY += deltaY;

            let scale = zoomScales[zoomLevel - 1]; // Lấy scale hiện tại

            // Đặt lại transform với giá trị mới
            flipbook.css('transform', `scale(${scale}) translate(${translateX}px, ${translateY}px)`);

            // Cập nhật tọa độ bắt đầu để tính khoảng cách cho lần di chuyển tiếp theo
            startX = e.pageX;
            startY = e.pageY;
        }
    });

    $(document).on('mouseup', function() {
        if (isZoomed) {
            isDragging = false;
            flipbook.css('cursor', 'grab');
            flipbook.removeClass('grabbing');
        }
    });

    $(document).on('mousemove', function(e) {
        if (isZoomed && isDragging) {
            let deltaX = e.pageX - startX;
            let deltaY = e.pageY - startY;
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            // Giới hạn di chuyển để ảnh không bị ra khỏi vùng nhìn
            let maxLeft = 0;
            let maxTop = 0;
            let minLeft = flipbook.parent().width() - flipbook.width() * zoomScale;
            let minTop = flipbook.parent().height() - flipbook.height() * zoomScale;

            newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
            newTop = Math.min(maxTop, Math.max(minTop, newTop));

            flipbook.css('left', newLeft + 'px');
            flipbook.css('top', newTop + 'px');
        }
    });

    $("#prev-button").on("click", function() {
        flipbook.turn("previous");
    });

    $("#next-button").on("click", function() {
        flipbook.turn("next");
    });

    // Thêm xử lý cho nút zoom in
    $("#zoom-in-button").on("click", function(e) {
        e.preventDefault();
        if (zoomLevel < 5) { // Kiểm tra xem đã đạt mức zoom tối đa chưa
            zoomLevel++;
            applyZoom(zoomLevel); // Áp dụng mức zoom mới
        }
    });

// Thêm xử lý cho nút zoom out
    $("#zoom-out-button").on("click", function(e) {
        e.preventDefault();
        if (zoomLevel > 1) {  // Kiểm tra xem đã đạt mức zoom tối thiểu chưa
            zoomLevel--;
            applyZoom(zoomLevel); // Áp dụng mức zoom mới
        }
    });

    // Hàm áp dụng mức zoom
    function applyZoom(level) {
        let scale = zoomScales[level - 1];
        if (isMobile) {
            touchZoomScale = scale; // Cập nhật touchZoomScale cho mobile
        }

        // Lưu vị trí hiện tại trước khi thay đổi mức zoom
        if (isMobile) {
            //  Đối với mobile, bạn có thể dùng touchTranslateX và touchTranslateY
            currentTranslateX = parseInt(flipbook.css('left')) || 0;
            currentTranslateY = parseInt(flipbook.css('top')) || 0;
            // Hoặc có thể dùng  matrix để tính toán chính xác hơn
        } else {
            currentTranslateX = translateX;
            currentTranslateY = translateY;
        }

        // Áp dụng lại vị trí đã lưu sau khi thay đổi mức zoom
        if (isMobile) {
            flipbook.css({
                'left': currentTranslateX + 'px',
                'top': currentTranslateY + 'px'
            });
        } else {
            // Tính toán lại translateX và translateY dựa trên scale mới
            translateX = currentTranslateX;
            translateY = currentTranslateY;

            flipbook.css('transform', `scale(${scale}) translate(${translateX}px, ${translateY}px)`);
        }

        // Cập nhật trạng thái nút (tùy chọn)
        if (level === 5) {
            $("#zoom-in-button").prop('disabled', true).css('opacity', '0.5');
        } else {
            $("#zoom-in-button").prop('disabled', false).css('opacity', '1');
        }
        if (level === 1) {
            $("#zoom-out-button").prop('disabled', true).css('opacity', '0.5');
            isZoomed = false; // Đặt isZoomed về false khi zoom out hoàn toàn
            flipbook.css('left', '0'); // Reset vị trí left và top
            flipbook.css('top', '0');
        } else {
            $("#zoom-out-button").prop('disabled', false).css('opacity', '1');
            isZoomed = true; // Đặt isZoomed về true khi đang zoom
        }

        // Reset translate khi thay đổi mức zoom
        translateX = 0;
        translateY = 0;
        flipbook.css('transform', `scale(${scale})`); // Áp dụng lại transform

    }

    // Cập nhật trạng thái ban đầu của nút zoom out
    $("#zoom-out-button").prop('disabled', true).css('opacity', '0.5');
    
});
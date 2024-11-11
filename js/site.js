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
    let isZoomed = false;
    let zoomScale = 2;
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

    // Cập nhật giá trị của slider khi trang thay đổi
    flipbook.on('turning', function(event, page, view) {
        slider.val(page);
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

            // Giới hạn khoảng di chuyển
            const maxLeft = $(window).width() * 0.5;
            const maxTop = $(window).height() * 0.5;
            const minLeft = -$(window).width() * 0.5;
            const minTop = -$(window).height() * 0.5;

            newLeft = Math.min(maxLeft, Math.max(minLeft, newLeft));
            newTop = Math.min(maxTop, Math.max(minTop, newTop));

            // Áp dụng vị trí mới
            $(this).css({
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

            // Đặt lại transform với giá trị mới
            flipbook.css('transform', `scale(${zoomScale}) translate(${translateX}px, ${translateY}px)`);

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
        if (!isZoomed) {
            isZoomed = true;
            if (isMobile) {
                touchZoomScale = 2;
                flipbook.css({
                    'transform': `scale(${touchZoomScale})`,
                    'transform-origin': 'center center'
                });
            } else {
                flipbook.css({
                    'transform': `scale(${zoomScale})`,
                    'transform-origin': 'center center'
                });
            }
            // Disable nút zoom in
            $(this).prop('disabled', true).css('opacity', '0.5');
            // Enable nút zoom out
            $("#zoom-out-button").prop('disabled', false).css('opacity', '1');
        }
    });

// Thêm xử lý cho nút zoom out
    $("#zoom-out-button").on("click", function(e) {
        e.preventDefault();
        if (isZoomed) {
            isZoomed = false;
            if (isMobile) {
                touchZoomScale = 1;
            }
            flipbook.css({
                'transform': 'scale(1)',
                'left': '0',
                'top': '0'
            });
            touchTranslateX = 0;
            touchTranslateY = 0;
            // Enable nút zoom in
            $("#zoom-in-button").prop('disabled', false).css('opacity', '1');
            // Disable nút zoom out
            $(this).prop('disabled', true).css('opacity', '0.5');
        }
    });

// Cập nhật trạng thái ban đầu của nút zoom out
    $("#zoom-out-button").prop('disabled', true).css('opacity', '0.5');
    
});
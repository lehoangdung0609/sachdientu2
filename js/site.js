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
        $('#flipbook').turn('next');
    });
    hammertime.on('swiperight', function(ev) {
        ev.preventDefault(); // Ngăn chặn hành vi mặc định của trình duyệt
        $('#flipbook').turn('previous');
    });


    // Phóng to/thu nhỏ
    let flipbook = $("#flipbook");
    let isZoomed = false;
    let zoomScale = 2;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let translateX = 0, translateY = 0;
    let slider = $("#pageSlider");

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
        isZoomed = !isZoomed;
        if (isZoomed) {
            $(this).css('transform', `scale(${zoomScale})`);
            $(this).css('transform-origin', 'center center');
        } else {
            $(this).css('transform', 'scale(1)');
            // Reset lại vị trí khi thu nhỏ
            $(this).css('left', '0');
            $(this).css('top', '0');
        }
    });

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
    
});
$(function () {
    var pdfWidth = 1200; // Thay bằng chiều rộng thực tế của PDF
    var pdfHeight = 800; // Thay bằng chiều cao thực tế của PDF

    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;

    var margin = 0.05; // 5% không gian ở đầu và cuối

    var availableHeight = screenHeight - (screenHeight * margin * 2); // Chiều cao khả dụng sau khi để lại margin

    var pdfRatio = pdfWidth / pdfHeight;
    var screenRatio = screenWidth / screenHeight;

    var flipbookWidth, flipbookHeight;
    var isMobile = window.innerWidth <= 768;
    var displayMode = isMobile ? 'single' : 'double';

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
            var flipbook = $(this);
            if (flipbook.turn('page') == 1) {
                flipbook.turn('next'); // Lật sang trang tiếp theo nếu đang ở trang đầu
            } else if (flipbook.turn('page') == flipbook.turn('pages')){
                flipbook.turn('previous'); // Lật về trang trước nếu đang ở trang cuối
            } else {
                var isRight = (event.pageX - flipbook.offset().left) > flipbook.width()/2;
                if (isRight) {
                    flipbook.turn('next');
                } else {
                    flipbook.turn('previous');
                }
            }

        }
    });

    var hammertime = new Hammer(document.getElementById('flipbook')); // Sử dụng Hammer.js
    hammertime.on('swipeleft', function(ev) {
        $('#flipbook').turn('next');
    });
    hammertime.on('swiperight', function(ev) {
        ev.preventDefault(); // Ngăn chặn hành vi mặc định của trình duyệt
        $('#flipbook').turn('previous');
    });
    
});
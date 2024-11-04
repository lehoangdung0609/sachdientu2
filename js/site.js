$(function () {
    // Danh sách các trình duyệt phổ biến
    var browsers = {
        isChrome: /chrome/i.test(navigator.userAgent) && /Google Inc/i.test(navigator.vendor),
        isSafari: /safari/i.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor),
        isFirefox: /firefox/i.test(navigator.userAgent),
        isEdge: /edge/i.test(navigator.userAgent),
        isInApp: (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches)
    };

    // Kiểm tra xem có đang mở trong trình duyệt web hay không
    function isStandardBrowser() {
        return (browsers.isChrome || browsers.isSafari || browsers.isFirefox || browsers.isEdge);
    }

    // Kiểm tra xem có đang mở trong webview của ứng dụng khác không
    function isInWebView() {
        var userAgent = navigator.userAgent.toLowerCase();

        // Kiểm tra các webview phổ biến
        if(userAgent.indexOf('fb') > -1) return true; // Facebook
        if(userAgent.indexOf('instagram') > -1) return true; // Instagram
        if(userAgent.indexOf('line') > -1) return true; // Line
        if(userAgent.indexOf('wv') > -1) return true; // Android WebView
        if(userAgent.indexOf('fbav') > -1) return true; // Facebook App
        if(userAgent.indexOf('twitter') > -1) return true; // Twitter

        // Kiểm tra thêm cho iOS
        var standalone = window.navigator.standalone;
        var userAgent = window.navigator.userAgent.toLowerCase();
        var safari = /safari/.test(userAgent);
        var ios = /iphone|ipod|ipad/.test(userAgent);

        if (ios) {
            if (!standalone && !safari) {
                return true; // iOS webview
            }
        }

        return false;
    }

    // Chuyển hướng nếu không phải trình duyệt web tiêu chuẩn
    function redirectToDefaultBrowser() {
        if (isInWebView() && !isStandardBrowser()) {
            // Lấy URL hiện tại
            var currentURL = window.location.href;

            // Tạo thông báo cho người dùng
            if (confirm('Để có trải nghiệm tốt nhất, vui lòng mở trang web này trong trình duyệt. Bấm OK để mở trong trình duyệt mặc định.')) {
                // Thử mở trong trình duyệt mặc định
                window.location.href = currentURL;

                // Hoặc có thể sử dụng window.open
                // window.open(currentURL, '_system');
            }
        }
    }

    // Thực hiện kiểm tra khi trang web được tải
    window.addEventListener('load', redirectToDefaultBrowser);
    
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
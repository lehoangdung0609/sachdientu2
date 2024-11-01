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

    if (pdfRatio > screenRatio) {
        flipbookWidth = screenWidth;
        flipbookHeight = screenWidth / pdfRatio;
    } else {
        flipbookHeight = availableHeight;
        flipbookWidth = availableHeight * pdfRatio;
    }

    $("#flipbook").turn({
        width: flipbookWidth,
        height: flipbookHeight,
        autoCenter: true
    });
});
var slideshow = $('slideshow');
var interval;
try {
    interval = parseInt(slideshow.attr('interval'));
} catch (e) {}

if (interval == null || isNaN(interval) || interval == 0) {
    interval = 2000;
}

slideshow.css({
    display: 'block',
    height: '100%'
});

var slideshow_container = slideshow.children('img');
slideshow_container.css({
    height: '100%',
    width: '100%',
    'object-fit': 'cover'
});

var image_list = slideshow.children('slideshow_source_list').children('slideshow_source').map(function (i, x) {
    return x.getAttribute('href');
});

function slideshow_next() {
    pointer = 0;

    function _() {
        slideshow_container.attr('src', image_list[pointer % (image_list.length)]);
        pointer++;
    }
    return _;
}
slideshow_next = slideshow_next();

slideshow_next();
slideshow_timerID = setInterval(slideshow_next, interval);

slideshow.click(function () {
    slideshow_next();
    clearInterval(slideshow_timerID);
    slideshow_timerID = setInterval(slideshow_next, interval)
});

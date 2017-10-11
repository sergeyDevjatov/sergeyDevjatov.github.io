$(document).ready(function () {
    var hyphenate = createHyphenator(hyphenationPatternsRu);

    $('.text').each(function (i, item) {
        $(item).html(hyphenate($(item).html()));
    });

    function isInView(elem) {
        var viewTop = window.scrollY;
        var viewBottom = window.scrollY + window.innerHeight;
        var elemTop = $(elem).offset().top;
        var elemBottom = elemTop + $(elem).height();
        return viewTop < elemBottom && viewTop > elemTop || viewBottom > elemTop && viewBottom < elemBottom;
    }

    $(window).scroll(function (e) {
        $('.video_background').each(function (i, elem) {
            if (isInView(elem)) {
                $(this).children('video').each((_i, _elem) => _elem.play());
            }
            else{
                $(this).children('video').each((_i, _elem) => _elem.pause());
            }
        });
    });

    $(window).trigger('scroll');

    $(window).focus(() => $('.video_background video').each((i, elem) => isInView(elem) ? elem.play() : null));
    $(window).blur(() => $('.video_background video').each((i, elem) => elem.pause()));
});

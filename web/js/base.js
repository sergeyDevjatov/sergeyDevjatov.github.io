$(document).ready(function () {
    var filename = window.location.pathname.split("/").pop();

    $('.header').load('templates/header.html', function () {
        $('.footer').load('templates/footer.html', function () {
            $('.menu .menuitem[href="' + filename + '"]').addClass('current');
        });
    });

    if (filename == 'index.html') {

    }
    if(filename == 'feedback.html'){
        var inputs = $('.feedback_form').children('input');
        $.each(inputs, function(i, elem){ elem.value = elem.title; });
        inputs.focus(function(){
            if(this.value.trim() == this.title){
                this.value = null;
            }
        });
        inputs.blur(function(){
            if(this.value.trim().length <= 0){
                this.value = this.title;
            }
        });
    }
    if (filename == 'infrastructure.html') {

        var canvas = $('.admin_division canvas');
        canvas.drawImage({
            source: $('.admin_division img').attr('src'),
            fromCenter: false
        });

        $('.admin_division img').css({
            opacity: 0,
            position: 'relative'
        });

        $('#admin_division-map area').hover(function (e) {
            var coords = $(this).attr('coords').split(',').map(function (x) {
                return parseInt(x);
            });

            var obj = {
                strokeStyle: 'red',
                strokeWidth: 2,
                fillStyle: 'rgba(0,0,0,0.4)',
                rounded: true,
                closed: true
            };

            // Your array of points

            // Add the points from the array to the object
            for (var i = 0; i < coords.length; i += 2) {
                obj['x' + (i / 2 + 1)] = coords[i];
                obj['y' + (i / 2 + 1)] = coords[i + 1];
            }

            // Draw the line
            canvas.drawLine(obj);
        }, function () {
            canvas.drawImage({
                source: $('.admin_division img').attr('src'),
                fromCenter: false
            });
        });

        $('.spoiler_button').click(function () {
            $(this).parent().parent().children('.spoiler_content').toggle(1000);
        })
    }
});

$(document).ready(function(){
    var hyphenate = createHyphenator(hyphenationPatternsRu);
    
    $('.text').each(function(i, item){
        $(item).text(hyphenate($(item).text()));
    });
});
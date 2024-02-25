$('.logo-as-seen-slider').slick({
  dots: false,
  arrow:true,
  infinite: false,
  slidesToShow: 6,
  slidesToScroll: 1,
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 6,
        slidesToScroll: 1
      }
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      }
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      }
    }
  ]
});
/*
$(".logo-as-seen-slider").each(function() {
  var slides = parseInt($(this).attr('data-show'));
  if(slides < 6){
    $(this).slick('unslick');
    $(this).slick({
      dots: false,
      arrow:true,
      infinite: false,
      slidesToShow: slides,
      slidesToScroll: 1,
      responsive: [
        {
          breakpoint: 1024,
          settings: {
            slidesToShow: slides,
            slidesToScroll: 1
          }
        },
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 2,
            slidesToScroll: 1,
          }
        },
        {
          breakpoint: 480,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
          }
        }
      ]
    });
  }
});
*/
$(window).scroll(function() {
  if ($(this).scrollTop()) {
    $('#scrollBtn').fadeIn();
  } else {
    $('#scrollBtn').fadeOut();
  }
});

$("#scrollBtn").click(function () {
   $("html, body").animate({scrollTop: 0}, 1000);
});

$(".cookie-open-link").on('click', function(e){
  e.preventDefault();
  $(".ot-floating-button__open").trigger('click');
});

$("#blog-load-more").on('click', function(){
  var currentPage = parseInt($("#current_page").val());
  var totalPage = parseInt($("#blog_total").val());
  var nextPage = currentPage + 1;
  
  $.ajax({
    url: "/blogs/breastfeeding?view=ajax_pagination&page="+nextPage,
    success: function(result){
    result = result.replace('<section id="shopify-section-blog-ajax-pagination" class="shopify-section section">','');
    result = result.replace('</section>','');
    $(".ajax_load_content").append(result);
    $("#current_page").val(nextPage);
    if(currentPage >= totalPage){
      $("#blog-load-more").hide();
    }
  }});
});
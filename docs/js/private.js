$(window).scroll(function() {
  if ($(this).scrollTop() >= 50) { // If page is scrolled more than 50px
    $("a#return-to-home").css("bottom","120px");
    $('#return-to-top').fadeIn(200); // Fade in the arrow
    $('#return-to-top').css("bottom","40px");
  } else {
    $('#return-to-top').fadeOut(200); // Else fade out the arrow
    $("a#return-to-home").css("bottom","40px");
  }
});
$('#return-to-top').click(function() { // When arrow is clicked
  $('body,html').animate({
    scrollTop: 0 // Scroll to top of body
  }, 500);
});

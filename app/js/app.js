// // Import jQuery module (npm i jquery)
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

import lozad from 'lozad'; // Lozad.js
import magnificPopup from 'magnific-popup'; // Magnific Popup

// // Import vendor jQuery plugin example (not module)
// require('~/app/libs/mmenu/dist/mmenu.js')

document.addEventListener('DOMContentLoaded', () => {

	// Calculating the width of the browser scrollbar for "Magnific Popup"

	const getScrollBarWidth = function() {
    var $outer = $('<div>').css({visibility: 'hidden', width: 100, overflow: 'scroll'}).appendTo('body'),
        widthWithScroll = $('<div>').css({width: '100%'}).appendTo($outer).outerWidth();
    $outer.remove();
    return 100 - widthWithScroll;
	};

	// Magnific Popup gallery

	let $gallery = $('.gallery__content');

	if($gallery.length) {
		$('.gallery__content').magnificPopup({
			mainClass: 'mfp-zoom-in mfp-img-mobile',
			delegate: 'a',
			type: 'image',
			tLoading: '',
			fixedContentPos: false, // если true - position: fixed, уйдет полоса прокрутки
			closeOnBgClick: true, // закрывает окно, при нажатии на темное наложение
			removalDelay: 300,
			gallery:{
				enabled:true,
				preload: [0, 1]
			},
			zoom: {
				enabled: true,
				duration: 300, // don't foget to change the duration also in CSS
				opener: function(openerElement) {
					return openerElement.is('a') ? openerElement : openerElement.find('a');
				}
			},
			image: {
				verticalFit: true,
				tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
				titleSrc: function(item) {
					return '<small>EVA Dywaniki</small>';
				}
			},
			callbacks: {
				beforeChange: function() {
					this.items[0].src = this.items[0].src + '?=' + Math.random(); 
				},
				open: function() {
					let bodyPaddingRight = getScrollBarWidth;
					$('body').css({
						overflowY: 'hidden',
						paddingRight: bodyPaddingRight
					});
					$.magnificPopup.instance.next = function() {
						let self = this;
						self.wrap.removeClass('mfp-image-loaded');
						setTimeout(function() { $.magnificPopup.proto.next.call(self); }, 300);
					}
					$.magnificPopup.instance.prev = function() {
						let self = this;
						self.wrap.removeClass('mfp-image-loaded');
						setTimeout(function() { $.magnificPopup.proto.prev.call(self); }, 300);
					}
				},
				imageLoadComplete: function() { 
					let self = this;
					setTimeout(function() { self.wrap.addClass('mfp-image-loaded'); }, 16);
				},
				close: function() {
					$('body').css({
						overflowY: 'auto',
						paddingRight: 0
					});
				}
			}
			
		});
	}

	// Popup

	let $popupBtn = $('[data-popup]');
	
	if ($popupBtn.length) {
		$($popupBtn).magnificPopup({
			items: {
				src: '#popup',
				type: 'inline'
			},
			fixedContentPos: false,
			preloader: false,
			removalDelay: 300,
			callbacks: {
				beforeOpen: function() {
					this.st.mainClass = this.st.el.attr('data-effect');
				},
				open: function() {
					let bodyPaddingRight = getScrollBarWidth;
					$('body').css({
						overflowY: 'hidden',
						paddingRight: bodyPaddingRight
					});
			  },
			 	close: function() {
					$('body').css({
						overflowY: 'auto',
						paddingRight: 0
					});
				}
			},
			midClick: true
		});
	}

	// CONNECT POPUP

	$('.button-connect').on('click', function () {
		$(this).toggleClass('connect-open');
		$('#connect-popup').fadeToggle(300);
	});

	//Smooth page scrolling by anchors

	let $nav = $('.nav');

	if($nav.length) {
		$($nav).on('click', 'a', function (event) {
			event.preventDefault();
			let id = $(this).attr('href');
			let	top = $(id).offset().top;
			$('body, html').animate({scrollTop: top}, 600);
		});
	}

	// lazy load image - lozad.js init

	let observer = lozad();
	observer.observe();

	// wow.js init

	new WOW().init();
 

});

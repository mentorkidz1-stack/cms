// Swiper Data
document.addEventListener('DOMContentLoaded', function () {
    var edmSwiper = document.querySelectorAll('.edm-swiper');

    edmSwiper.forEach(function (swiperContainer) {
        var slidesPerView = parseInt(swiperContainer.getAttribute('data-slides-per-view')) || 1;
        var spaceBetween = parseInt(swiperContainer.getAttribute('data-space-between')) || 0;
        var pagination = swiperContainer.getAttribute('data-pagination');
        var buttonNext = swiperContainer.getAttribute('data-button-next');
        var buttonPrev = swiperContainer.getAttribute('data-button-prev');
        var loop = swiperContainer.getAttribute('data-loop') === 'true';
        var breakpoints = JSON.parse(swiperContainer.getAttribute('data-breakpoints')) || {};

        var autoplayConfig = {};
        if (swiperContainer.closest('.main-banner, .cls-banner, .uni-banner, .elg-banner') && window.innerWidth <= 1024) {
            autoplayConfig = {
                autoplay: {
                    delay: 3000,
                    disableOnInteraction: false,
                }
            };
        }

        if (slidesPerView || spaceBetween || pagination || buttonNext || buttonPrev || loop || breakpoints) {
            var swiper = new Swiper(swiperContainer, {
                slidesPerView: slidesPerView,
                spaceBetween: spaceBetween,
                pagination: {
                    el: `.${pagination}`,
                    clickable: true,
                },
                navigation: {
                    nextEl: `.${buttonNext}`,
                    prevEl: `.${buttonPrev}`,
                },
                loop: loop,
                breakpoints: breakpoints,
                ...autoplayConfig,
            });
        }
    });

    // Thumb Slide coursera
    const csrSliderTop = new Swiper(".csr-testimonial-avatar", {
        spaceBetween: 10,
        slidesPerView: 3,
        loop: true,
        loopedSlides: 5,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        breakpoints: {
            768: {
                slidesPerView: 3
            },
            1024: {
                slidesPerView: 5
            }
        },
    });
    const csrSliderBottom = new Swiper(".csr-testimonial-content", {
        spaceBetween: 10,
        loop: true,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        loopedSlides: 5,
    });
    csrSliderTop.controller.control = csrSliderBottom;
    csrSliderBottom.controller.control = csrSliderTop;

    // Thumb Slide Main
    var mainSliderTop = new Swiper(".main-testimonial-avatar", {
        spaceBetween: 10,
        slidesPerView: 3,
        loop: true,
        loopedSlides: 5,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        breakpoints: {
            768: {
                slidesPerView: 3
            },
            1024: {
                slidesPerView: 5
            }
        },
    });

    const mainSliderBottom = new Swiper(".main-testimonial-content", {
        spaceBetween: 10,
        loop: true,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        loopedSlides: 5,
    });

    mainSliderTop.controller.control = mainSliderBottom;
    mainSliderBottom.controller.control = mainSliderTop;


    // Thumb Slide Online School
    const onlsSliderTop = new Swiper(".onls-testimonial-avatar", {
        spaceBetween: 10,
        slidesPerView: 3,
        loop: true,
        loopedSlides: 5,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        breakpoints: {
            768: {
                slidesPerView: 3
            },
            1024: {
                slidesPerView: 5
            }
        },
    });
    const onlsSliderBottom = new Swiper(".onls-testimonial-content", {
        spaceBetween: 10,
        loop: true,
        slideToClickedSlide: true,
        watchSlidesVisibility: true,
        watchSlidesProgress: true,
        centeredSlides: true,
        loopedSlides: 5,
    });
    onlsSliderTop.controller.control = onlsSliderBottom;
    onlsSliderBottom.controller.control = onlsSliderTop;
});
document.addEventListener("DOMContentLoaded", function () {
    // Tab category
    var categoryBtn = document.querySelectorAll(".category__btn");

    function handleTabClick(event) {
        var tabName = this.getAttribute("data-tab");
        var categoryContent = document.querySelectorAll(".category__content");

        categoryContent.forEach(function (tabContent) {
            tabContent.classList.remove("d-block");
            tabContent.classList.add("d-none");
        });

        var activeTab = document.getElementById(tabName);
        activeTab.classList.remove("d-none");
        activeTab.classList.add("d-block");

        categoryBtn.forEach(function (link) {
            link.classList.remove("active");
        });

        this.classList.add("active");
    }

    function initializeTabs() {
        categoryBtn.forEach(function (tablink, index) {
            tablink.addEventListener("click", handleTabClick);
            if (index === 0) {
                tablink.click();
            }
        });
    }
    initializeTabs();

    // Menu active
    var currentPath = window.location.pathname.split('/').pop();
    var menuItems = document.querySelectorAll('.main-dropdown-menu__sub_items a');
    var setNav2ndElements = document.querySelectorAll('.setNav2nd');

    function setActiveItem(menuItem, setNav2ndLink) {
        menuItems.forEach(function (item) {
            item.classList.remove('active');
        });

        setNav2ndElements.forEach(function (el) {
            el.classList.remove('active');

        });

        if (menuItem) {
            menuItem.classList.add('active');
            let parentElement = menuItem.closest('.nav-item');
            if (parentElement) {
                parentElement.querySelector('.setNav2nd').classList.add('active');
            }
        }
    }

    menuItems.forEach(function (menuItem) {
        var menuItemHref = menuItem.getAttribute('href');
        var setNav2ndLink = menuItem.closest('.main-dropdown-menu__sub') ? menuItem.closest('.main-dropdown-menu__sub').previousElementSibling : null;

        if (menuItemHref === currentPath) {
            setActiveItem(menuItem, setNav2ndLink);
        }

        menuItem.addEventListener('click', function (event) {
            setActiveItem(menuItem, setNav2ndLink);
        });
    });

    setNav2ndElements.forEach(function (setNav2nd) {
        var setNav2ndHref = setNav2nd.getAttribute('href');

        if (setNav2ndHref === currentPath) {
            setNav2nd.classList.add('active');
        }

        setNav2nd.addEventListener('click', function (event) {
            var windowWidth = window.innerWidth;
            var subMenu = this.nextElementSibling;
            var isActive = subMenu && subMenu.classList.contains('active');

            setNav2ndElements.forEach(function (el) {
                el.classList.remove('active');
            });

            this.classList.add('active');

            if (subMenu && windowWidth > 1024) {
                event.preventDefault();
                document.querySelectorAll('.main-dropdown-menu__sub').forEach(function (menu) {
                    menu.classList.remove('active');
                });

                if (!isActive) {
                    subMenu.classList.add('active');
                }
            } else if (!subMenu) {
                window.location.href = this.getAttribute('href');
            }
        });
    });

    // Mobile Menu
    var barsBtn = document.querySelector(".bars-btn");
    var navbarCustom = document.querySelector(".navbar-custom");
    var body = document.body;
    var navbarClose = document.querySelector(".navbar-close");
    var closesetNav2ndElements = document.querySelectorAll('.closesetNav2nd');

    function toggleNavbar() {
        navbarCustom.classList.toggle("active");
        body.classList.toggle("set-bars-overlay");
    }

    function removeActiveClasses() {
        navbarCustom.classList.remove("active");
        body.classList.remove("set-bars-overlay");
        document.querySelectorAll('.main-dropdown-menu__sub').forEach(function (subMenu) {
            subMenu.classList.remove('active');
        });
    }

    function handleClickOutside(event) {
        if (!navbarCustom.contains(event.target) && !barsBtn.contains(event.target)) {
            removeActiveClasses();
        }
    }

    function addClickEvent(element, callback) {
        if (element) {
            element.addEventListener("click", callback);
        }
    }

    if (barsBtn && navbarCustom && navbarClose) {
        addClickEvent(barsBtn, toggleNavbar);
        addClickEvent(navbarClose, removeActiveClasses);
        document.addEventListener("click", handleClickOutside);
    }

    if (setNav2ndElements.length > 0) {
        setNav2ndElements.forEach(function (element) {
            element.addEventListener('click', function (event) {
                var parentMenu = this.closest('.main-dropdown-menu');
                var subMenu = parentMenu ? parentMenu.querySelector('.main-dropdown-menu__sub') : null;
                var windowWidth = window.innerWidth;

                if (subMenu && windowWidth <= 1200) {
                    event.preventDefault();
                    var isActive = subMenu.classList.contains('active');
                    var allSubMenus = document.querySelectorAll('.main-dropdown-menu__sub');

                    allSubMenus.forEach(function (subMenu) {
                        subMenu.classList.remove('active');
                    });

                    if (!isActive) {
                        subMenu.classList.add('active');
                    }
                } else if (!subMenu || windowWidth > 1024) {
                    window.location.href = this.getAttribute('href');
                }
            });
        });
    }

    if (closesetNav2ndElements.length > 0) {
        closesetNav2ndElements.forEach(function (closeItem) {
            closeItem.addEventListener('click', function (event) {
                event.preventDefault();
                var parentSubMenu = this.closest('.main-dropdown-menu__sub');
                if (parentSubMenu) {
                    parentSubMenu.classList.remove('active');
                }
            });
        });
    }

    // Scroll all site
    window.addEventListener('scroll', function () {
        var scrollProgress = document.querySelector('.scroll-progress');
        if (scrollProgress) {
            var scrolled = (window.scrollY / (document.documentElement.scrollHeight - document.documentElement.clientHeight)) * 100;
            document.getElementById("scr-progress").style.height = scrolled + "%";
            if (window.scrollY > 500) {
                scrollProgress.classList.remove("d-none");
            } else {
                scrollProgress.classList.add("d-none");
            }
        }
        var scrollProgressLink = document.querySelector('.scroll-progress__link');
        if (scrollProgressLink) {
            document.querySelector('.scroll-progress__link').addEventListener('click', function (event) {
                event.preventDefault();
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    });

    // Form Login
    var handleLoginBtns = document.querySelectorAll('.handle-login');
    var modalLoginForm = document.querySelector('.modal-form-login');
    var body = document.querySelector('body');

    function showLoginForm() {
        modalLoginForm.classList.add("active");
        body.classList.add("set-form-login-overlay");
    }

    function hideLoginForm() {
        modalLoginForm.classList.remove("active");
        body.classList.remove("set-form-login-overlay");
    }

    function outSideLoginForm(event) {
        if (modalLoginForm.classList.contains("active") && !modalLoginForm.contains(event.target) && !Array.from(handleLoginBtns).some(btn => btn.contains(event.target))) {
            hideLoginForm();
        }
    }

    if (handleLoginBtns.length > 0 && modalLoginForm) {
        handleLoginBtns.forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                showLoginForm();
            });
        });
        document.addEventListener('click', outSideLoginForm);
    }

    // Form Register
    var handleRegisterBtns = document.querySelectorAll('.handle-register');
    var modalRegisterForm = document.querySelector('.modal-form-register');

    function showRegisterForm() {
        modalRegisterForm.classList.add("active");
        body.classList.add("set-form-register-overlay");
    }

    function hideRegisterForm() {
        modalRegisterForm.classList.remove("active");
        body.classList.remove("set-form-register-overlay");
    }

    function outSideRegisterForm(event) {
        if (modalRegisterForm.classList.contains("active") && !modalRegisterForm.contains(event.target) && !Array.from(handleRegisterBtns).some(btn => btn.contains(event.target))) {
            hideRegisterForm();
        }
    }

    if (handleRegisterBtns.length > 0 && modalRegisterForm) {
        handleRegisterBtns.forEach(function (btn) {
            btn.addEventListener('click', function (event) {
                event.preventDefault();
                showRegisterForm();
            });
        });
        document.addEventListener('click', outSideRegisterForm);
    }

    // Switch login and register
    var loginToRegisterBtn = document.querySelector('.form-login__register');
    var registerToLoginBtn = document.querySelector('.form-register__register');

    if (loginToRegisterBtn && registerToLoginBtn) {
        loginToRegisterBtn.addEventListener('click', function () {
            hideLoginForm();
            showRegisterForm();
        });

        registerToLoginBtn.addEventListener('click', function () {
            hideRegisterForm();
            showLoginForm();
        });
    }

    // Password show hide
    const pwShowHide = document.getElementById('pw-show-hide');

    if (pwShowHide) {
        pwShowHide.addEventListener('click', function () {
            const passwordField = document.querySelector('.password-container input[name="password"]');
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            const eyeOnIcon = this.querySelector('.eye-on');
            const eyeOffIcon = this.querySelector('.eye-off');

            if (type === 'password') {
                eyeOnIcon.classList.add('active');
                eyeOffIcon.classList.remove('active');
            } else {
                eyeOnIcon.classList.remove('active');
                eyeOffIcon.classList.add('active');
            }
        });
        const passwordField = document.querySelector('.password-container input[name="password"]');
        const eyeOnIcon = document.querySelector('.pw-show-hide .eye-on');
        const eyeOffIcon = document.querySelector('.pw-show-hide .eye-off');

        if (passwordField.getAttribute('type') === 'password') {
            eyeOnIcon.classList.add('active');
        } else {
            eyeOffIcon.classList.add('active');
        }
    }

    // Counter
    var counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        counter.innerText = '0';

        const updateCounter = () => {
            const target = +counter.getAttribute('data-count');
            const c = +counter.innerText;

            const increment = target / 1000;

            if (c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 1);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });

    // Coutdown
    const countdown = () => {
        const endTime = new Date('2024-11-01T23:59:59').getTime();
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance > 0) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            document.querySelector('.days').innerText = days;
            document.querySelector('.hours').innerText = hours;
            document.querySelector('.minutes').innerText = minutes;
            document.querySelector('.seconds').innerText = seconds;
        } else {
            document.querySelector('.countdown').innerText = "Registration Closed";
        }
    };
    const countdownElement = document.querySelector('.countdown');
    if (countdownElement) {
        setInterval(countdown, 1000);
    }

    // Header fixed
    var header = document.querySelector('.header-fixed');
    var scrollPositionToRemoveClass = 10;
    var lastScrollY = window.scrollY;

    if (header) {
        window.addEventListener('scroll', function () {
            var currentScrollY = window.scrollY;

            if (currentScrollY > scrollPositionToRemoveClass) {
                header.classList.add('set-header-fixed');
            } else {
                header.classList.remove('set-header-fixed');
            }

            if (currentScrollY === 0) {
                header.classList.add('zero-header-fixed');
            } else {
                header.classList.remove('zero-header-fixed');
            }

            if (currentScrollY < lastScrollY) {
                header.classList.remove('set-header-fixed');
            }
            lastScrollY = currentScrollY;
        });
    };

    // Event Page Tabs
    const tabButtons = document.querySelectorAll('.events-page__tab_btn');
    const tabContents = document.querySelectorAll('.events-page__tab_content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Courses Details Page Tabs
    const coursesdtButtons = document.querySelectorAll('.courses-details__tab_btn');
    const coursesdtContents = document.querySelectorAll('.courses-details__tab_content');

    coursesdtButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            coursesdtButtons.forEach(btn => btn.classList.remove('active'));
            coursesdtContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Curriculum section
    var curriculumHeader = document.querySelectorAll('.curriculum-section__header');
    if (curriculumHeader) {
        curriculumHeader.forEach(function (setHeader) {
            setHeader.addEventListener('click', function () {
                var content = this.nextElementSibling;
                content.classList.toggle('active');
                setHeader.classList.toggle('active');
            });
        });
    }

    // My Learning
    var curriculumSidebar = document.querySelectorAll('.curriculum-sidebar__header');
    if (curriculumSidebar) {
        curriculumSidebar.forEach(function (setHeader) {
            setHeader.addEventListener('click', function () {
                var content = this.nextElementSibling;
                content.classList.toggle('active');
                setHeader.classList.toggle('active');
            });
        });
    };

    // Courses filter reset
    const resetFilter = document.querySelector('.reset-filter');
    if (resetFilter) {
        resetFilter.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function (checkbox) {
                checkbox.checked = false;
            });
        });
    };

    // Courses filter popup
    const coursesGridV2Filter = document.querySelectorAll('.courses-grid-v2_filter');
    if (coursesGridV2Filter) {
        coursesGridV2Filter.forEach(btnV2Filter => {
            btnV2Filter.addEventListener('click', function (event) {
                event.stopPropagation();
                const btnV2FilterPopup = this.nextElementSibling;
                btnV2FilterPopup.classList.toggle('active');

                document.addEventListener('click', function btnV2FilterClickOutside(v2filter) {
                    if (!btnV2FilterPopup.contains(v2filter.target) && !btnV2Filter.contains(v2filter.target)) {
                        btnV2FilterPopup.classList.remove('active');
                        document.removeEventListener('click', btnV2FilterClickOutside);
                    }
                });
            });
        });
    }

    // FAQs Page Question
    let activeButton = null;

    document.querySelectorAll('.faqs-question_btn').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;

            if (activeButton && activeButton !== button) {
                const activeContent = activeButton.nextElementSibling;
                activeContent.classList.remove('active');
                activeButton.classList.remove('active');
            }

            button.classList.toggle('active');
            content.classList.toggle('active');

            if (button.classList.contains('active')) {
                activeButton = button;
            } else {
                activeButton = null;
            }
        });
    });

    // Become an instructors Page
    const becomeAnBtn = document.querySelectorAll('.become-an-box_btn');
    const becomeAnContent = document.querySelectorAll('.become-an-box_brief');

    function removeActiveBecomeAn() {
        becomeAnBtn.forEach(becomeAnBtnAss => becomeAnBtnAss.classList.remove('active'));
        becomeAnContent.forEach(becomeAnContentAss => becomeAnContentAss.classList.remove('active'));
    }

    becomeAnBtn.forEach((setBecomeAnBtn, index) => {
        setBecomeAnBtn.addEventListener('click', () => {
            removeActiveBecomeAn();
            setBecomeAnBtn.classList.add('active');
            becomeAnContent[index].classList.add('active');
        });
    });

    // Question landing-page-online-offline courses
    document.querySelectorAll('.questions-items_title').forEach(questionsTitle => {
        questionsTitle.addEventListener('click', function () {
            const questionsBrief = this.nextElementSibling;
            const briefIsOpen = questionsBrief.style.height && questionsBrief.style.height !== '0px';

            document.querySelectorAll('.questions-items_brief').forEach(questionsBrief => {
                questionsBrief.style.height = '0px';
            });
            document.querySelectorAll('.icon-plus').forEach(icon => {
                icon.classList.remove('d-none');
            });
            document.querySelectorAll('.icon-minus').forEach(icon => {
                icon.classList.add('d-none');
            });

            if (!briefIsOpen) {
                questionsBrief.style.height = questionsBrief.scrollHeight + 'px';
                this.querySelector('.icon-plus').classList.add('d-none');
                this.querySelector('.icon-minus').classList.remove('d-none');
            } else {
                questionsBrief.style.height = '0px';
                this.querySelector('.icon-plus').classList.remove('d-none');
                this.querySelector('.icon-minus').classList.add('d-none');
            }
        });
    });

    // Gallery btn
    const galleryFillterBtn = document.querySelectorAll('.gallery-fillter_btn');

    galleryFillterBtn.forEach(setGalleryFillterBtn => {
        setGalleryFillterBtn.addEventListener('click', function () {
            galleryFillterBtn.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Portfolio btn
    const portfolioFillterBtn = document.querySelectorAll('.portfolio-fillter_btn');

    portfolioFillterBtn.forEach(setportfolioFillterBtn => {
        setportfolioFillterBtn.addEventListener('click', function () {
            portfolioFillterBtn.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Add ',' category
    const insCoursesCategory = document.querySelectorAll('.instructor-courses_category');

    insCoursesCategory.forEach(insCoursesCategorys => {
        const categoriesInside = insCoursesCategorys.querySelectorAll('a span');
        categoriesInside.forEach((category, index) => {
            if (index < categoriesInside.length - 1) {
                category.textContent += ',';
            }
        });
    });

    // Add or remove quantity of products
    const productQuantity = document.querySelectorAll('.product-quantity');

    productQuantity.forEach(group => {
        const minusButton = group.querySelector('#minus');
        const plusButton = group.querySelector('#plus');
        const setNumber = group.querySelector('#setNumber');

        if (minusButton && plusButton && setNumber) {
            minusButton.addEventListener('click', () => {
                let currentValue = parseInt(setNumber.value);
                setNumber.value = currentValue > 0 ? currentValue - 1 : 0;
            });

            plusButton.addEventListener('click', () => {
                let currentValue = parseInt(setNumber.value);
                setNumber.value = currentValue + 1;
            });
        };
    });

    // Shop Details Tabs
    const prdDetailTab = document.querySelectorAll('.product-details__tab');
    const prdDtailContent = document.querySelectorAll('.product-details__content_inner');

    prdDetailTab.forEach(tab => {
        tab.addEventListener('click', function () {
            const prDtarget = this.getAttribute('data-tab');

            prdDetailTab.forEach(prdDetailTabs => prdDetailTabs.classList.remove('active'));
            prdDtailContent.forEach(prdDtailContents => prdDtailContents.classList.remove('active'));

            this.classList.add('active');
            document.querySelector(`.product-details__content_inner[data-content="${prDtarget}"]`).classList.add('active');
        });
    });

    // Href review tab
    const reviewButton = document.querySelector('button[data-tab="reviews"]');
    const reviewContent = document.querySelector('div[data-content="reviews"]');
    const reviewTrigger = document.querySelector('.product-details__review');
    const productDetailsTabs = document.querySelector('.product-details__tabs');

    if (reviewTrigger) {
        reviewTrigger.addEventListener('click', () => {
            document.querySelectorAll('.product-details__tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.product-details__content_inner').forEach(content => content.classList.remove('active'));
            reviewButton.classList.add('active');
            reviewContent.classList.add('active');
            productDetailsTabs.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Rating select
    const yourRating = document.querySelectorAll('#your-rating .star-wrapper');
    yourRating.forEach(setStar => {
        setStar.addEventListener('click', function () {
            const clickedIndex = parseInt(setStar.getAttribute('data-index'));
            yourRating.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < clickedIndex; i++) {
                yourRating[i].classList.add('active');
            }
        });
    });

    // Return display coupon
    const couponControl = document.querySelector('.rtn-coupon_control');
    const couponForm = document.querySelector('.rtn-coupon_form');
    if (couponControl && couponForm) {
        couponControl.addEventListener('click', function () {
            couponForm.classList.toggle('active');
        });
    }

    // Method Your Order
    const orderInfos = document.querySelectorAll('.checkout-page__order_info');
    const radioInputs = document.querySelectorAll('input[type="radio"][name="payment-method"]');
    if (radioInputs.length >= 4) {
        radioInputs[3].checked = true;
    }
    orderInfos.forEach((info, index) => {
        info.addEventListener('click', function () {
            document.querySelectorAll('.checkout-page__order_box').forEach(box => {
                box.classList.remove('active');
            });

            const orderBoxes = document.querySelectorAll('.checkout-page__order_box');
            if (orderBoxes[index]) {
                orderBoxes[index].classList.add('active');
            }
        });
    });

    // Set PaddingTop MyLearning
    var myLearningTop = document.querySelector('.my-learning__top');
    var myLearningSideBar = document.querySelector('.my-learning__toggleSidebar');
    if (myLearningTop || myLearningSideBar) {
        var topHeight = myLearningTop.offsetHeight;
        var myLearningContent = document.querySelector('.my-learning__content');
        myLearningContent.style.paddingTop = topHeight + 'px';
        myLearningSideBar.style.top = topHeight + 'px';
    }

    // Sidebar MyLearning
    const learningContentBox = document.querySelector('.my-learning__content_box');
    const learningSidebar = document.querySelector('.my-learning__toggleSidebar');
    const learningContentBody = document.querySelector('.my-learning__content_body');
    const hiddenCrr = document.querySelector('.hidden-crr');
    const hiddenCrrClose = document.querySelector('.hidden-crr-close');

    if (learningContentBox && learningSidebar) {
        learningSidebar.addEventListener('click', function () {
            learningContentBox.classList.toggle('active');
            learningSidebar.classList.toggle('active');
            learningContentBody.classList.toggle('active');
            if (hiddenCrr && hiddenCrrClose) {
                hiddenCrr.classList.toggle('active');
                hiddenCrrClose.classList.toggle('active');
            }
        });
    };

    // Lesson sidebar change content
    const sidebarItems = document.querySelectorAll('.curriculum-sidebar__content_items .lesson-title');

    sidebarItems.forEach(function (setSidebarItems) {
        setSidebarItems.addEventListener('click', function (e) {
            e.preventDefault();

            const lessonType = setSidebarItems.getAttribute('data-lesson-type');

            const contentItems = document.querySelectorAll('.my-learning__content_body [data-lesson-type]');
            contentItems.forEach(function (contentItem) {
                contentItem.classList.remove('active');
            });

            const activeItem = document.querySelector(`.my-learning__content_body [data-lesson-type="${lessonType}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }

            sidebarItems.forEach(function (sidebarItem) {
                sidebarItem.classList.remove('active');
            });

            setSidebarItems.classList.add('active');
        });
    });

    // Set PaddingTop Page Banner Title
    var setHeightPageTitle = document.querySelector('.zero-header-fixed');
    if (setHeightPageTitle) {
        var pdTopHeight = setHeightPageTitle.offsetHeight;
        var pageBannerTitle = document.querySelector('.page-banner-title');
        if (pageBannerTitle) {
            pageBannerTitle.style.paddingTop = pdTopHeight + 'px';
        }
    }

    // Courses View Layout
    const gridViewButton = document.querySelector('.courses-view-grid');
    const listViewButton = document.querySelector('.courses-view-list');
    const coursesContainer = document.querySelector('.courses-type');
    if (gridViewButton && listViewButton && coursesContainer) {
        gridViewButton.addEventListener('click', () => {
            listViewButton.classList.remove('active');
            gridViewButton.classList.add('active');
            coursesContainer.classList.add('grid-view');
            coursesContainer.classList.remove('list-view');
        });

        listViewButton.addEventListener('click', () => {
            gridViewButton.classList.remove('active');
            listViewButton.classList.add('active');
            coursesContainer.classList.add('list-view');
            coursesContainer.classList.remove('grid-view');
        });
    }

    // Progress Value Level
    var progressValueLevel = document.querySelectorAll('.progress-value-level');
    progressValueLevel.forEach(function (setValueLevel) {
        var valueLevel = setValueLevel.getAttribute('data-value-level');
        setValueLevel.style.width = valueLevel;
    });

    // Write A Review
    const writeReviewButton = document.querySelector('.write-a-review');
    const reviewWrapper = document.querySelector('.write-a-review_wrapper');
    const reviewPopup = document.querySelector('.write-a-review_popup');
    const closeIcon = document.querySelector('.write-a-review_close');
    const cancelButton = document.querySelector('.write-a-review_cancel');

    if (writeReviewButton && reviewWrapper && reviewPopup && closeIcon && cancelButton) {
        writeReviewButton.addEventListener('click', function () {
            reviewWrapper.classList.add('active');
            reviewPopup.classList.add('active');
        });

        closeIcon.addEventListener('click', function () {
            reviewWrapper.classList.remove('active');
            reviewPopup.classList.remove('active');
        });

        cancelButton.addEventListener('click', function (event) {
            // event.preventDefault();
            reviewWrapper.classList.remove('active');
            reviewPopup.classList.remove('active');
        });

        document.addEventListener('click', function (event) {
            if (!reviewPopup.contains(event.target) && !writeReviewButton.contains(event.target)) {
                reviewWrapper.classList.remove('active');
                reviewPopup.classList.remove('active');
            }
        });
    }

    // Categories popup
    var showCategoriesButton = document.querySelector('.show-course-categories');
    var courseCategoriesPopup = document.querySelector('.course-categories-popup');
    var body = document.body;
    if (showCategoriesButton) {
        showCategoriesButton.addEventListener('click', function (event) {
            event.stopPropagation();
            courseCategoriesPopup.classList.add('active');
            body.classList.add('course-categories-popup-overlay');
        });

        document.addEventListener('click', function (event) {
            if (!courseCategoriesPopup.contains(event.target) && !showCategoriesButton.contains(event.target)) {
                courseCategoriesPopup.classList.remove('active');
                body.classList.remove('course-categories-popup-overlay');
            }
        });

        var icons = document.querySelectorAll('.ctgr-parent_icon');

        icons.forEach(function (icon) {
            icon.addEventListener('click', function (event) {
                event.stopPropagation();

                var activeItems = document.querySelectorAll('.ctgr-parent_items.active');
                var activeIcons = document.querySelectorAll('.ctgr-parent_icon.active');

                activeItems.forEach(function (item) {
                    item.classList.remove('active');
                });

                activeIcons.forEach(function (icon) {
                    icon.classList.remove('active');
                });

                this.classList.add('active');
                this.closest('.ctgr-parent_items').classList.add('active');
            });
        });
    }

    // Filter mobile
    const courseFtMb = document.querySelector('.courses-filter-mobile');
    const coursesPageFt = document.querySelector('.courses-page__filter');
    if (courseFtMb) {
        courseFtMb.addEventListener('click', function () {
            coursesPageFt.classList.toggle('active');
            document.body.classList.toggle('overlay-body');
        });

        document.addEventListener('click', function (event) {
            if (!coursesPageFt.contains(event.target) && !courseFtMb.contains(event.target)) {
                coursesPageFt.classList.remove('active');
                document.body.classList.remove('overlay-body');
            }
        });
    }

    // WOW Transform Effects
    if (window.innerWidth <= 1200) {
        let wowElements = document.querySelectorAll('.wow');

        wowElements.forEach(function (wowjs) {
            let effectClasses = Array.from(wowjs.classList).filter(function (className) {
                return className.startsWith('fadeIn') || className.startsWith('fadeInLeft') || className.startsWith('fadeInRight');
            });
            effectClasses.forEach(function (effectClass) {
                wowjs.classList.remove(effectClass);
            });
            wowjs.classList.add('fadeInUp');
        });
    }
    new WOW().init();

    // Search Popup
    const searchIcon = document.querySelector('.search__icon');
    const searchPopup = document.querySelector('.search-popup');
    const searchOverlay = document.querySelector('.search-overlay');
    const searchInput = document.getElementById('search-input');
    const bodySearch = document.body;
    const registerLink = document.querySelector('.plf-navbar__register a');

    if (searchIcon && searchPopup && searchOverlay) {
        searchIcon.addEventListener('click', () => {
            searchPopup.classList.toggle('active');
            bodySearch.classList.toggle('search-overlay-popup');

            if (searchPopup.classList.contains('active')) {
                setTimeout(() => {
                    searchInput.focus();
                }, 300)
            }
        });

        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        document.addEventListener('click', (e) => {
            if (!searchPopup.contains(e.target) && !searchIcon.contains(e.target)) {
                searchPopup.classList.remove('active');
                bodySearch.classList.remove('search-overlay-popup');
                bodySearch.classList.remove('cursor-pointer-x');
            }
        });
    }

    document.addEventListener('mousemove', (e) => {
        if (modalRegisterForm && modalLoginForm && body && bodySearch) {
            const isRegisterFormActive = modalRegisterForm.classList.contains('active');
            const isLoginFormActive = modalLoginForm.classList.contains('active');
            const isSearchPopupActive = searchPopup && searchPopup.classList.contains('active');
            const isCourseCategoriesPopupActive = courseCategoriesPopup && courseCategoriesPopup.classList.contains('active');
            const isOutsideRegisterForm = !modalRegisterForm.contains(e.target);
            const isOutsideLoginForm = !modalLoginForm.contains(e.target);
            const isOutsideSearchPopup = searchPopup && searchIcon && !searchPopup.contains(e.target) && !searchIcon.contains(e.target);
            const isOutsideCourseCategoriesPopup = courseCategoriesPopup && !courseCategoriesPopup.contains(e.target) && showCategoriesButton && !showCategoriesButton.contains(e.target);

            if (
                (isRegisterFormActive && isOutsideRegisterForm) ||
                (isLoginFormActive && isOutsideLoginForm) ||
                (isSearchPopupActive && isOutsideSearchPopup) ||
                (isCourseCategoriesPopupActive && isOutsideCourseCategoriesPopup)
            ) {
                body.classList.add('cursor-pointer-x');
                bodySearch.classList.add('cursor-pointer-x');
            } else {
                body.classList.remove('cursor-pointer-x');
                bodySearch.classList.remove('cursor-pointer-x');
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (searchPopup && bodySearch && courseCategoriesPopup && body) {
            const isOutsideSearchPopup = !searchPopup.contains(e.target) && !searchIcon.contains(e.target);
            const isOutsideCourseCategoriesPopup = !courseCategoriesPopup.contains(e.target) && !showCategoriesButton.contains(e.target);

            if (isOutsideSearchPopup) {
                searchPopup.classList.remove('active');
                bodySearch.classList.remove('search-overlay-popup');
                bodySearch.classList.remove('cursor-pointer-x');
            }

            if (isOutsideCourseCategoriesPopup) {
                courseCategoriesPopup.classList.remove('active');
                body.classList.remove('course-categories-popup-overlay');
                body.classList.remove('cursor-pointer-x');
            }
        }
    });

    // Mobile Bottom Bar
    const mbLinks = document.querySelectorAll('.mobile-bottom-bar_link');
    const currentPage = window.location.pathname.split('/').pop();

    function setActiveLinkByPage() {
        mbLinks.forEach((assLink) => {
            if (assLink.tagName === 'A') {
                const linkPage = assLink.getAttribute('href').split('/').pop();

                if (linkPage === currentPage) {
                    assLink.classList.add('active');
                } else {
                    assLink.classList.remove('active');
                }
            }
        });
    }
    setActiveLinkByPage();

    // Mobile Filter Sticky
    const filterSticky = document.querySelector('.filter-sticky');
    const mobileBottomBar = document.querySelector('.mobile-bottom-bar');
    const sidePart = document.querySelector('.side-part');
    const FtStickyBody = document.body;

    if (filterSticky && sidePart) {
        filterSticky.addEventListener('click', function () {
            sidePart.classList.toggle('active');
            mobileBottomBar.classList.toggle('active');
            FtStickyBody.classList.toggle('body-overlay');
        });

        document.addEventListener('click', function (event) {
            const isClickInsideSidePart = sidePart.contains(event.target);
            const isClickInsideFilterSticky = filterSticky.contains(event.target);
            if (!isClickInsideSidePart && !isClickInsideFilterSticky) {
                sidePart.classList.remove('active');
                mobileBottomBar.classList.remove('active');
                FtStickyBody.classList.remove('body-overlay');
            }
        });
        const filterStickyOffsetTop = filterSticky.offsetTop;
        window.addEventListener('scroll', function () {
            const scrollPosition = window.scrollY || document.documentElement.scrollTop;
            if (scrollPosition >= filterStickyOffsetTop) {
                filterSticky.classList.add('filter-drift');
            }
            else {
                filterSticky.classList.remove('filter-drift');
            }
        });
    }

    // Tabs default
    const tabs = document.querySelectorAll('.tab-default');
    const tabExtend = document.querySelectorAll('.tab-extend');
    if (tabs.length > 0 && tabExtend.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabExtend.forEach(content => content.classList.remove('active'));
                tab.classList.add('active');

                const targetTabs = tab.getAttribute('data-tab');
                document.getElementById(targetTabs).classList.add('active');
            });
        });

        tabs[0].classList.add('active');
        tabExtend[0].classList.add('active');
    }

    // Show hide
    const reviewsItems = document.querySelectorAll('.reviews_items');
    const reviewsShow = document.querySelector('.reviews_show');
    let visibleItems = 2;
    reviewsItems.forEach((item, index) => {
        if (index >= visibleItems) {
            item.style.display = 'none';
        }
    });
    if (reviewsShow) {
        reviewsShow.addEventListener('click', () => {
            if (reviewsShow.textContent === 'Show more reviews') {
                reviewsItems.forEach(item => {
                    item.style.display = 'block';
                });
                reviewsShow.textContent = 'Show less reviews';
            } else {
                reviewsItems.forEach((item, index) => {
                    if (index >= visibleItems) {
                        item.style.display = 'none';
                    }
                });
                reviewsShow.textContent = 'Show more reviews';
            }
        });
    }

});


(function () {
    'use strict';
    /*===========================
    ScrollCollisionHandler
    ===========================*/
    var ScrollCollisionHandler = {
        window: null,
        windowHeight: 0,
        windowInnerHeight: 0,
        defaultOptions: {
            staticPassedClass: 'hasBeenPassed',
            staticVisibleClass: 'hasBeenVisible',
            passedClass: 'elementPassed',
            visibleClass: 'elementIsVisible',
            collideOffset: null,
            collideAfter: false,
            collideOnElementHeight: false,
            extraOffset: 0,
            removeWhenPassed: false,
            removeWhenVisible: false,
            removeWhenAlreadyPassed: false,
            removeWhenAlreadyVisible: false,
            refreshOnResize: true,
            removeOnResize: false,
            delay: 0,
            callbacks: {
                before: null,
                after: null,
                beforeVisible: null,
                afterVisible: null,
                alreadyVisible: null,
                notAlreadyVisible: null,
                alreadyPassed: null,
                notAlreadyPassed: null,
            }
        },
        offsets: [],
        initialized: false,
        initialize: function(elements) {
            if (elements instanceof jQuery) {
                return false;
            }
            if (ScrollCollisionHandler.initialized === true) {
                ScrollCollisionHandler.addMultipleElements(elements);
                return false;
            }

            var $window = $(window);
            ScrollCollisionHandler.window = $window;
            ScrollCollisionHandler.setWindowHeights();

            ScrollCollisionHandler.initialized = true;
            setTimeout(function() {
                //Add elements
                ScrollCollisionHandler.addMultipleElements(elements);
                ScrollCollisionHandler.startListeners();
            }, 500);
        },
        setWindowHeights: function() {
            ScrollCollisionHandler.windowHeight = ScrollCollisionHandler.window.height();
            ScrollCollisionHandler.windowInnerHeight = ScrollCollisionHandler.window.innerHeight();
        },
        startListeners: function() {
            //Initialize scroll event listener
            ScrollCollisionHandler.listenForScroll();
            //Initialize resizeEnd event listener
            ResizeHandler.onResizeEnd(function() {
                ScrollCollisionHandler.onResized();
            });
        },
        addMultipleElements: function(elements) {
            var elementLength = elements.length;
            if (elementLength > 0) {
                for (var i = 0; i < elementLength; i++) {
                    ScrollCollisionHandler.addElement(elements[i]);
                }
            }
        },
        addElement: function($element) {
            if (!($element instanceof jQuery) || $element.length == 0) {
                return false;
            }

            //Set default passed value
            $element.passed = false;
            $element.passedVisible = false;

            var markupOptions = {
                delay: $element.data('delay') || 0
            };
            var elementOptions = $element.options || {};
            var options = $.extend({}, ScrollCollisionHandler.defaultOptions, markupOptions, elementOptions);
            $element.options = options;
            var offset = options.collideOffset;

            if (options.collideOnElementHeight === true) {
                offset = $element.height();
            }

            if (offset == null) {
                offset = $element.offset().top + ScrollCollisionHandler.calculateExtraOffset($element, options);
            }

            //Store offset
            ScrollCollisionHandler.addOffset(offset);
            //Store element in the offset
            ScrollCollisionHandler.offsets[offset].push($element);
            
            var index = ScrollCollisionHandler.offsets[offset].length - 1;
            ScrollCollisionHandler.offsets[offset][index].index = index;
            ScrollCollisionHandler.offsets[offset][index].offset = offset;

            if (ScrollCollisionHandler.isVisible($element)) {
                ScrollCollisionHandler.runViaDelay($element, 'runAlreadyVisible');
            } else {
                ScrollCollisionHandler.runViaDelay($element, 'runNotAlreadyVisible');
            }
        },
        removeElement: function(offset, index) {
            if(typeof ScrollCollisionHandler.offsets[offset] != 'undefined') {
                if (typeof ScrollCollisionHandler.offsets[offset][index] != 'undefined') {
                    ScrollCollisionHandler.offsets[offset].splice(index, 1);
                }

                if (ScrollCollisionHandler.offsets[offset].length == 0) {
                    delete ScrollCollisionHandler.offsets[offset];
                }
            }
        },
        addOffset: function(offset) {
            if(typeof ScrollCollisionHandler.offsets[offset] == 'undefined') {
                ScrollCollisionHandler.offsets[offset] = [];
            }
        },
        calculateExtraOffset: function($element, options) {
            var extraOffset = options.extraOffset;
            if (options.collideAfter === true) {
                extraOffset += $element.height();
            }

            return extraOffset;
        },
        listenForScroll: function() {
            ScrollHandler.onScroll(function($this) {
                var scrollTop = $this.scrollTop();
                var collision = scrollTop + ScrollCollisionHandler.windowHeight;
                for (var offset in ScrollCollisionHandler.offsets) {
                    for (var i in ScrollCollisionHandler.offsets[offset]) {
                        var $element = ScrollCollisionHandler.offsets[offset][i];
                        if($element.passed) {
                            if(scrollTop < offset) {
                                ScrollCollisionHandler.runViaDelay($element, 'runBefore');
                            }
                        } else {
                            if(scrollTop >= offset) {
                                ScrollCollisionHandler.runViaDelay($element, 'runAfter');
                            }
                        }

                        if($element.passedVisible) {
                            if(collision <= offset) {
                                ScrollCollisionHandler.runViaDelay($element, 'runBeforeVisible');
                            }
                        } else {
                            if(collision > offset) {
                                ScrollCollisionHandler.runViaDelay($element, 'runAfterVisible');
                            }
                        }
                    }
                }
            }, true);
        },
        runViaDelay: function($element, method) {
            var delay = $element.options.delay;
            if (delay > 0) {
                setTimeout(function() {
                    ScrollCollisionHandler[method]($element);
                }, delay);
                return;
            }
            ScrollCollisionHandler[method]($element);
        },
        runAlreadyVisible: function($element) {
            $element.alreadyVisible = true;
            var options = $element.options;
            $element.addClass(options.staticVisibleClass);
            if (typeof options.callbacks.alreadyVisible == 'function') {
                options.callbacks.alreadyVisible($element);
            }
            
            if ($element.options.removeWhenAlreadyVisible === true) {
                ScrollCollisionHandler.removeElement($element.offset, $element.index);
            }
        },
        runNotAlreadyVisible: function($element) {
            $element.alreadyVisible = false;
            var options = $element.options;

            if (typeof options.callbacks.notAlreadyVisible == 'function') {
                options.callbacks.notAlreadyVisible($element);
            }
        },
        runBefore: function($element) {
            var options = $element.options;
            var callbacks = options.callbacks;
            $element.passed = false;
            if (options.passedClass) {
                $element.removeClass(options.passedClass);
            }
            if (typeof callbacks.before == 'function') {
                callbacks.before($element);
            }
        },
        runAfter: function($element) {
            var options = $element.options;
            var callbacks = options.callbacks;
            $element.passed = true;
            
            $element.addClass(options.staticPassedClass);
            if (options.passedClass) {
                $element.addClass(options.passedClass);
            }

            if (typeof callbacks.after == 'function') {
                callbacks.after($element);
            }
            if ($element.options.removeWhenPassed === true) {
                ScrollCollisionHandler.removeElement($element.offset, $element.index);
            }
        },
        runBeforeVisible: function($element) {
            var options = $element.options;
            var callbacks = options.callbacks;
            $element.passedVisible = false;
            if (options.visibleClass) {
                $element.removeClass(options.visibleClass);
            }
            if (typeof callbacks.beforeVisible == 'function') {
                callbacks.beforeVisible($element);
            }
        },
        runAfterVisible: function($element) {
            var options = $element.options;
            var callbacks = options.callbacks;
            $element.passedVisible = true;

            $element.addClass(options.staticVisibleClass);
            
            if (options.visibleClass) {
                $element.addClass(options.visibleClass);
            }

            if (typeof callbacks.afterVisible == 'function') {
                callbacks.afterVisible($element);
            }

            if ($element.options.removeWhenVisible === true) {
                ScrollCollisionHandler.removeElement($element.offset, $element.index);
            }
        },
        onResized: function() {
            ScrollCollisionHandler.setWindowHeights();
            for (var offset in ScrollCollisionHandler.offsets) {
                for (var index in ScrollCollisionHandler.offsets[offset]) {
                    var $element = ScrollCollisionHandler.offsets[offset][index];
                    var options = $element.options;
                    if (options.removeOnResize === true || options.refreshOnResize === true) {
                        ScrollCollisionHandler.removeElement(offset, index);
                    }

                    if (options.refreshOnResize === true) {
                        ScrollCollisionHandler.addElement($element);
                    }
                }
            }
        },
        isVisible: function($element) {
            var rect = $element[0].getBoundingClientRect();
            var viewHeight = Math.max(ScrollCollisionHandler.windowHeight, ScrollCollisionHandler.windowInnerHeight);
            var isVisible = !(rect.bottom < 0 || rect.top - viewHeight >= 0);
            return isVisible;
        },
    };

    if ($('.scrollCollisionDetection').length > 0) {
        var elements = [];
        $('.scrollCollisionDetection').each(function() {
            elements.push($(this));
        });
        ScrollCollisionHandler.initialize(elements);
    }

    window.ScrollCollisionHandler = ScrollCollisionHandler;
})();

/*===========================
ScrollCollisionHandler AMD Export
===========================*/
if (typeof(module) !== 'undefined')
{
    module.exports = window.ScrollCollisionHandler;
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        'use strict';
        return window.ScrollCollisionHandler;
    });
}

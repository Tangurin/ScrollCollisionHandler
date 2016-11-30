(function () {
    'use strict';
    /*===========================
    ScrollCollisionHandler
    ===========================*/
    var ScrollCollisionHandler = {
        defaultOptions: {
            fixOffset: null,
            fixAfter: false,
            extraOffset: 0,
            removeWhenPassed: false
        },
        offsets: [],
        initialize: function(elements) {
            setTimeout(function() {
                ScrollCollisionHandler.updateValues(elements);
                ScrollCollisionHandler.listenForScroll();
            }, 500);
        },
        listenForScroll: function() {
            ScrollHandler.onScroll(function($this) {
                var scrollTop = $this.scrollTop();
                for (var offset in ScrollCollisionHandler.offsets) {
                    for (var i in ScrollCollisionHandler.offsets[offset]) {
                        var $element = ScrollCollisionHandler.offsets[offset][i];
                        var callbacks = {};
                        if (typeof $element.callbacks != 'undefined') {
                            callbacks = $element.callbacks;
                        }
                        if($element.passed) {
                            if(scrollTop < offset) {
                                $element.passed = false;
                                if (typeof callbacks.before == 'function') {
                                    callbacks.before();
                                }
                            }
                        } else {
                            if(scrollTop >= offset) {
                                $element.passed = true;
                                if (typeof callbacks.after == 'function') {
                                    callbacks.after();
                                }
                                if ($element.options.removedWhenPassed === true) {
                                    ScrollCollisionHandler.removeElement(offset, i);
                                }
                            }
                        }
                    }
                }
            }, true);
        },
        updateValues: function(elements) {
            $.each(elements, function(i, $element) {
                ScrollCollisionHandler.addElement($element);
            });
        },
        addElement: function($element) {
            if (!($element instanceof jQuery) || $element.length == 0) {
                return false;
            }
            //Set default passed value
            $element.passed = false;

            var options = $element.options || {};
            options = $.extend(ScrollCollisionHandler.defaultOptions, options);
            $element.options = options;

            var offset = options.fixOffset;
            if (offset == null) {
                offset = $element.offset().top + ScrollCollisionHandler.calculateExtraOffset($element, options);
            }

            //Store offset
            ScrollCollisionHandler.addOffset(offset);
            //Store element in the offset
            ScrollCollisionHandler.offsets[offset].push($element);
        },
        removeElement: function(offset, index) {
            if(typeof ScrollCollisionHandler.offsets[offset] == 'undefined') {
                if (typeof ScrollCollisionHandler.offsets[offset][index] != 'undefined') {
                    delete ScrollCollisionHandler.offsets[offset][index];
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
            if (options.fixAfter === true) {
                extraOffset += $element.height();
            }

            return extraOffset;
        }
    };
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

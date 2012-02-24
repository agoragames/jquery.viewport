(function($) {

$.widget('ui.viewport', {
    options:{
        binderClass: 'viewportBinder',
        contentClass: 'viewportContent',
        position: 'center',
        content: false,
        height: false,
        width: false,
        scrollbars: false,
        scrollParent: null
    },

    _create: function() {
        var content = this.options.content;
        var isObject = typeof(content) == 'object';

        if (isObject && content.tagName != null) {
            this.options.content = $(content);
        } else if (isObject && $.isArray(content)) {
            this.options.content = $(content);
        }

        this.viewport = createViewport(this.element, this.options);
        this.viewport.adjust();
    },

    content: function() { return this.viewport.content; },
    binder:  function() { return this.viewport.binder; },
    adjust: function() { this.viewport.adjust(); },

    update:  function() {
        this.viewport.updateContentSize();
        this.viewport.adjust();
    },

    size: function(height, width) {
        if (height == null || width == null) {
            return this.viewport.getContentSize();
        }
        this.viewport.setContentHeight(height);
        this.viewport.setContentWidth(width);
    },

    height: function(height) {
        if (height == null) {
            return this.viewport.getContentSize().height;
        }
        this.viewport.setContentHeight(height);
    },

    width: function(width) {
        if (width == null) {
            return this.viewport.getContentSize().width;
        }
        this.viewport.setContentWidth(width);
    }
});

function createViewport(element, options) {
    var contentPosition = {top: 0, left: 0}
      , contentSize = {height: 0, width: 0}
      , viewportSize = {height: 0, width: 0}
      , centerHorizontal = true
      , centerVertical = true
      , heightDiff = 0
      , widthDiff = 0;
    
    var binder = $('<div class="' + options.binderClass + '"></div>');
    var content = $('<div class="' + options.contentClass + '"></div>');

    binder.css({position: 'absolute', overflow: 'hidden'});
    element.css({position: 'relative', overflow: 'hidden'});
    content.css({position: 'absolute'});

    var contents = false;
    if (options.content == false && element.children().length) {
        contents = element.children();
    } else if (options.content != false) {
        contents = options.content;
    }
    
    updateContentSize();
    updateContentPosition();
    
    if (contents) {
        contents.detach();
        content.append(contents);
    }
    
    binder.append(content);
    element.append(binder);

    if(options.scrollbars != false) {
      var scrollbarY = $("<div class='scrollbar-y'/>");
      var scrollbarX = $("<div class='scrollbar-x'/>");
        
      $(options.scrollParent).prepend(scrollbarX, scrollbarY);

      $(scrollbarY).css('height', $(options.scrollParent).height()+'px !important')
      var updatePane = function() {
        bPos = $(binder).position();
        cPos = $(content).position();
        maxY = bPos.top * -1;
        maxX = bPos.left * -1;
        currentY = maxY - cPos.top;
        currentX = maxX - cPos.left;

        $('.scrollbar-y').slider('value', 100 - (currentY/maxY * 100));
        $('.scrollbar-x').slider('value', (currentX/maxX * 100));
      }

      $('.scrollbar-x').slider({
        value: 0,
        orientation: 'horizontal',
        slide: function(event, ui) {
          updatePane();
          var newLeft = ($('.viewportBinder').position().left * -1) - Math.ceil((ui.value / 100) * ($(binder).position().left * -1));
          $('.viewportContent').css('left', newLeft)
        }
      })

      $('.scrollbar-y').slider({
        value: 0,
        orientation: 'vertical',
        slide: function(event, ui) {
          updatePane();
          var invertedBinder = $(binder).position().top * -1;
          var newTop = invertedBinder - Math.ceil(((100-ui.value) / 100) * invertedBinder);
          $('.viewportContent').css('top', newTop)
        }
      })

      element.bind('drag', function(event, ui) {
        updatePane();
      })
    }

    element.bind('dragstop', function(event, ui) {
        if(contentPosition.top != ui.position.top) {
            centerHorizontal = false;
        }
        if(contentPosition.left != ui.position.left) {
            centerVertical = false;
        }
        contentPosition.left = ui.position.left;
        contentPosition.top = ui.position.top;
    });

    function updateContentPosition() {
        var position = options.position.split(' ');

        if (position.indexOf('bottom') != -1) {
            centerVertical = false;
            contentPosition.top = viewportSize.height - contentSize.height;
        } else if (position.indexOf('top') != -1) {
            centerVertical = false;
            contentPosition.top = 0;
        }

        if (position.indexOf('right') != -1) {
            centerHorizontal = false;
            contentPosition.left = viewportSize.width - contentSize.width;
        } else if (position.indexOf('left') != -1) {
            centerHorizontal = false;
            contentPosition.left = 0;
        }
    }

    function updateContentSize() {
        if (options.width != false && options.height != false) {
            content.height(options.height);
            content.width(options.width);
        } else if (contents != false) {
            content.height(contents.height());
            content.width(contents.width());
        }

        contentSize = {
            height: content.height(),
            width: content.width()
        };
    }

    function adjust() {
        viewportSize.height = element.height();
        viewportSize.width = element.width();

        var diff;

        if (viewportSize.height > contentSize.height) {
            content.css('top', 0);
            binder.height(contentSize.height);
            binder.css('top', Math.floor(viewportSize.height / 2) -
                              Math.floor(contentSize.height / 2))
        } else {
            diff = contentSize.height - viewportSize.height;
            binder.height(viewportSize.height + diff * 2);
            binder.css('top', -diff);

            if (centerVertical) {
                contentPosition.top = Math.floor(diff / 2);
                content.css('top', contentPosition.top);
            } else {
                var newTop = contentPosition.top + (diff - heightDiff);
                newTop = newTop >= 0 ? newTop : 0;
                contentPosition.top = newTop;
                content.css('top', newTop);
            }
            heightDiff = diff;
        }

        if (viewportSize.width > contentSize.width) {
            content.css('left', 0);
            binder.width(contentSize.width);
            binder.css('left', Math.floor(viewportSize.width / 2) -
                               Math.floor(contentSize.width / 2));
        } else {
            diff = contentSize.width - viewportSize.width;
            binder.width(viewportSize.width + diff * 2);
            binder.css('left', -diff);

            if (centerHorizontal) {
                contentPosition.left = Math.floor(diff / 2);
                content.css('left', contentPosition.left);
            } else {
                var newLeft = contentPosition.left + (diff - widthDiff);
                newLeft = newLeft >= 0 ? newLeft : 0;
                contentPosition.left = newLeft;
                content.css('left', newLeft);
            }
            widthDiff = diff;
        }
    }

    function setContentHeight(height) {
        if (height != null) {
            contentSize.height = height;
            content.height(height);
        }
    }

    function setContentWidth(width) {
        if (width != null) {
            contentSize.width = width;
            content.width(width);
        }
    }

    function getContentSize() {
        return contentSize;
    }

    return {
        adjust: adjust,
        updateContentSize: updateContentSize,
        setContentHeight: setContentHeight,
        setContentWidth: setContentWidth,
        getContentSize: getContentSize,
        content: content,
        binder: binder
    };
}

})(jQuery);

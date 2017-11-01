/*!
 * shAutocomplete v0.2 (2017-11-01)
 * Autocomplete Bootstrap jQuery plugin
 * https://github.com/sunhater/shAutocomplete
 *
 * Copyright (c) 2017 Pavel Tzonkov <sunhater@sunhater.com>
 * Dual licensed under the MIT and GPL licenses
 */

(function($) {

    $.fn.autocomplete = function(options) {

    /** Default options */
        var o = {

        /** Bootstrap major version (3 or 4). Needed to render menu properly */
            bootstrapVersion: 3,

        /** How many time will be awaited to perform menu search (milisecs) */
            timeout: 1000,

        /** Maximal menu height in pixels. Set null to no limit */
            maxHeight: null,

        /** If maxHeight option is set to null and autocomplete menu
          * is too long, this is the margin of the menu from the bottom
          * of the viewport */
            bottomSpace: 20,

        /** Search request URL including search string parameter name */
            requestUrl: "request.json?q=",

        /** Debug flag */
            debug: false,


        /** Called 1 second (deafault timeout option) after last user input.
          * The function must always call passed fill() callback with object
          * parameter represents the content of the menu. In case of an error,
          * autofill() must call fill() without parameters.
          * @param input DOM element for search input field
          * @param fill function callback */

            autofill: function(input, fill) {

                $.ajax({

                    method: 'get',
                    dataType: 'json',
                    url: o.requestUrl + encodeURIComponent(input.value),

                    success: function(data) {
                        fill(data);
                    },

                    error: function() {
                        fill();
                        if (o.debug)
                            console.log('shAutofill search request failed!');
                    }

                });
            },


        /** Called when user chooses an item from the autofill menu
          * @param input DOM element for search input field
          * @param item DOM element for choosen option */

            choose: function(input, item) {},


        /** Called immediately after user input
          * @param input DOM element for search input field */

            input: function(input) {},


        /** How choosen item will be transfered to the input field
          * @param input DOM element for search input field
          * @param item DOM element for choosen option */

            transfer: function(input, item) {
                $(input).val($(item).text());
            }
        };


        $.extend(true, o, options);

        var resize = function() {
            var $menu = $('.shac.open .shac-menu, .shac-menu.show');

            if (!$menu.length)
                return;

            $menu.css({height: 'auto'});

            var menuOffset = $menu.offset(),
                menuTop = parseInt($menu.css('margin-top')),
                menuHeight = $menu.outerHeight(),
                menuBottom = menuOffset.top + menuHeight + menuTop + o.bottomSpace,
                windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

            if (menuBottom >= windowHeight) {
                var height = windowHeight - menuOffset.top - menuTop - o.bottomSpace - 1;
                $menu.css({height: height});
            }
        },

        open = function(wrap) {
            if (o.bootstrapVersion == 3)
                $(wrap).addClass('open');
            else if (o.bootstrapVersion == 4) {
                $(wrap).addClass('show');
                $(wrap).find('.shac-menu').addClass('show');
            }
        },

        close = function(wrap) {
            $(wrap).find('.shac-menu').scrollTop(0);
            $(wrap).find('input').removeData('active');

            if (o.bootstrapVersion == 3)
                $(wrap).removeClass('open');
            else if (o.bootstrapVersion == 4) {
                $(wrap).removeClass('show');
                $(wrap).find('.shac-menu').removeClass('show');
            }
        },

        renderOption = function(id, label) {
            if (o.bootstrapVersion == 3)
                return '<li data-id="' + id + '" class="shac-item"><a href="javascript:;">' + label + '</a></li>';
            else if (o.bootstrapVersion == 4)
                return '<li data-id="' + id + '" class="shac-item dropdown-item">' + label + '</li>';
        };


        $(window).off('click.shac').on('click.shac', function() {
            close('.shac');
        }).off('resize.shac').on('resize.shac', resize);

        $('body').on('click.shac', '.bs-dropdown, .shac input', function(e) {
            e.stopPropagation();
        });

        var space = o.bootstrapVersion == 3 ? 5 : 8;

        $(this)
        .wrap('<div class="shac" />')
        .after('<ul class="shac-menu dropdown-menu" />')

        .each(function() {

            var queue = 0,
                locked = false,
                $bs = $(this).parent(),
                $menu = $bs.find('.shac-menu');

            $(this).on('input.shac', function() {
                var that = this;
                close($bs);
                queue++;

                if (o.debug)
                    console.log("Input: " + this.value);
                o.input(this);

                setTimeout(function() {

                    queue--;
                    if (queue || locked)
                        return;

                    locked = true;

                    if (o.debug)
                        console.log('Search: ' + that.value);

                    o.autofill(that, function(content) {

                        // error
                        if (content === undefined) {
                            locked = false;
                            return;
                        }

                        if ($.isEmptyObject(content))
                            return;

                        $menu.html('');

                        if (o.maxHeight)
                            $menu.css({maxHeight: o.maxHeight});

                        for (var i in content)
                            $menu.append(renderOption(i, content[i]));

                        $menu.find('.shac-item').click(function() {
                            if (o.debug)
                                console.log($(this).data());
                            o.choose(that, this);
                            close($bs);
                            o.transfer(that, this);
                        });

                        open($bs);

                        setTimeout(resize, 0);

                        locked = false;
                    });
                }, o.timeout);
            });
        })

        .keydown(function(e) {

            var active,
                data = $(this).data(),
                $menu = $(this).next(),
                $bs = $(this).parent(),
                length = $menu.find('.shac-item').length,
                ENTER_KEY = (e.keyCode === 13),
                ESC_KEY = (e.keyCode === 27),
                UP_KEY = (e.keyCode === 38),
                DOWN_KEY = (e.keyCode === 40);

            if (ENTER_KEY) {
                if (data.active === undefined)
                    return true;
                var $li = $menu.find('.shac-item').eq(data.active);
                if (o.debug)
                    console.log($li.data());
                o.choose(this, $li);
                o.transfer(this, $li);
                close($bs);
                return false;
            }

            if (ESC_KEY) {
                close($bs);
                return;
            }

            if (UP_KEY) {
                if (data.active === undefined) {
                    active = length - 1;
                } else {
                    active = data.active;
                    active--;
                    if (active < 0)
                        active = length - 1;
                }
            }

            if (DOWN_KEY) {
                if (data.active === undefined)  {
                    active = 0;
                } else {
                    active = data.active;
                    active++;
                    if (active >= length)
                        active = 0;
                }
            }

            if (UP_KEY || DOWN_KEY) {
                var $active = $menu.find('.shac-item').eq(active),
                    menuHeight = $menu.innerHeight(),
                    menuPosition = $menu.scrollTop(),
                    scrollHeght = $menu.prop('scrollHeight'),
                    itemPosition = $active.position().top + menuPosition,
                    itemHeight = $active.outerHeight(),
                    itemBottomPosition = itemPosition + itemHeight + space,
                    itemTopPosition = itemPosition - space;

                $(this).data({active: active});
                $menu.find('.shac-item').removeClass('key-active');
                $active.addClass('key-active');

                if (scrollHeght > menuHeight)
                    $menu.scrollTop(UP_KEY
                        ? itemTopPosition
                        : (itemBottomPosition - menuHeight)
                    );

                return false;
            }

        });
    }

})(jQuery);
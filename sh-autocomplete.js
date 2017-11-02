/*!
 * shAutocomplete v0.3 (2017-11-02)
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


    /** SETTINGS **/


        /** Bootstrap major version (3 or 4). Needed to render menu properly */
            bootstrapVersion: 3,

        /** How many time will be awaited to perform search request (msecs) */
            timeout: 1000,

        /** Minimum characters (excluding spaces) to perform search request */
            minChars: 3,

        /** Limit results. null means no limit */
            limit: null,

        /** Search cache */
            cache: true,

        /** Remove unnecessary empty spaces from search string */
            normalizeQuery: true,

        /** Maximal menu height in pixels. null means no limit */
            maxHeight: null,

        /** If maxHeight option is set to null and autocomplete menu
          * is too long, this option is the margin in pixels of the menu
          * from the bottom of the viewport */
            bottomSpace: 20,

        /** Search request URL including search string parameter name */
            requestUrl: "request.json?q=",

        /** Debug flag */
            debug: false,


    /** CALLBACKS **/


        /** Called when user chooses an item from the autofill menu
          * @param input DOM element for search input field
          * @param item DOM element for choosen option */

            choose: function(input, item) {},


        /** Called immediately after user input
          * @param input DOM element for search input field */

            input: function(input) {},


        /** Called when the search starts
          * @param input DOM element for search input field */

            searchStart: function(input) {},


        /** Called when the search ends
          * @param input DOM element for search input field */

            searchEnd: function(input) {},


        /** Convert the result from request to data for the menu
          * @param data Data from search request result */

            result: function(data) {
                return data;
            },


        /** How choosen item will be transfered to the input field
          * @param input DOM element for search input field
          * @param item DOM element for choosen option */

            transfer: function(input, item) {
                $(input).val($(item).text());
            },


        /** Called 1 second (deafault timeout option) after last user input.
          * The function must always call passed fill() callback with object or
          * array parameter represents the content of the menu. In case of
          * error, autofill() must call fill() without parameters. Override
          * this option only if you know what to do with it.
          * @param input DOM element for search input field
          * @param fill function callback */

            autofill: function(input, fill) {

                $.ajax({

                    method: 'get',
                    dataType: 'json',
                    url: o.requestUrl + encodeURIComponent(input.value),

                    success: function(data) {
                        fill(o.result(data));
                    },

                    error: function() {
                        fill();
                        if (o.debug)
                            console.log('shAutofill search request failed!');
                    }

                });

            }

        };


        $.extend(true, o, options);

        var BOOTSTRAP3 = (o.bootstrapVersion == 3);
            BOOTSTRAP4 = (o.bootstrapVersion == 4);

        if (!BOOTSTRAP3 && !BOOTSTRAP4) {
            alert("shAutocomplete: Bootstrap versions 3 and 4 are supported only!");
            return;
        }

        resize = function() {
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
            if (BOOTSTRAP3)
                $(wrap).addClass('open');
            else {
                $(wrap).addClass('show');
                $(wrap).find('.shac-menu').addClass('show');
            }
        },

        close = function(wrap) {
            $(wrap).find('.shac-menu').scrollTop(0);
            $(wrap).find('input').removeData('active');

            if (BOOTSTRAP3)
                $(wrap).removeClass('open');
            else {
                $(wrap).removeClass('show');
                $(wrap).find('.shac-menu').removeClass('show');
            }
        },

        renderOption = function(id, label) {
            return BOOTSTRAP3
                ? '<li data-id="' + id + '" class="shac-item"><a href="javascript:;">' + label + '</a></li>'
                : '<li data-id="' + id + '" class="shac-item dropdown-item">' + label + '</li>';
        };


        $(window).off('click.shac').on('click.shac', function() {
            close('.shac');
        }).off('resize.shac').on('resize.shac', resize);

        $('body').on('click.shac', '.shac-menu, .shac input', function(e) {
            e.stopPropagation();
        });

        var space = BOOTSTRAP3 ? 5 : 8;

        $(this)
        .wrap('<div class="shac" />')
        .after('<ul class="shac-menu dropdown-menu" />')

        .each(function() {

            var queue = 0,
                cache = [],
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
                    if (queue || locked ||
                        ($(that).val().replace(/\s+/g, '').length < o.minChars)
                    )
                        return;

                    locked = true;
                    $(that).prop({readonly: true});

                    if (o.normalizeQuery)
                        $(that).val(that.value.replace(/^\s+/, "").replace(/\s+$/, "").replace(/\s+/g, " "));

                    o.searchStart(that);

                    if (o.debug)
                        console.log('Search: ' + that.value);

                    var fill = function(content) {
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
                            $(that).focus();
                        });

                        open($bs);

                        setTimeout(resize, 0);

                        locked = false;
                        $(that).prop({readonly: false});
                        o.searchEnd(that)
                    };

                    if (o.cache && (cache[that.value] !== undefined)) {
                        if (!$.isEmptyObject(cache[that.value]))
                            fill(cache[that.value]);
                        else {
                            locked = false;
                            $(that).prop({readonly: false});
                            o.searchEnd(that);
                        }
                        return;
                    }

                    o.autofill(that, function(content) {

                        // error or empty result
                        if ((typeof content !== "object") ||
                            (content === undefined) ||
                            $.isEmptyObject(content)
                        ) {
                            locked = false;
                            $(that).prop({readonly: false});
                            o.searchEnd(that);
                            if (o.cache)
                                cache[that.value] = [];
                            return;
                        }

                        if (o.limit) {
                            var length = content instanceof Array
                                ? content.length
                                : Object.keys(content).length;

                            if (length > o.limit) {
                                var i = 0;
                                for (var k in content) {
                                    i++;
                                    if (i > o.limit)
                                        delete content[k];
                                }
                            }
                        }

                        if (o.cache)
                            cache[that.value] = content;

                        fill(content);
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
    };

})(jQuery);

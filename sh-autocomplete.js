/*!
 * shAutocomplete v0.5 (2018-02-05)
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


        /** Search request settings. These are actually jQuery ajax settings
          * (excluding queryParam) that could be extended. In the most common
          * case you should override url and queryParam settings only. For more
          * information see http://api.jquery.com/jquery.ajax */

            request: {
                url: '',
                method: 'get',
                dataType: 'json',
                queryParam: 'q' // Query string parameter name
            },

        /** How much time will be awaited to perform search request (msecs) */
            timeout: 1000,

        /** Minimum characters (excluding spaces) to perform search request */
            minChars: 3,

        /** Remove unnecessary empty spaces from query string before search */
            normalizeQuery: true,

        /** Limit results. null means no limit */
            limit: null,

        /** Search cache */
            cache: true,

        /** Maximal menu height in pixels. null means no limit */
            maxHeight: null,

        /** Minimal menu height in pixels */
            minHeight: 82,

        /** If maxHeight option is set to null and the autocomplete menu
          * is too long, this option is the margin in pixels of the menu
          * from the bottom of the viewport */
            bottomSpace: 20,

        /** Bootstrap major version (3 or 4). Needed to render menu properly */
            bootstrapVersion: 3,

        /** Debug flag */
            debug: false,


    /** CALLBACKS **/


        /** Called when user chooses an item from the autocomplete menu
          * @param input DOM element for search input field
          * @param item DOM element for chosen option */

            choose: function(input, item) {},


        /** Called when the search starts
          * @param input DOM element for search input field */

            searchStart: function(input) {},


        /** Called when the search ends
          * @param input DOM element for search input field */

            searchEnd: function(input) {},


        /** Called on every user input
          * @param input DOM element for search input field */

            input: function(input) {},


        /** Convert the result from the request to content object or
          * array for the menu
          * @param data Data from search request result */

            result: function(data) {
                return data;
            },


        /** How the chosen item will be shown into the input field
          * @param item DOM element for chosen option */

            transfer: function(item) {
                return $(item).text();
            },


        /** Called 1 second (deafault timeout option) after last user input.
          * The function must always call passed fill() callback with object or
          * array parameter represents the content of the menu. In case of
          * error, autofill() must call fill() without parameters. Override
          * this option only if you know what to do with it.
          * @param input DOM element for search input field
          * @param fill function callback */

            autofill: function(input, fill) {
                request(input, fill);
            }

        };


        $.extend(true, o, options);

        var BOOTSTRAP3 = (o.bootstrapVersion == 3),
            BOOTSTRAP4 = (o.bootstrapVersion == 4);

        if (!BOOTSTRAP3 && !BOOTSTRAP4) {
            alert("shAutocomplete: Bootstrap versions 3 and 4 are supported only!");
            return;
        }

        var request = function(input, fill) {

            var opts = $.extend(true, {}, o.request),
                data = {};

            data[opts.queryParam] = input.value;
            delete opts.queryParam;

            if ((opts.data === undefined) ||
                (typeof opts.data !== "object") ||
                (opts.data !== Object(opts.data))
            )
                opts.data = data;
            else
                $.extend(true, opts.data, data);

            opts.success = function(data) {
                fill(o.result(data));
            };

            opts.error = function(xhr, status, error) {
                fill();
                if (o.debug)
                    console.log('shAutocomplete: Search request failed!', status, error, xhr);
            };

            opts.complete = function() {
                fill(true);
            };

            $.ajax(opts);
        },

        resize = function() {
            var $menu = $('.shac.open .shac-menu, .shac-menu.show');

            if (!$menu.length)
                return;

            $menu.css({height: 'auto'});

            var menuTop = parseInt($menu.css('margin-top')),
                menuOffset = $menu.offset().top,
                menuHeight = $menu.outerHeight(),
                windowHeight = window.innerHeight,
                pageHeight = document.documentElement.clientHeight,
                height = windowHeight - menuOffset - menuTop - o.bottomSpace;

            if (windowHeight < pageHeight)
                height += $(document).scrollTop();

            if (height < o.minHeight)
                height = o.minHeight;

            if (height < menuHeight)
                $menu.css({height: height});
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
            var $li = BOOTSTRAP3
                ? $('<li class="shac-item"><a /></li>')
                : $('<li class="shac-item dropdown-item" />');

            $li.attr('data-id', id);

            if (typeof label === 'string') {
                if (BOOTSTRAP3)
                    $li.find('a').html(label);
                else
                    $li.html(label);

            } else if (typeof label === 'object') {
                if (BOOTSTRAP3)
                    $li.find('a').html(label.label);
                else
                    $li.html(label.label);

                var i, k, v;

                for (i in label) {
                    console.log(typeof label[i]);
                    if ((typeof label[i] !== 'string') ||
                        !/^[0-9a-z_]+$/i.test(i)
                    )
                        continue;

                    k = 'data-' + i.replace(/([A-Z])/g, '-$1').replace(/^-/, '').toLowerCase();
                    v = label[i];
                    $li.attr(k, v);
                }
            }

            return $('<div />').append($li).html();
        };

        $(window).off('click.shac').on('click.shac', function() {
            close('.shac');
        }).off('resize.shac scroll.shac').on('resize.shac scroll.shac', resize);

        $('body').on('click.shac', '.shac-menu, .shac input', function(e) {
            e.stopPropagation();
        });

        $(this)
        .attr({autocomplete: 'off'})
        .wrap('<div class="shac" />')
        .after('<ul class="shac-menu dropdown-menu" />')

        .each(function() {

            var queue = 0,
                cache = [],
                locked = false,
                $bs = $(this).parent(),
                $menu = $bs.find('.shac-menu').css({width: $(this).outerWidth()});

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
                            $(that).val(o.transfer(this)).focus();
                        });

                        open($bs);

                        setTimeout(resize, 0);

                        locked = false;
                        $(that).prop({readonly: false});
                        o.searchEnd(that);
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

                        // complete request, error or empty result
                        if ((content === true) ||
                            (typeof content !== "object") ||
                            (content === undefined) ||
                            $.isEmptyObject(content)
                        ) {
                            locked = false;
                            $(that).prop({readonly: false});
                            o.searchEnd(that);
                            if (o.cache && (content !== true))
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
                $(this).val(o.transfer($li));
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
                var space = BOOTSTRAP3 ? 5 : 8,
                    $active = $menu.find('.shac-item').eq(active),
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

        })

        .next('.shac-menu').on('mousewheel.shac DOMMouseScroll.shac', function(e) {

            if (this.scrollHeight < $(this).innerHeight())
                return;

            var delta = e.wheelDelta || (e.originalEvent && e.originalEvent.wheelDelta) || -e.detail,
                bottom = (this.scrollTop + $(this).outerHeight() - this.scrollHeight) >= 0,
                top = this.scrollTop <= 0;

            if ((bottom && (delta < 0)) ||
                (top    && (delta > 0))
            )
                e.preventDefault();

        });
    };

})(jQuery);

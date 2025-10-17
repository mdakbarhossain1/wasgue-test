/**
 * @author      Flycart (Alagesan)
 * @license     http://www.gnu.org/licenses/gpl-3.0.html
 * @link        https://www.flycart.org
 * */

if (typeof (wlr_jquery) == 'undefined') {
    wlr_jquery = jQuery.noConflict();
}

wlr = window.wlr || {};
(function (wlr) {
    wlr.show_notice = function (html_element, $target) {
        if (!$target) {
            $target = wlr_jquery('.woocommerce-notices-wrapper:first') ||
                wlr_jquery('.cart-empty').closest('.woocommerce') ||
                wlr_jquery('.woocommerce-cart-form');
        }
        $target.prepend(html_element);
    };
    wlr.displayStoreNotice = function (message, type = 'info') {
        let class_name = 'is-info';
        if (type === 'error') {
            class_name = 'is-error';
        }
        // const checkoutContainer = wlr_jquery('.wp-block-woocommerce-checkout.wc-block-checkout ');
        const checkoutContainer = wlr_jquery('.wc-block-components-sidebar-layout.wc-block-checkout #contact-fields  .wc-block-components-notices__snackbar.wc-block-components-notice-snackbar-list div')
        if (checkoutContainer.length) {
            const errorNotice = wlr_jquery('<div class="wlr-custom-notice wc-block-components-notice-snackbar wc-block-components-notice-banner  notice-transition-enter-done ' + class_name + '">' +
                '            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"\n' +
                '                 focusable="false">\n' +
                '                <path\n' +
                '                    d="M12 3.2c-4.8 0-8.8 3.9-8.8 8.8 0 4.8 3.9 8.8 8.8 8.8 4.8 0 8.8-3.9 8.8-8.8 0-4.8-4-8.8-8.8-8.8zm0 16c-4 0-7.2-3.3-7.2-7.2C4.8 8 8 4.8 12 4.8s7.2 3.3 7.2 7.2c0 4-3.2 7.2-7.2 7.2zM11 17h2v-6h-2v6zm0-8h2V7h-2v2z"></path>\n' +
                '            </svg>\n' +
                '<div class="wc-block-components-notice-banner__content">' + message + '</div><button type="button" onclick="jQuery(this).parent().remove()" class="components-button wc-block-components-button wp-element-button wc-block-components-notice-banner__dismiss contained has-text has-icon" aria-label="Dismiss this notice">\n' +
                '        <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1-1-6.1 6.2-6.1-6.2-1 1 6.1 6.3-6.5 6.7 1 1 6.5-6.6 6.5 6.6 1-1z"></path></svg>\n' +
                '        <span class="wc-block-components-button__text"></span></button></div>');
            checkoutContainer.prepend(errorNotice);
            setTimeout(function () {
                wlr_jquery('.wlr-custom-notice').remove();
            }, 2000);
        }
    }
    wlr.removeMessage = function () {
        wlr_jquery(this).remove();
    };
    wlr.copyLink = function (link_id) {
        /* Get the text field */
        var copyText = document.getElementById(link_id);
        /* Select the text field */
        copyText.select();
        copyText.focus();
        copyText.select();
        document.execCommand('copy');
    };
    let click_social_status = [];
    wlr.socialShare = function (url, action) {
        wlr_localize_data.social_share_window_open ? window.open(url, action, 'width=626, height=436') : window.open(url, '_blank');
        if (!click_social_status.includes(action)) {
            var data = {
                action: 'wlr_social_' + action,
                wlr_nonce: wlr_localize_data.apply_share_nonce
            };
            wlr.award_social_point(data);
            click_social_status.push(action);

        }
    };

    wlr.followUpShare = function (id, url, action) {
        wlr_localize_data.followup_share_window_open ? window.open(url, action, 'width=626, height=436') : window.open(url, '_blank');
        if (!click_social_status.includes(action)) {
            var data = {
                action: 'wlr_follow_' + action,
                wlr_nonce: wlr_localize_data.apply_share_nonce,
                id: id
            };
            wlr.award_social_point(data);
            click_social_status.push(action);

        }
    };
    wlr.award_social_point = function (data) {
        wlr_jquery.ajax({
            data: data,
            type: 'post',
            url: wlr_localize_data.ajax_url,
            error: function (request, error) {
                /*alertify.error(error);*/
            },
            success: function (json) {
                window.location.reload();
            }
        });
    };

    wlr_jquery(document).on('revertEnable', function (e, id) {
        wlr_jquery(".wlr-myaccount-page .wlr-revert-tool i").toggleClass("wlrf-arrow-down wlrf-arrow_right");
        wlr_jquery(id).toggleClass("wlr-revert-active  ");
    });
    wlr_jquery(document).on('wlr_copy_link', function (e, link_id) {
        var copyText = document.getElementById(link_id);
        /* Select the text field */
        copyText.disabled = false;
        var url = copyText.value;
        wlr_jquery(document).trigger('wlr_copy_link_custom_url', [copyText]);
        copyText.select();
        copyText.focus();
        copyText.select();
        document.execCommand('copy');
        copyText.value = url;
        copyText.disabled = true;
    });

    wlr_jquery(document).on('readMoreLessContent', function (e, id) {
        wlr_jquery('.wlr-myaccount-page ' + id).toggleClass("show-less-content show-more-content");
    })
    wlr_jquery(document).on('wlr_my_reward_section', function (e, type, is_new_template = false, page_type = '') {
        wlr_jquery('.wlr-myaccount-page .wlr-my-rewards-title').removeClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-user-reward-contents .active').removeClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-' + type + '-title').addClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-' + type + '-container').addClass('active');
        if (is_new_template) {
            const url = window.location.href;
            const indexOfSegment = url.indexOf("loyalty_reward");
            if (indexOfSegment !== -1) {
                const newUrl = url.substring(0, indexOfSegment + "loyalty_reward".length);
                history.pushState({}, document.title, newUrl);
            }
        }
        window.location.href = "#wlr-your-reward";
    });
    wlr_jquery(document).on('click', '.wlr-coupons-expired-title', function () {
        wlr_jquery('.wlr-myaccount-page .wlr-toggle-arrow').toggleClass('wlrf-arrow-down wlrf-arrow-up');
        wlr_jquery('.wlr-myaccount-page .wlr-user-expired-reward-section').toggleClass('active ');
    });
    /*  wlr_jquery(document).on('wlr_disable_birthday_date_edit', function (e) {
          e.preventDefault();
      });*/
    wlr_jquery(document).on('wlr_get_used_reward', function (e) {
        let used_reward = wlr_jquery(".wlr-myaccount-page #wlr-points #wlr_currency_list").data("user-used-reward");
        let used_reward_count = wlr_jquery(".wlr-myaccount-page #wlr-points #wlr_currency_list").data("user-used-reward-count");
        let currency = wlr_jquery(".wlr-myaccount-page #wlr-points #wlr_currency_list").val();
        wlr_jquery(".wlr-myaccount-page #wlr-used-reward-value-count").html(used_reward_count[currency]);
        wlr_jquery(".wlr-myaccount-page #wlr-used-reward-value").html(used_reward[currency]);
    });
    wlr_jquery(document).on('wlr_copy_coupon', function (e, coupon_id, icon_id) {
        var temp = wlr_jquery("<input>");
        wlr_jquery("body").append(temp);
        temp.val(wlr_jquery(coupon_id).text()).select();
        document.execCommand("copy");
        alertify.set('notifier', 'position', 'top-right');
        // alertify.success("copied");
        wlr_jquery('.wlr-myaccount-page .wlr-coupon-card .wlrf-save').toggleClass("wlrf-copy wlrf-save");
        wlr_jquery(icon_id).toggleClass("wlrf-copy wlrf-save");
        temp.remove();
    });
    wlr_jquery(document).on('wlr_enable_email_sent', function (e, id) {
        let enable_sent_mail = wlr_jquery("#" + id).is(':checked') ? 1 : 0;
        wlr_jquery.ajax({
            url: wlr_localize_data.ajax_url,
            type: "POST",
            dataType: 'json',
            data: {
                action: "wlr_enable_email_sent",
                wlr_nonce: wlr_localize_data.enable_sent_email_nonce,
                is_allow_send_email: enable_sent_mail,
            },
            success: function (json) {
                window.location.reload();
            }
        });
    });

    let click_status = [];
    wlr_jquery(document).on('wlr_apply_reward_action', function (e, id, type, button_id = "", is_redirect_to_url = false, url = "") {
        if (!click_status.includes(id)) {
            if (button_id !== "") {
                wlr.disableButton(button_id);
            }
            var data = {
                action: "wlr_apply_reward",
                wlr_nonce: wlr_localize_data.wlr_reward_nonce,
                reward_id: id,
                type: type,
                is_block: wlr_localize_data.is_checkout_block
            };
            wlr_jquery.ajax({
                type: "POST",
                url: wlr_localize_data.ajax_url,
                data: data,
                dataType: "json",
                before: function () {

                },
                success: function (json) {
                    if (wlr_localize_data.is_checkout_block) {
                        if (json?.data?.message_type === 'error' && json?.data?.message) {
                            localStorage.setItem('wlr_error_message', json?.data?.message);
                        } else if (json?.data?.message) {
                            localStorage.setItem('wlr_success_message', json?.data?.message);
                        }
                    }
                    //(is_redirect_to_url && url !== '' && window.location.href !== url && json.data.is_coupon_exist) ? window.location.href = url : window.location.reload();
                    wlr_jquery(document).trigger('wlr_apply_reward_action_trigger', [json.data, wlr_localize_data]);
                    if (json.data.redirect_status) {
                        window.location.href = json.data.redirect;
                        return;
                    }
                    (is_redirect_to_url && url !== '' && window.location.href !== url) ? window.location.href = url : window.location.reload();
                }
            });
            click_status.push(id);
        }
    });

    wlr_jquery(document).on('wlr_redirect_url', function (e, url) {
        window.location.href = url;
    });
    wlr_jquery(document).on('wlr_my_rewards_pagination', function (e, type, page_number, page_type) {
        let endpoint_url = wlr_jquery('.wlr-myaccount-page .wlr-coupons-list #wlr-endpoint-url').data('url');
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: {
                type: type,
                page_number: page_number,
                page_type: page_type,
                action: 'wlr_my_rewards_pagination',
                wlr_nonce: wlr_localize_data.pagination_nonce,
                endpoint_url: endpoint_url,
            },
            dataType: "json",
            before: function () {

            },
            success: function (res) {
                if (res.status) {
                    var contentToReplace = wlr_jquery('.wlr-' + type + '-container');
                    contentToReplace.css('opacity', 0);
                    setTimeout(function () {
                        contentToReplace.html(res.data.html);
                        contentToReplace.css('opacity', 1);
                    }, 350);
                }
            }
        });
    });
    wlr_jquery(document).on('wlr_apply_point_conversion_reward', function (e, id, type, point, input_id = "", button_id = "", is_redirect_to_url = false, url = "") {
        if (button_id !== "") {
            wlr.disableButton(button_id);
        }
        let value = wlr_jquery(input_id).val();
        let data = {
            action: "wlr_apply_reward",
            wlr_nonce: wlr_localize_data.wlr_reward_nonce,
            reward_id: id,
            type: type,
            points: value,
            is_block: wlr_localize_data.is_checkout_block
        };
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: data,
            dataType: "json",
            before: function () {

            },
            success: function (json) {
                wlr_jquery(document).trigger('wlr_apply_reward_action_trigger', [json.data, wlr_localize_data]);
                if (wlr_localize_data.is_checkout_block) {
                    if (json?.data?.message_type === 'error' && json?.data?.message) {
                        localStorage.setItem('wlr_error_message', json?.data?.message);
                    } else if (json?.data?.message) {
                        localStorage.setItem('wlr_success_message', json?.data?.message);
                    }
                }
                wlr_jquery(document).trigger('wlr_apply_reward_action_trigger', [json.data, wlr_localize_data]);
                if (json.data.redirect_status) {
                    window.location.href = json.data.redirect;
                    return;
                }
                (is_redirect_to_url && url !== '' && window.location.href !== url) ? window.location.href = url : window.location.reload();
            }
        });
    });
    // old support
    wlr_jquery(document).on('wlr_apply_point_conversion_reward_action', function (e, id, type, point, button_id = "") {
        if (button_id !== "") {
            wlr.disableButton(button_id);
        }
        alertify.prompt(wlr_localize_data.point_popup_message, point, function (evt, value) {
            var data = {
                action: "wlr_apply_reward",
                wlr_nonce: wlr_localize_data.wlr_reward_nonce,
                reward_id: id,
                type: type,
                points: value,
            };
            wlr_jquery.ajax({
                type: "POST",
                url: wlr_localize_data.ajax_url,
                data: data,
                dataType: "json",
                before: function () {

                },
                success: function (json) {
                    window.location.reload();
                    /*if (json['data']['redirect']) {
                        window.location = json['data']['redirect'];
                    }*/
                }
            });
        }).setHeader("").set('labels', {
            ok: wlr_localize_data.popup_ok,
            cancel: wlr_localize_data.popup_cancel
        }).set('oncancel', function () {
            window.location.reload();
        });
    });
    wlr.disableButton = function (button_id, is_revoke_coupon = false) {
        let buttons = wlr_jquery('.wlr-myaccount-page').find('.wlr-button');
        (!is_revoke_coupon) ? wlr_jquery(button_id).toggleClass("wlr-button-action wlr-button-spinner") : wlr_jquery(button_id).addClass("wlr-button-spinner");
        wlr_jquery.each(buttons, function (index, val) {
            if (wlr_jquery(val).hasClass('wlr-button-action')) {
                wlr_jquery(val).css("background", "#cccccc");
            }
            val.setAttribute('disabled', true);
            val.removeAttribute('onclick');
        });
        if (wlr_jquery(button_id).hasClass('wlr-button-spinner')) {
            wlr_jquery(button_id).html('<div class="wlr-spinner">\n' +
                '    <span class="spinner" style="border-top: 4px ' + wlr_localize_data.theme_color + ' solid;"></span>\n' +
                '</div>');
        }
    }

    wlr_jquery(document).on('wlr_calculate_point_conversion', function (e, id, response_id) {
        let data = wlr_jquery('.wlr-myaccount-page #' + id);
        let require_point = data.attr('data-require-point');
        require_point = isNaN(parseInt(require_point)) ? 0 : parseInt(require_point);
        let discount_value = data.attr('data-discount-value');
        discount_value = isNaN(parseFloat(discount_value)) ? 0 : parseFloat(discount_value);
        let available_point = data.attr('data-available-point');
        available_point = isNaN(parseInt(available_point)) ? 0 : parseInt(available_point);
        let input_point = isNaN(parseInt(data.val())) ? 0 : parseInt(data.val());
        let max_point = data.attr('data-max-allowed-point');
        let min_point = data.attr('data-min-allowed-point');
        max_point = isNaN(parseInt(max_point)) ? 0 : parseInt(max_point);
        let button_id = data.attr('data-button-id');
        wlr_jquery('#' + button_id).attr('disabled', false);
        wlr_jquery('.wlr-error').remove();
        let max_changed = data.attr('data-is-max-changed');
        if (min_point > 0 && input_point < min_point) {
            let error = data.attr('data-min-message');
            wlr_jquery('#' + button_id).attr('disabled', true);
            let section_id = data.attr('data-section-id');
            wlr_jquery('#' + section_id).after('<span class="wlr-error">' + error + '</span>');
            wlr_jquery('.wlr-myaccount-page .wlr-input-point-section #' + id).css({
                "outline": "1px solid red",
                "border-radius": "6px 0 0 6px"
            });
            wlr_jquery('.wlr-myaccount-page .wlr-point-conversion-section #' + id + '_button').hide();
        } else if (max_point > 0 && input_point > max_point) {
            let error = data.attr('data-max-message');
            wlr_jquery('#' + button_id).attr('disabled', true);
            let section_id = data.attr('data-section-id');
            wlr_jquery('#' + section_id).after('<span class="wlr-error">' + error + '</span>');
            wlr_jquery('.wlr-myaccount-page .wlr-input-point-section #' + id).css({
                "outline": "1px solid red",
                "border-radius": "6px 0 0 6px"
            });
            wlr_jquery('.wlr-myaccount-page .wlr-point-conversion-section #' + id + '_button').hide();
        } else if (max_changed && max_point === 0) {
            wlr_jquery('.wlr-myaccount-page .wlr-input-point-section #' + id).css({
                "outline": "1px solid red",
                "border-radius": "6px 0 0 6px"
            });
            wlr_jquery('.wlr-myaccount-page .wlr-point-conversion-section #' + id + '_button').hide();
        } else {
            if (input_point > available_point || input_point === 0) {
                wlr_jquery('.wlr-myaccount-page .wlr-input-point-section #' + id).css({
                    "outline": "1px solid red",
                    "border-radius": "6px 0 0 6px"
                });
                wlr_jquery('.wlr-myaccount-page .wlr-point-conversion-section #' + id + '_button').hide();
            } else {
                wlr_jquery('.wlr-myaccount-page .wlr-input-point-section #' + id).css({"outline": "unset"});
                wlr_jquery('.wlr-myaccount-page .wlr-point-conversion-section #' + id + '_button').show();
            }
        }

        let input_value = (input_point / require_point) * discount_value;
        let input_data = {input_value: input_value.toFixed(2), input_point, require_point, discount_value};
        wlr_jquery(this).trigger('wlr_calculate_point_conversion_input_value', [input_data]);
        wlr_jquery('.wlr-myaccount-page #' + response_id).text(input_data.input_value);
    });

    wlr_jquery(document).on('wlr_apply_social_share', function (e, url, action) {
        wlr.socialShare(url, action);
    });
    wlr_jquery(document).on('wlr_apply_followup_share', function (e, id, url, action) {
        wlr.followUpShare(id, url, action);
    });
    wlr_jquery(document).on("click", "#wlr-reward-link", function (e) {
        let is_block = wlr_jquery(this).data('isblock');
        let data = {
            action: "wlr_show_loyalty_rewards",
            wlr_nonce: wlr_localize_data.wlr_redeem_nonce,
            is_block: is_block
        };
        wlr_jquery(this).css('pointer-events', 'none');
        wlr_jquery(this).after('<div class="wlr-dot-pulse"></div>');
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: data,
            dataType: "json",
            before: function () {

            },
            success: function (json) {
                alertify.defaults.defaultFocusOff = true;
                wlr_jquery('.wlr-dot-pulse').remove();
                wlr_jquery('#wlr-reward-link').css('pointer-events', '');
                alertify.alert(json.data.html).setHeader('').set('label', wlr_localize_data.popup_ok);
            }
        });
    });
    wlr_jquery(document).on("click", "#wlr_point_apply_discount_button", function (e) {
        var is_partial = wlr_jquery("#wlr_is_partial").val();
        if (is_partial === 1) {
            e.preventDefault();
            return false;
        }
        var is_checkout = wlr_jquery("#wlr_is_checkout").val();
        var data = {
            action: "wlr_apply_loyal_discount",
            discount_amount: wlr_jquery("#wlr_discount_point").val(),
            wlr_nonce: wlr_localize_data.wlr_discount_none,
        };
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: data,
            dataType: "json",
            success: function (json) {
                if (is_checkout == 1) {
                    if (json.success) {
                        wlr_jquery(document.body).trigger("update_checkout", {update_shipping_method: true});
                    }
                } else {
                    wlr_jquery('.woocommerce-error, .woocommerce-message, .woocommerce-info').remove();
                    if (json.data.message) {
                        wlr.show_notice(json.data.message);
                    }
                    wlr_jquery(document.body).trigger('wc_update_cart', true);
                }
            }
        });
        return false;
    });
    wlr_jquery(document).ready(function () {
        wlr_jquery(document).on("click", ".wlr_change_product", function () {
            var product_id = wlr_jquery(this).attr('data-pid');
            var rule_unique_id = wlr_jquery(this).attr('data-rule_id');
            var parent_id = wlr_jquery(this).attr('data-parent_id');

            var data = {
                action: 'wlr_change_reward_product_in_cart',
                variant_id: product_id,
                rule_unique_id: rule_unique_id,
                product_id: parent_id,
                wlr_nonce: wlr_localize_data.wlr_reward_nonce,
            };
            wlr_jquery.ajax({
                url: wlr_localize_data.ajax_url,
                data: data,
                type: 'POST',
                success: function (response) {
                    if (response.success == true) {
                        wlr_jquery("[name='update_cart']").removeAttr('disabled');
                        wlr_jquery("[name='update_cart']").trigger("click");
                    }
                },
                error: function (response) {
                }
            });
        });

        wlr_jquery(document).on("click", '.wlr-select-free-variant-product-toggle', function (e) {
            e.preventDefault();
            this.classList.toggle("wlr-select-free-variant-product-toggle-active");
            var panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                wlr_jquery(panel).slideUp(1000);
            } else {
                wlr_jquery(panel).slideDown(1000);
            }
        });
    });

    wlr_jquery(document).on('wlr_update_birthday_action', function (e, id, date_id, type) {
        var data = {
            action: "wlr_update_birthday",
            wlr_nonce: wlr_localize_data.wlr_reward_nonce,
            campaign_id: id,
            birth_date: wlr_jquery(date_id).val()
        };
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: data,
            dataType: "json",
            before: function () {

            },
            success: function (json) {
                window.location.reload();
            }
        });
    });
    wlr.checkDateEmpty = function (data, type) {
        if ((typeof data !== "object" && Object.keys(data).length === 0) || (typeof type !== "string")) return false;
        return (wlr.validateDate(data, type));
    }
    wlr.validateDate = function (dom_data, type) {
        if ((typeof dom_data !== "object" && Object.keys(dom_data).length === 0) || (typeof type !== "string")) return false;
        let value = parseInt(dom_data.value);
        let status;
        switch (type) {
            case 'Y':
                let current_year = new Date().getFullYear();
                status = (isNaN(value) || (value < 1823) || (value > current_year) || (dom_data.value.length !== 4)) ? wlr.validationError(dom_data, true) :
                    wlr.validationError(dom_data, false);
                break;
            case 'm':
                status = (isNaN(value) || (value < 1) || (value > 12)) ? wlr.validationError(dom_data, true) :
                    wlr.validationError(dom_data, false);
                break;
            case 'd':
                status = (isNaN(value) || (value < 1) || (value > 31)) ? wlr.validationError(dom_data, true) :
                    wlr.validationError(dom_data, false);
                break;
        }
        return status;
    }
    wlr.validationError = function (dom_data, is_error = true) {
        if ((typeof dom_data !== "object" && Object.keys(dom_data).length === 0) || (typeof is_error !== "boolean")) return false;
        let status = false;
        if (is_error) {
            dom_data.style.border = "3px solid red";
        } else {
            status = true;
            dom_data.style.border = "";
        }
        return status;
    }

    wlr_jquery(document).on('wlr_update_birthday_date_action', function (e, id, campaign_id, type) {
        const day = document.getElementById("wlr-customer-birth-date-day-" + campaign_id);
        const month = document.getElementById("wlr-customer-birth-date-month-" + campaign_id);
        const year = document.getElementById("wlr-customer-birth-date-year-" + campaign_id);
        if (!wlr.checkDateEmpty(day, 'd') || !wlr.checkDateEmpty(month, 'm') || !wlr.checkDateEmpty(year, 'Y')) {
            return;
        }
        let date = (year.value + "-" + month.value + "-" + day.value);
        let data = {
            action: "wlr_update_birthday",
            wlr_nonce: wlr_localize_data.wlr_reward_nonce,
            campaign_id: id,
            birth_date: date,
        };
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: data,
            dataType: "json",
            before: function () {

            },
            success: function (json) {
                window.location.reload();
            }
        });
    });
    wlr_jquery(document).on('wlr_revoke_coupon', function (e, id, code) {
        wlr.disableButton("#wlr-" + id + "-" + code, true);
        wlr_jquery("#wlr-" + id + "-" + code).removeAttr("onclick");
        alertify.confirm().set({'closable': false});
        alertify.confirm('<span>' + wlr_localize_data.revoke_coupon_message + '</span>', function (evt, value) {
            var data = {
                action: "wlr_revoke_coupon",
                wlr_nonce: wlr_localize_data.revoke_coupon_nonce,
                user_reward_id: id,
                is_block: wlr_localize_data.is_checkout_block
            };
            wlr_jquery.ajax({
                type: "POST",
                url: wlr_localize_data.ajax_url,
                data: data,
                dataType: "json",
                before: function () {

                },
                success: function (json) {
                    if (wlr_localize_data.is_checkout_block) {
                        if (!json?.data?.success && json?.data?.message) {
                            localStorage.setItem('wlr_error_message', json?.data?.message);
                        } else if (json?.data?.message) {
                            localStorage.setItem('wlr_success_message', json?.data?.message);
                        }
                    }
                    window.location.reload();
                }
            });
        }, function (evt, value) {
            wlr_jquery(document).trigger('revertEnable', ['#wlr-' + id + '-' + code]);
            window.location.reload();
        }).setHeader("").set('labels', {
            ok: wlr_localize_data.popup_ok,
            cancel: wlr_localize_data.popup_cancel
        });
    });
    (function waitForReferralCode() {
        if (wlr_localize_data.is_pro && wlr_localize_data.is_allow_update_referral === '1') {
            let wlr_ref = localStorage.getItem('wployalty_referral_code');
            if (wlr_ref) {
                let data = {
                    action: "wlr_update_referral_code",
                    wlr_nonce: wlr_localize_data.wlr_reward_nonce,
                    referral_code: localStorage.getItem('wployalty_referral_code')
                };
                wlr_jquery.ajax({
                    type: "POST",
                    url: wlr_localize_data.ajax_url,
                    data: data,
                    dataType: "json",
                    before: function () {

                    },
                    success: function (json) {

                    },
                });
            } else {
                setTimeout(waitForReferralCode, 500); // Polling every 500 ms to set the referral code
            }
        }
    })();
    wlr_jquery(document).on('ready', function () {
        let wlr_error_message = localStorage.getItem('wlr_error_message');
        if (wlr_error_message) {
            wlr.displayStoreNotice(wlr_error_message, 'error');
            localStorage.setItem('wlr_error_message', '');
        }
        let wlr_success_message = localStorage.getItem('wlr_success_message');
        if (wlr_success_message) {
            wlr.displayStoreNotice(wlr_success_message);
            localStorage.setItem('wlr_success_message', '');
        }
    });

    /*New Design Pagination*/
    wlr_jquery(document).on('wlr_my_reward_section_tab', function (e, type, url = '') {
        wlr_jquery('.wlr-myaccount-page .wlr-my-rewards-title').removeClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-user-reward-contents .active').removeClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-' + type + '-title').addClass('active');
        wlr_jquery('.wlr-myaccount-page .wlr-' + type + '-container').addClass('active');
        //window.location.href = url + "#wlr-your-reward";
    });
    wlr_jquery(document).on('wlr_new_revoke_coupon', function (e, id, code, url) {
        wlr.disableButton("#wlr-" + id + "-" + code, true);
        let current_page_url = window.location.href;
        current_page_url.indexOf("active_reward_page");
        let use_url = true;
        if (current_page_url.indexOf("active_reward_page") !== -1) {
            use_url = false;
        }
        wlr_jquery("#wlr-" + id + "-" + code).removeAttr("onclick");
        alertify.confirm().set({'closable': false});
        alertify.confirm('<span>' + wlr_localize_data.revoke_coupon_message + '</span>', function (evt, value) {
            var data = {
                action: "wlr_revoke_coupon",
                wlr_nonce: wlr_localize_data.revoke_coupon_nonce,
                user_reward_id: id,
                is_block: wlr_localize_data.is_checkout_block
            };

            wlr_jquery.ajax({
                type: "POST",
                url: wlr_localize_data.ajax_url,
                data: data,
                dataType: "json",
                before: function () {

                },
                success: function (json) {
                    if (wlr_localize_data.is_checkout_block) {
                        if (!json?.data?.success && json?.data?.message) {
                            localStorage.setItem('wlr_error_message', json?.data?.message);
                        } else if (json?.data?.message) {
                            localStorage.setItem('wlr_success_message', json?.data?.message);
                        }
                    }
                    if (use_url) {
                        window.location.href = url;
                    } else {
                        window.location.reload();
                    }

                }
            });
        }, function (evt, value) {
            wlr_jquery(document).trigger('revertEnable', ['#wlr-' + id + '-' + code]);
            if (use_url) {
                window.location.href = url;
            } else {
                window.location.reload();
            }
        }).setHeader("").set('labels', {
            ok: wlr_localize_data.popup_ok,
            cancel: wlr_localize_data.popup_cancel
        });
    });
    wlr_jquery(document).on('wlr_my_reward_section_pagination', function (e, type, page_number, page_type) {
        wlr_jquery.ajax({
            type: "POST",
            url: wlr_localize_data.ajax_url,
            data: {
                type: type,
                page_number: page_number,
                page_type: page_type,
                action: 'wlr_my_reward_section_pagination',
                wlr_nonce: wlr_localize_data.pagination_nonce,
            },
            dataType: "json",
            before: function () {

            },
            success: function (res) {
                if (res.success) {
                    let contentToReplace = wlr_jquery('.wlr-' + type + '-container');
                    contentToReplace.css('opacity', 0);
                    setTimeout(function () {
                        contentToReplace.html(res.data.html);
                        contentToReplace.css('opacity', 1);
                    }, 350);
                }
            }
        });
    });

})(wlr_jquery);

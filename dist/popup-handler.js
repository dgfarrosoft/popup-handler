function PopupHandler () {
    if ( this instanceof PopupHandler ) {
        this.triggerAttribute = 'data-popup';
        this.allElementsAtOnce = false;
        this.hashAttribute = 'data-hash';
        this.deferredTriggerAttribute = 'data-deferred-popup';
        this.contentAttribute = 'data-content';
        this.additionalDataAttributes = [];
        this.getFromPage = [];
        this.popupClass = 'b-popup';
        this.popupWrapperClass = this.popupClass + '__wrapper';
        this.popupCloseButtonClass = this.popupClass + '__close-btn';
        this.popupCloseSelectors = ['[data-popup-close]', '.' + this.popupCloseButtonClass];
        this.disabledFormClass = 'js-disabled';
        this.popupHandlers = {};
        this.popupVisible = false;
        this.popupContents = {};
        this.focusOnFirstInput = true;
        this.closeOnWrapperClick = true;
        this.ajaxUrl = '';
        this.ajaxRequestData = {};
        this.animatedShow = true;
        this.popupShowSpeed = 200;
        this.backgroundTransition = true;
        this.backgroundTransitionSpeed = 500;
        this.darkBackground = true;
        this.ajaxAction = '';
        this.ajaxDataObjectName = 'popupRequestData';
        this.customWrapperBackground = '';
        this.closeButtonSize = '40px';
        this.closeButtonColor = "#000";
        this.firstLoad = true;
        this.popupStyles = 'max-width: 400px;margin: 0 auto;background: white;padding: 30px;border-radius: 3px;'
        this.popupWrapperStyles = 'background:transparent;position:fixed;z-index:100;display:none;height: 100%;width: 100%;left:0;top:0;';
        this.popupCloseImage = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 371.23 371.23" style="enable-background:new 0 0 371.23 371.23;" xml:space="preserve"><polygon points="371.23,21.213 350.018,0 185.615,164.402 21.213,0 0,21.213 164.402,185.615 0,350.018 21.213,371.23 185.615,206.828 350.018,371.23 371.23,350.018 206.828,185.615 "/><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>';
        this.popupCloseBtnStyles =
            'width: ' + this.closeButtonSize + ';' +
            'height: ' + this.closeButtonSize + ';' +
            'position: absolute;' +
            'right: 2%;' +
            'top: 2%;' +
            'cursor: pointer;';

        this.init = function ( settings ) {
            if ( settings !== undefined ) {
                for ( var setting in settings ) {
                    this[setting] = settings[setting];
                }
            }
            this.getPopupsContent(this.allElementsAtOnce);
            this.injectPopup();
            this.popupCloseBtn = jQuery('.' + this.popupCloseButtonClass);
            this.setPopupStyles();
            this.initEventListeners(this.allElementsAtOnce);
        };

        this.getPopupsContent = function () {
            var _this = this;
            this.setPopupAttributes();
            var ajaxRequestData = this.getAjaxRequestData();
            if ( this.allElementsAtOnce ) {

                var isRequestsSame = this.isEqual(ajaxRequestData, this.ajaxRequestData);
                this.ajaxRequestData = ajaxRequestData;
                if ( Object.keys(ajaxRequestData[this.ajaxDataObjectName]).length !== 0 && this.ajaxUrl !== '' && !isRequestsSame ) {
                    jQuery.ajax({
                        url: _this.ajaxUrl,
                        type: "POST",
                        data: ajaxRequestData,
                        success: function ( response ) {
                            if ( response !== "no content" ) {
                                response = jQuery.parseJSON(response);
                                for ( var popupType in response ) {
                                    _this.popupContents[popupType] = {
                                        popupID: response[popupType].formID,
                                        content: response[popupType].content
                                    };
                                    _this.popupContents[popupType].popupID = _this.popupContents[popupType].popupID === undefined ? popupType : _this.popupContents[popupType].popupID;
                                }
                                if ( _this.firstLoad ) {
                                    jQuery(document).trigger('popups-content-loaded');
                                    _this.firstLoad = false;
                                }
                            } else {
                                console.log(response);
                            }
                        },
                        error: function ( response ) {
                            console.log(response);
                        }
                    });
                }
            } else {
                var popupID;
                var content;
                var popupCode;
                var triggerElement;
                var popupsQuantity = ajaxRequestData[this.ajaxDataObjectName].length;
                var loadedContents = 0;
                jQuery.each(ajaxRequestData[this.ajaxDataObjectName], function ( index, popupRequestData ) {
                    var data = _this.ajaxAction != '' ? {'action': _this.ajaxAction} : {};
                    triggerElement = popupRequestData.element;
                    data[_this.ajaxDataObjectName] = {};

                    data[_this.ajaxDataObjectName].popupID = popupRequestData.popupID;
                    data[_this.ajaxDataObjectName].request = popupRequestData.request;
                    popupCode = btoa(JSON.stringify(data));
                    if ( _this.popupContents[popupCode] === undefined ) {
                        jQuery.ajax({
                            url: _this.ajaxUrl,
                            type: "POST",
                            data: data,
                            success: function ( response ) {
                                if ( response !== "no content" ) {
                                    response = JSON.parse(response);
                                    popupID = response.formID !== undefined ? response.formID : data[_this.ajaxDataObjectName].popupID;
                                    content = response.content !== undefined ? response.content : '';
                                    popupCode = btoa(JSON.stringify(data));
                                    _this.popupContents[popupCode] = {
                                        popupID: popupID,
                                        content: content,
                                        element: triggerElement
                                    };
                                    loadedContents++;
                                    if ( loadedContents === popupsQuantity && _this.firstLoad ) {
                                        jQuery(document).trigger('popups-content-loaded');
                                        _this.firstLoad = false;
                                    }
                                } else {
                                    console.log(response);
                                }
                            },
                            error: function ( response ) {
                                console.log(response);
                            }
                        });
                    }
                    triggerElement.attr('data-hash', popupCode);
                });
            }
        };

        this.fillPopup = function ( popupType ) {
            var _this = this;
            var formID = this.popupContents[popupType].popupID;
            this.popup.html(this.popupContents[popupType].content);
            this.getPopupsContent();
            if ( this.handleAllForms === undefined ) {
                if ( this.popupHandlers[formID] !== undefined && typeof this.popupHandlers[formID] === "function" && jQuery('form#' + this.popupContents[popupType].popupID).length !== 0 ) {
                    jQuery('form#' + this.popupContents[popupType].popupID).submit(function ( event ) {
                        event.preventDefault();
                        var currentForm = jQuery(this);

                        if ( !currentForm.hasClass(_this.disabledFormClass) ) {
                            _this.formSubmission(_this, formID, currentForm);
                        }
                    });
                }
            }
        };

        this.formSubmission = function ( popupHandler, handlerType, form ) {
            this.popupHandlers[handlerType](form, popupHandler);
        };

        this.showPopup = function ( popupType, defer ) {
            defer = defer === undefined ? false : defer;
            var attr;
            if ( typeof popupType !== 'string' ) {
                if ( this.allElementsAtOnce ) {
                    attr = defer ? this.deferredTriggerAttribute : this.triggerAttribute;
                    popupType = popupType.attr(attr);
                } else {
                    popupType = popupType.attr(this.hashAttribute);
                }
            }
            this.hidePopup();
            if ( this.popupContents[popupType] !== undefined ) {
                if ( this.popupContents[popupType].popupID !== "" ) {
                    this.fillPopup(popupType);
                    this.setPopupStyles();

                    this.popupVisible = true;

                    jQuery(document).trigger('popup-show', [this.popup]);
                    jQuery('body').css('overflow', 'hidden');
                    this.popupWrapper.show();
                    this.centerVertically();
                    if ( this.customWrapperBackground !== '' ) {
                        this.popupWrapper.css('background', this.customWrapperBackground);
                    }
                    else if ( this.darkBackground ) {
                        this.popupWrapper.css('background', "rgba(1, 1, 1, .7)");
                    } else {
                        this.popupWrapper.css('background', "rgba(207, 207, 207, .6)");
                    }
                    if ( this.focusOnFirstInput ) {
                        this.popup.find('input').eq(0).focus();
                    }
                }
            } else {
                console.log('showPopup');
                console.log(popupType);
                console.log(this.popupContents);
            }
        };

        this.hidePopup = function ( message, timeout, redirectUrl ) {
            var _this = this;

            if ( message !== undefined && message !== '' ) {
                _this.popup.html(message);
            }

            if ( timeout === undefined ) {
                _this.closePopup(redirectUrl);

            } else {
                setTimeout(function () {
                    _this.closePopup(redirectUrl);
                }, timeout)
            }

            this.popupVisible = false;
        };

        this.closePopup = function ( redirectUrl ) {
            if ( redirectUrl !== undefined ) {
                document.location.href = redirectUrl;
            }
            this.popupWrapper.css('-webkit-transition', 'none');
            this.popupWrapper.css('transition', 'none');

            this.popupWrapper.css('padding-top', 0);
            this.popupWrapper.hide();
            this.popup.html('');

            jQuery('body').css('overflow', 'visible');
            if ( !this.popupVisible ) {
                this.popupWrapper.css('background', "transparent");
            }
        };

        this.getSingleAjaxRequestData = function ( element, requestData ) {
            if ( requestData === undefined ) {
                requestData = {};
            }
            var attributeValue, quantity = 0;
            if ( this.additionalDataAttributes.length !== 0 ) {
                for ( var i = 0; i < this.additionalDataAttributes.length; i++ ) {
                    attributeValue = element.attr(this.additionalDataAttributes[i]);
                    if ( attributeValue !== undefined ) {
                        requestData = requestData === 0 ? {} : requestData;
                        requestData[this.additionalDataAttributes[i]] = attributeValue;
                        quantity++;
                    }

                    if ( i === this.additionalDataAttributes.length - 1 && quantity === 0 ) {
                        requestData = 0;
                    }
                }
            } else {
                requestData = 0;
            }
            return requestData;
        };

        this.getAjaxRequestData = function () {
            var ajaxRequestData = {};
            ajaxRequestData[this.ajaxDataObjectName] = this.allElementsAtOnce ? {} : [];
            if ( this.ajaxAction !== '' ) {
                ajaxRequestData.action = this.ajaxAction;
            }
            var popupTriggers = jQuery('[' + this.triggerAttribute + ']');
            var deferredPopupTriggers = jQuery('[' + this.deferredTriggerAttribute + ']');

            ajaxRequestData = this.fillRequestData(popupTriggers, ajaxRequestData);
            ajaxRequestData = this.fillRequestData(deferredPopupTriggers, ajaxRequestData, true);

            return ajaxRequestData;
        };

        this.fillRequestData = function ( popupTriggers, ajaxRequestData, defer ) {
            if ( defer === undefined ) {
                defer = false;
            }
            var attr = !defer ? this.triggerAttribute : this.deferredTriggerAttribute;
            var popupType, element;
            for ( var i = 0; i < popupTriggers.length; i++ ) {
                element = jQuery(popupTriggers[i]);
                popupType = element.attr(attr);

                if ( popupType !== undefined && this.getFromPage.indexOf(popupType) === -1 ) {
                    if ( this.allElementsAtOnce ) {
                        ajaxRequestData[this.ajaxDataObjectName][popupType] = this.getSingleAjaxRequestData(element, ajaxRequestData[this.ajaxDataObjectName][popupType]);
                    } else {
                        ajaxRequestData[this.ajaxDataObjectName].push({
                            "popupID": popupType,
                            "element": element,
                            "request": this.getSingleAjaxRequestData(element, ajaxRequestData[this.ajaxDataObjectName][popupType])
                        });
                    }
                } else if ( this.getFromPage.indexOf(popupType) !== -1 ) {
                    this.popupContents[popupType] = {
                        popupID: popupType,
                        content: jQuery('[' + this.contentAttribute + '=' + popupType + ']').html()
                    };
                }
            }
            return ajaxRequestData;
        };

        this.updateContent = function ( contentId, newData ) {
            if ( this.popupContents[contentId] !== undefined ) {
                var tempContent = document.createElement('div');
                tempContent.innerHTML = this.popupContents[contentId].content;
                var tempContentObject = jQuery(tempContent);

                jQuery.each(newData, function ( selector, callback ) {
                    callback(tempContentObject.find(selector), tempContentObject);
                });

                this.popupContents[contentId].content = tempContent.innerHTML;
            } else {
                console.log('no content');
            }
        };

        this.injectPopup = function () {
            var popupCloseBtn = '<div class = "' + this.popupCloseButtonClass + '">' + this.popupCloseImage + '</div>';
            if ( jQuery('.' + this.popupClass).length === 0 ) {
                jQuery('body').append('<div class = "' + this.popupWrapperClass + '">' + popupCloseBtn + '<div class = "' + this.popupClass + '"></div></div>');
            }
            this.popup = jQuery('.' + this.popupClass);
            this.popupWrapper = this.popup.closest('.' + this.popupWrapperClass);
        };

        this.setPopupAttributes = function () {
            if ( this.triggerSelectors !== undefined ) {
                var selectors;
                for ( var trigger in this.triggerSelectors ) {
                    selectors = this.triggerSelectors[trigger].join(',');
                    jQuery(selectors).attr(this.triggerAttribute, trigger);
                }
            }
        };

        this.initEventListeners = function () {
            var _this = this;
            var attr;
            jQuery(document).on('click', '[' + this.triggerAttribute + ']', function ( event ) {
                event.preventDefault();

                attr = _this.allElementsAtOnce ? _this.triggerAttribute : 'data-hash';

                _this.showPopup(jQuery(this).attr(attr));

                if ( typeof _this.popupCloseSelectors === 'string' ) {
                    _this.popupCloseSelectors = [_this.popupCloseSelectors];
                }

            });

            jQuery(_this.popupCloseSelectors.join(',')).click(function ( event ) {
                event.preventDefault();
                _this.hidePopup();
            });

            if ( _this.closeOnWrapperClick ) {
                jQuery(document).click(function ( event ) {
                    if ( jQuery(event.target).hasClass(_this.popupWrapperClass) ) {
                        _this.hidePopup();
                    }
                });
            }

            if ( this.handleAllForms !== undefined && typeof this.handleAllForms === 'function' ) {
                jQuery(document).on('submit', '.' + this.popupClass + " form", function ( event ) {
                    event.preventDefault();
                    _this.handleAllForms(jQuery(this), _this);
                });
            }
        };

        this.popupTriggerCallback = function ( trigger ) {
            var _this = this;
            return function () {
                _this.showPopup(trigger);
            }
        };

        this.centerVertically = function ( popup ) {
            var parent = this.popupWrapper;
            var padding = (parent.outerHeight() - this.popup.outerHeight()) / 2;
            parent.css('padding-top', padding);
        };

        this.isEqual = function ( firstObject, secondObject ) {
            return JSON.stringify(firstObject) === JSON.stringify(secondObject);
        };

        this.setPopupStyles = function () {
            var transition = [];

            this.popupWrapper.attr('style', this.popupWrapperStyles);
            this.popup.attr('style', this.popupStyles);
            this.popupCloseBtn.attr('style', this.popupCloseBtnStyles);
            this.popupCloseBtn.css('fill', this.closeButtonColor);
            jQuery('[' + this.triggerAttribute + ']').css('cursor', 'pointer');

            if ( this.animatedShow ) {
                transition.push("padding " + this.popupShowSpeed / 1000 + "s");
            }
            if ( this.backgroundTransition ) {
                transition.push("background " + this.backgroundTransitionSpeed / 1000 + "s");
            }
            transition = transition.join(',');
            if ( transition !== "" ) {
                this.popupWrapper.css('transition', transition);
            }
        };

    } else {
        return new PopupHandler();
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJwb3B1cC1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gUG9wdXBIYW5kbGVyICgpIHtcclxuICAgIGlmICggdGhpcyBpbnN0YW5jZW9mIFBvcHVwSGFuZGxlciApIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5hbGxFbGVtZW50c0F0T25jZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaGFzaEF0dHJpYnV0ZSA9ICdkYXRhLWhhc2gnO1xyXG4gICAgICAgIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtZGVmZXJyZWQtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuY29udGVudEF0dHJpYnV0ZSA9ICdkYXRhLWNvbnRlbnQnO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgdGhpcy5nZXRGcm9tUGFnZSA9IFtdO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbGFzcyA9ICdiLXBvcHVwJztcclxuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fd3JhcHBlcic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX19jbG9zZS1idG4nO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9IFsnW2RhdGEtcG9wdXAtY2xvc2VdJywgJy4nICsgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3NdO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MgPSAnanMtZGlzYWJsZWQnO1xyXG4gICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICAgICAgdGhpcy5mb2N1c09uRmlyc3RJbnB1dCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgIHRoaXMuYW5pbWF0ZWRTaG93ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnBvcHVwU2hvd1NwZWVkID0gMjAwO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCA9IDUwMDtcclxuICAgICAgICB0aGlzLmRhcmtCYWNrZ3JvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZSA9ICdwb3B1cFJlcXVlc3REYXRhJztcclxuICAgICAgICB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kID0gJyc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvblNpemUgPSAnNDBweCc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yID0gXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5maXJzdExvYWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMucG9wdXBTdHlsZXMgPSAnbWF4LXdpZHRoOiA0MDBweDttYXJnaW46IDAgYXV0bztiYWNrZ3JvdW5kOiB3aGl0ZTtwYWRkaW5nOiAzMHB4O2JvcmRlci1yYWRpdXM6IDNweDsnXHJcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJTdHlsZXMgPSAnYmFja2dyb3VuZDp0cmFuc3BhcmVudDtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjEwMDtkaXNwbGF5Om5vbmU7aGVpZ2h0OiAxMDAlO3dpZHRoOiAxMDAlO2xlZnQ6MDt0b3A6MDsnO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZUltYWdlID0gJzxzdmcgdmVyc2lvbj1cIjEuMVwiIGlkPVwiTGF5ZXJfMVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4PVwiMHB4XCIgeT1cIjBweFwiIHZpZXdCb3g9XCIwIDAgMzcxLjIzIDM3MS4yM1wiIHN0eWxlPVwiZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCAzNzEuMjMgMzcxLjIzO1wiIHhtbDpzcGFjZT1cInByZXNlcnZlXCI+PHBvbHlnb24gcG9pbnRzPVwiMzcxLjIzLDIxLjIxMyAzNTAuMDE4LDAgMTg1LjYxNSwxNjQuNDAyIDIxLjIxMywwIDAsMjEuMjEzIDE2NC40MDIsMTg1LjYxNSAwLDM1MC4wMTggMjEuMjEzLDM3MS4yMyAxODUuNjE1LDIwNi44MjggMzUwLjAxOCwzNzEuMjMgMzcxLjIzLDM1MC4wMTggMjA2LjgyOCwxODUuNjE1IFwiLz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48L3N2Zz4nO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0blN0eWxlcyA9XHJcbiAgICAgICAgICAgICd3aWR0aDogJyArIHRoaXMuY2xvc2VCdXR0b25TaXplICsgJzsnICtcclxuICAgICAgICAgICAgJ2hlaWdodDogJyArIHRoaXMuY2xvc2VCdXR0b25TaXplICsgJzsnICtcclxuICAgICAgICAgICAgJ3Bvc2l0aW9uOiBhYnNvbHV0ZTsnICtcclxuICAgICAgICAgICAgJ3JpZ2h0OiAyJTsnICtcclxuICAgICAgICAgICAgJ3RvcDogMiU7JyArXHJcbiAgICAgICAgICAgICdjdXJzb3I6IHBvaW50ZXI7JztcclxuXHJcbiAgICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgaWYgKCBzZXR0aW5ncyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIHNldHRpbmcgaW4gc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tzZXR0aW5nXSA9IHNldHRpbmdzW3NldHRpbmddO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCh0aGlzLmFsbEVsZW1lbnRzQXRPbmNlKTtcclxuICAgICAgICAgICAgdGhpcy5pbmplY3RQb3B1cCgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4gPSBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3MpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzKHRoaXMuYWxsRWxlbWVudHNBdE9uY2UpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cEF0dHJpYnV0ZXMoKTtcclxuICAgICAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhKCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hbGxFbGVtZW50c0F0T25jZSApIHtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgaXNSZXF1ZXN0c1NhbWUgPSB0aGlzLmlzRXF1YWwoYWpheFJlcXVlc3REYXRhLCB0aGlzLmFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgIGlmICggT2JqZWN0LmtleXMoYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXSkubGVuZ3RoICE9PSAwICYmIHRoaXMuYWpheFVybCAhPT0gJycgJiYgIWlzUmVxdWVzdHNTYW1lICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogYWpheFJlcXVlc3REYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBqUXVlcnkucGFyc2VKU09OKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiByZXNwb25zZVtwb3B1cFR5cGVdLmZvcm1JRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCA9IF90aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEID09PSB1bmRlZmluZWQgPyBwb3B1cFR5cGUgOiBfdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBfdGhpcy5maXJzdExvYWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkudHJpZ2dlcigncG9wdXBzLWNvbnRlbnQtbG9hZGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmZpcnN0TG9hZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cENvZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJpZ2dlckVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9wdXBzUXVhbnRpdHkgPSBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHZhciBsb2FkZWRDb250ZW50cyA9IDA7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLCBmdW5jdGlvbiAoIGluZGV4LCBwb3B1cFJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gX3RoaXMuYWpheEFjdGlvbiAhPSAnJyA/IHsnYWN0aW9uJzogX3RoaXMuYWpheEFjdGlvbn0gOiB7fTtcclxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyRWxlbWVudCA9IHBvcHVwUmVxdWVzdERhdGEuZWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhW190aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0gPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtfdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnBvcHVwSUQgPSBwb3B1cFJlcXVlc3REYXRhLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtfdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnJlcXVlc3QgPSBwb3B1cFJlcXVlc3REYXRhLnJlcXVlc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXBDb2RlID0gYnRvYShKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBfdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwQ29kZV0gPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBfdGhpcy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9PSBcIm5vIGNvbnRlbnRcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRCA9IHJlc3BvbnNlLmZvcm1JRCAhPT0gdW5kZWZpbmVkID8gcmVzcG9uc2UuZm9ybUlEIDogZGF0YVtfdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZXNwb25zZS5jb250ZW50ICE9PSB1bmRlZmluZWQgPyByZXNwb25zZS5jb250ZW50IDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwQ29kZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwQ29kZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiBwb3B1cElELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHRyaWdnZXJFbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZENvbnRlbnRzKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggbG9hZGVkQ29udGVudHMgPT09IHBvcHVwc1F1YW50aXR5ICYmIF90aGlzLmZpcnN0TG9hZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkudHJpZ2dlcigncG9wdXBzLWNvbnRlbnQtbG9hZGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5maXJzdExvYWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckVsZW1lbnQuYXR0cignZGF0YS1oYXNoJywgcG9wdXBDb2RlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSApIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIGZvcm1JRCA9IHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5oYW5kbGVBbGxGb3JtcyA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwSGFuZGxlcnNbZm9ybUlEXSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLnBvcHVwSGFuZGxlcnNbZm9ybUlEXSA9PT0gXCJmdW5jdGlvblwiICYmIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCkubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCkuc3VibWl0KGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Rm9ybSA9IGpRdWVyeSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKF90aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmZvcm1TdWJtaXNzaW9uKF90aGlzLCBmb3JtSUQsIGN1cnJlbnRGb3JtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JtU3VibWlzc2lvbiA9IGZ1bmN0aW9uICggcG9wdXBIYW5kbGVyLCBoYW5kbGVyVHlwZSwgZm9ybSApIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXShmb3JtLCBwb3B1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1BvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBkZWZlciA9IGRlZmVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmVyO1xyXG4gICAgICAgICAgICB2YXIgYXR0cjtcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5hbGxFbGVtZW50c0F0T25jZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyID0gZGVmZXIgPyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMudHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gcG9wdXBUeXBlLmF0dHIodGhpcy5oYXNoQXR0cmlidXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5jc3MoJ292ZXJmbG93JywgJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGFya0JhY2tncm91bmQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIFwicmdiYSgxLCAxLCAxLCAuNylcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDIwNywgMjA3LCAyMDcsIC42KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZvY3VzT25GaXJzdElucHV0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLmZpbmQoJ2lucHV0JykuZXEoMCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2hvd1BvcHVwJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5wb3B1cENvbnRlbnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCBtZXNzYWdlLCB0aW1lb3V0LCByZWRpcmVjdFVybCApIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIGlmICggbWVzc2FnZSAhPT0gdW5kZWZpbmVkICYmIG1lc3NhZ2UgIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgX3RoaXMucG9wdXAuaHRtbChtZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aW1lb3V0ID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZVBvcHVwKHJlZGlyZWN0VXJsKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5jbG9zZVBvcHVwKHJlZGlyZWN0VXJsKTtcclxuICAgICAgICAgICAgICAgIH0sIHRpbWVvdXQpXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKCByZWRpcmVjdFVybCApIHtcclxuICAgICAgICAgICAgaWYgKCByZWRpcmVjdFVybCAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQubG9jYXRpb24uaHJlZiA9IHJlZGlyZWN0VXJsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygncGFkZGluZy10b3AnLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwoJycpO1xyXG5cclxuICAgICAgICAgICAgalF1ZXJ5KCdib2R5JykuY3NzKCdvdmVyZmxvdycsICd2aXNpYmxlJyk7XHJcbiAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBWaXNpYmxlICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJ0cmFuc3BhcmVudFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBlbGVtZW50LCByZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGVsZW1lbnQuYXR0cih0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHJlcXVlc3REYXRhID09PSAwID8ge30gOiByZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT09IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAtIDEgJiYgcXVhbnRpdHkgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0gPSB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlID8ge30gOiBbXTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFqYXhBY3Rpb24gIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLmFjdGlvbiA9IHRoaXMuYWpheEFjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGRlZmVycmVkUG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdmFyIHBvcHVwVHlwZSwgZWxlbWVudDtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBqUXVlcnkocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBlbGVtZW50LmF0dHIoYXR0cik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldEZyb21QYWdlLmluZGV4T2YocG9wdXBUeXBlKSA9PT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdW3BvcHVwVHlwZV0gPSB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YShlbGVtZW50LCBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdW3BvcHVwVHlwZV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInBvcHVwSURcIjogcG9wdXBUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJlbGVtZW50XCI6IGVsZW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInJlcXVlc3RcIjogdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCB0aGlzLmdldEZyb21QYWdlLmluZGV4T2YocG9wdXBUeXBlKSAhPT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQ6IHBvcHVwVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogalF1ZXJ5KCdbJyArIHRoaXMuY29udGVudEF0dHJpYnV0ZSArICc9JyArIHBvcHVwVHlwZSArICddJykuaHRtbCgpXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uICggY29udGVudElkLCBuZXdEYXRhICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRlbXBDb250ZW50LmlubmVySFRNTCA9IHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcENvbnRlbnRPYmplY3QgPSBqUXVlcnkodGVtcENvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKG5ld0RhdGEsIGZ1bmN0aW9uICggc2VsZWN0b3IsIGNhbGxiYWNrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRlbXBDb250ZW50T2JqZWN0LmZpbmQoc2VsZWN0b3IpLCB0ZW1wQ29udGVudE9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50ID0gdGVtcENvbnRlbnQuaW5uZXJIVE1MO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIGNvbnRlbnQnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaW5qZWN0UG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBwb3B1cENsb3NlQnRuID0gJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzcyArICdcIj4nICsgdGhpcy5wb3B1cENsb3NlSW1hZ2UgKyAnPC9kaXY+JztcclxuICAgICAgICAgICAgaWYgKCBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5hcHBlbmQoJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzICsgJ1wiPicgKyBwb3B1cENsb3NlQnRuICsgJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnXCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cCA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlciA9IHRoaXMucG9wdXAuY2xvc2VzdCgnLicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldFBvcHVwQXR0cmlidXRlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnRyaWdnZXJTZWxlY3RvcnMgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHZhciBzZWxlY3RvcnM7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgdHJpZ2dlciBpbiB0aGlzLnRyaWdnZXJTZWxlY3RvcnMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3JzID0gdGhpcy50cmlnZ2VyU2VsZWN0b3JzW3RyaWdnZXJdLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoc2VsZWN0b3JzKS5hdHRyKHRoaXMudHJpZ2dlckF0dHJpYnV0ZSwgdHJpZ2dlcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIGF0dHI7XHJcbiAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhdHRyID0gX3RoaXMuYWxsRWxlbWVudHNBdE9uY2UgPyBfdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogJ2RhdGEtaGFzaCc7XHJcblxyXG4gICAgICAgICAgICAgICAgX3RoaXMuc2hvd1BvcHVwKGpRdWVyeSh0aGlzKS5hdHRyKGF0dHIpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBfdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzID0gW190aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnNdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBqUXVlcnkoX3RoaXMucG9wdXBDbG9zZVNlbGVjdG9ycy5qb2luKCcsJykpLmNsaWNrKGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBfdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrICkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggalF1ZXJ5KGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoX3RoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmhhbmRsZUFsbEZvcm1zICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMuaGFuZGxlQWxsRm9ybXMgPT09ICdmdW5jdGlvbicgKSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdzdWJtaXQnLCAnLicgKyB0aGlzLnBvcHVwQ2xhc3MgKyBcIiBmb3JtXCIsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5oYW5kbGVBbGxGb3JtcyhqUXVlcnkodGhpcyksIF90aGlzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3B1cFRyaWdnZXJDYWxsYmFjayA9IGZ1bmN0aW9uICggdHJpZ2dlciApIHtcclxuICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIF90aGlzLnNob3dQb3B1cCh0cmlnZ2VyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSA9IGZ1bmN0aW9uICggcG9wdXAgKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBvcHVwV3JhcHBlcjtcclxuICAgICAgICAgICAgdmFyIHBhZGRpbmcgPSAocGFyZW50Lm91dGVySGVpZ2h0KCkgLSB0aGlzLnBvcHVwLm91dGVySGVpZ2h0KCkpIC8gMjtcclxuICAgICAgICAgICAgcGFyZW50LmNzcygncGFkZGluZy10b3AnLCBwYWRkaW5nKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmlzRXF1YWwgPSBmdW5jdGlvbiAoIGZpcnN0T2JqZWN0LCBzZWNvbmRPYmplY3QgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmaXJzdE9iamVjdCkgPT09IEpTT04uc3RyaW5naWZ5KHNlY29uZE9iamVjdCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFdyYXBwZXJTdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFN0eWxlcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0bi5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBDbG9zZUJ0blN0eWxlcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0bi5jc3MoJ2ZpbGwnLCB0aGlzLmNsb3NlQnV0dG9uQ29sb3IpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKS5jc3MoJ2N1cnNvcicsICdwb2ludGVyJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYW5pbWF0ZWRTaG93ICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwicGFkZGluZyBcIiArIHRoaXMucG9wdXBTaG93U3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcImJhY2tncm91bmQgXCIgKyB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgaWYgKCB0cmFuc2l0aW9uICE9PSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgdHJhbnNpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIoKTtcclxuICAgIH1cclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

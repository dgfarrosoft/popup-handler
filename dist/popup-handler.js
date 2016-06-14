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
            var $this = this;
            this.setPopupAttributes();
            var ajaxRequestData = this.getAjaxRequestData();
            if ( this.allElementsAtOnce ) {
                var isRequestsSame = this.isEqual(ajaxRequestData, this.ajaxRequestData);
                this.ajaxRequestData = ajaxRequestData;
                if ( Object.keys(ajaxRequestData[this.ajaxDataObjectName]).length !== 0 && this.ajaxUrl !== '' && !isRequestsSame ) {
                    jQuery.ajax({
                        url: $this.ajaxUrl,
                        type: "POST",
                        data: ajaxRequestData,
                        success: function ( response ) {
                            if ( response !== "no content" ) {
                                response = jQuery.parseJSON(response);
                                for ( var popupType in response ) {
                                    $this.popupContents[popupType] = {
                                        popupID: response[popupType].formID,
                                        content: response[popupType].content
                                    };
                                    $this.popupContents[popupType].popupID = $this.popupContents[popupType].popupID === undefined ? popupType : $this.popupContents[popupType].popupID;
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
                jQuery.each(ajaxRequestData[this.ajaxDataObjectName], function ( index, popupRequestData ) {
                    triggerElement = popupRequestData.element;
                    var data = $this.ajaxAction != '' ? {'action': $this.ajaxAction} : {};
                    data[$this.ajaxDataObjectName] = {};

                    data[$this.ajaxDataObjectName].popupID = popupRequestData.popupID;
                    data[$this.ajaxDataObjectName].request = popupRequestData.request;
                    popupCode = btoa(JSON.stringify(data));
                    if ( $this.popupContents[popupCode] === undefined ) {
                        jQuery.ajax({
                            url: $this.ajaxUrl,
                            type: "POST",
                            data: data,
                            success: function ( response ) {
                                if ( response !== "no content" ) {
                                    response = JSON.parse(response);
                                    popupID = response.formID !== undefined ? response.formID : data[$this.ajaxDataObjectName].popupID;
                                    content = response.content !== undefined ? response.content : '';
                                    popupCode = btoa(JSON.stringify(data));
                                    $this.popupContents[popupCode] = {
                                        popupID: popupID,
                                        content: content,
                                        element: triggerElement
                                    };
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
            var $this = this;
            var formID = this.popupContents[popupType].popupID;
            this.popup.html(this.popupContents[popupType].content);
            this.getPopupsContent();
            if ( this.handleAllForms === undefined ) {
                if ( this.popupHandlers[formID] !== undefined && typeof this.popupHandlers[formID] === "function" && jQuery('form#' + this.popupContents[popupType].popupID).length !== 0 ) {
                    jQuery('form#' + this.popupContents[popupType].popupID).submit(function ( event ) {
                        event.preventDefault();
                        var currentForm = jQuery(this);

                        if ( !currentForm.hasClass($this.disabledFormClass) ) {
                            $this.formSubmission($this, formID, currentForm);
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
                attr = defer ? this.deferredTriggerAttribute : this.triggerAttribute;
                popupType = popupType.attr(attr);
            }
            if ( this.allElementsAtOnce ) {
                popupType = popupType.attr(this.hashAttribute);
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
            var $this = this;

            if ( message !== undefined && message !== '' ) {
                $this.popup.html(message);
            }

            if ( timeout === undefined ) {
                $this.closePopup(redirectUrl);

            } else {
                setTimeout(function () {
                    $this.closePopup(redirectUrl);
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
            var $this = this;
            var attr;
            jQuery(document).on('click', '[' + this.triggerAttribute + ']', function ( event ) {
                event.preventDefault();

                attr = $this.allElementsAtOnce ? $this.triggerAttribute : 'data-hash';

                $this.showPopup(jQuery(this).attr(attr));

                if ( typeof $this.popupCloseSelectors === 'string' ) {
                    $this.popupCloseSelectors = [$this.popupCloseSelectors];
                }

                jQuery($this.popupCloseSelectors.join(',')).click(function ( event ) {
                    event.preventDefault();
                    $this.hidePopup();
                });

                if ( $this.closeOnWrapperClick ) {
                    jQuery(document).click(function ( event ) {
                        if ( jQuery(event.target).hasClass($this.popupWrapperClass) ) {
                            $this.hidePopup();
                        }
                    });
                }
            });

            if ( this.handleAllForms !== undefined && typeof this.handleAllForms === 'function' ) {
                jQuery(document).on('submit', '.' + this.popupClass + " form", function ( event ) {
                    event.preventDefault();
                    $this.handleAllForms(jQuery(this), $this);
                });
            }
        };

        this.popupTriggerCallback = function ( trigger ) {
            var $this = this;
            return function () {
                $this.showPopup(trigger);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgaWYgKCB0aGlzIGluc3RhbmNlb2YgUG9wdXBIYW5kbGVyICkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLXBvcHVwJztcclxuICAgICAgICB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5oYXNoQXR0cmlidXRlID0gJ2RhdGEtaGFzaCc7XHJcbiAgICAgICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5jb250ZW50QXR0cmlidXRlID0gJ2RhdGEtY29udGVudCc7XHJcbiAgICAgICAgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmdldEZyb21QYWdlID0gW107XHJcbiAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gJ2ItcG9wdXAnO1xyXG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX193cmFwcGVyJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzcyA9IHRoaXMucG9wdXBDbGFzcyArICdfX2Nsb3NlLWJ0bic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzID0gWydbZGF0YS1wb3B1cC1jbG9zZV0nLCAnLicgKyB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzc107XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzID0ge307XHJcbiAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnBvcHVwQ29udGVudHMgPSB7fTtcclxuICAgICAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYWpheFVybCA9ICcnO1xyXG4gICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgdGhpcy5hbmltYXRlZFNob3cgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMucG9wdXBTaG93U3BlZWQgPSAyMDA7XHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkID0gNTAwO1xyXG4gICAgICAgIHRoaXMuZGFya0JhY2tncm91bmQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYWpheEFjdGlvbiA9ICcnO1xyXG4gICAgICAgIHRoaXMuYWpheERhdGFPYmplY3ROYW1lID0gJ3BvcHVwUmVxdWVzdERhdGEnO1xyXG4gICAgICAgIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgPSAnJztcclxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uU2l6ZSA9ICc0MHB4JztcclxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uQ29sb3IgPSBcIiMwMDBcIjtcclxuICAgICAgICB0aGlzLnBvcHVwU3R5bGVzID0gJ21heC13aWR0aDogNDAwcHg7bWFyZ2luOiAwIGF1dG87YmFja2dyb3VuZDogd2hpdGU7cGFkZGluZzogMzBweDtib3JkZXItcmFkaXVzOiAzcHg7J1xyXG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyU3R5bGVzID0gJ2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxMDA7ZGlzcGxheTpub25lO2hlaWdodDogMTAwJTt3aWR0aDogMTAwJTtsZWZ0OjA7dG9wOjA7JztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VJbWFnZSA9ICc8c3ZnIHZlcnNpb249XCIxLjFcIiBpZD1cIkxheWVyXzFcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeD1cIjBweFwiIHk9XCIwcHhcIiB2aWV3Qm94PVwiMCAwIDM3MS4yMyAzNzEuMjNcIiBzdHlsZT1cImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMzcxLjIzIDM3MS4yMztcIiB4bWw6c3BhY2U9XCJwcmVzZXJ2ZVwiPjxwb2x5Z29uIHBvaW50cz1cIjM3MS4yMywyMS4yMTMgMzUwLjAxOCwwIDE4NS42MTUsMTY0LjQwMiAyMS4yMTMsMCAwLDIxLjIxMyAxNjQuNDAyLDE4NS42MTUgMCwzNTAuMDE4IDIxLjIxMywzNzEuMjMgMTg1LjYxNSwyMDYuODI4IDM1MC4wMTgsMzcxLjIzIDM3MS4yMywzNTAuMDE4IDIwNi44MjgsMTg1LjYxNSBcIi8+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PC9zdmc+JztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG5TdHlsZXMgPVxyXG4gICAgICAgICAgICAnd2lkdGg6ICcgKyB0aGlzLmNsb3NlQnV0dG9uU2l6ZSArICc7JyArXHJcbiAgICAgICAgICAgICdoZWlnaHQ6ICcgKyB0aGlzLmNsb3NlQnV0dG9uU2l6ZSArICc7JyArXHJcbiAgICAgICAgICAgICdwb3NpdGlvbjogYWJzb2x1dGU7JyArXHJcbiAgICAgICAgICAgICdyaWdodDogMiU7JyArXHJcbiAgICAgICAgICAgICd0b3A6IDIlOycgK1xyXG4gICAgICAgICAgICAnY3Vyc29yOiBwb2ludGVyOyc7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBzZXR0aW5nIGluIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10gPSBzZXR0aW5nc1tzZXR0aW5nXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQodGhpcy5hbGxFbGVtZW50c0F0T25jZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsb3NlQnRuID0galF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyh0aGlzLmFsbEVsZW1lbnRzQXRPbmNlKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBBdHRyaWJ1dGVzKCk7XHJcbiAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSgpO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWxsRWxlbWVudHNBdE9uY2UgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaXNSZXF1ZXN0c1NhbWUgPSB0aGlzLmlzRXF1YWwoYWpheFJlcXVlc3REYXRhLCB0aGlzLmFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgIGlmICggT2JqZWN0LmtleXMoYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXSkubGVuZ3RoICE9PSAwICYmIHRoaXMuYWpheFVybCAhPT0gJycgJiYgIWlzUmVxdWVzdHNTYW1lICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAkdGhpcy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogYWpheFJlcXVlc3REYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBqUXVlcnkucGFyc2VKU09OKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiByZXNwb25zZVtwb3B1cFR5cGVdLmZvcm1JRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCA9ICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEID09PSB1bmRlZmluZWQgPyBwb3B1cFR5cGUgOiAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9wdXBJRDtcclxuICAgICAgICAgICAgICAgIHZhciBjb250ZW50O1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcHVwQ29kZTtcclxuICAgICAgICAgICAgICAgIHZhciB0cmlnZ2VyRWxlbWVudDtcclxuICAgICAgICAgICAgICAgIGpRdWVyeS5lYWNoKGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0sIGZ1bmN0aW9uICggaW5kZXgsIHBvcHVwUmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckVsZW1lbnQgPSBwb3B1cFJlcXVlc3REYXRhLmVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSAkdGhpcy5hamF4QWN0aW9uICE9ICcnID8geydhY3Rpb24nOiAkdGhpcy5hamF4QWN0aW9ufSA6IHt9O1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbJHRoaXMuYWpheERhdGFPYmplY3ROYW1lXSA9IHt9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBkYXRhWyR0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0ucG9wdXBJRCA9IHBvcHVwUmVxdWVzdERhdGEucG9wdXBJRDtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhWyR0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0ucmVxdWVzdCA9IHBvcHVwUmVxdWVzdERhdGEucmVxdWVzdDtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cENvZGUgPSBidG9hKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBDb2RlXSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICR0aGlzLmFqYXhVcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVzcG9uc2UgIT09IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEID0gcmVzcG9uc2UuZm9ybUlEICE9PSB1bmRlZmluZWQgPyByZXNwb25zZS5mb3JtSUQgOiBkYXRhWyR0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0ucG9wdXBJRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IHJlc3BvbnNlLmNvbnRlbnQgIT09IHVuZGVmaW5lZCA/IHJlc3BvbnNlLmNvbnRlbnQgOiAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBDb2RlID0gYnRvYShKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBDb2RlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQ6IHBvcHVwSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBjb250ZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogdHJpZ2dlckVsZW1lbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJFbGVtZW50LmF0dHIoJ2RhdGEtaGFzaCcsIHBvcHVwQ29kZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBmb3JtSUQgPSB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwodGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uY29udGVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaGFuZGxlQWxsRm9ybXMgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW2Zvcm1JRF0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW2Zvcm1JRF0gPT09IFwiZnVuY3Rpb25cIiAmJiBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLnN1Ym1pdChmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSBqUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFjdXJyZW50Rm9ybS5oYXNDbGFzcygkdGhpcy5kaXNhYmxlZEZvcm1DbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5mb3JtU3VibWlzc2lvbigkdGhpcywgZm9ybUlELCBjdXJyZW50Rm9ybSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybVN1Ym1pc3Npb24gPSBmdW5jdGlvbiAoIHBvcHVwSGFuZGxlciwgaGFuZGxlclR5cGUsIGZvcm0gKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0oZm9ybSwgcG9wdXBIYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlLCBkZWZlciApIHtcclxuICAgICAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICAgICAgdmFyIGF0dHI7XHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIHBvcHVwVHlwZSAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyID0gZGVmZXIgPyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMudHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hbGxFbGVtZW50c0F0T25jZSApIHtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKHRoaXMuaGFzaEF0dHJpYnV0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCAhPT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLnRyaWdnZXIoJ3BvcHVwLXNob3cnLCBbdGhpcy5wb3B1cF0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmNzcygnb3ZlcmZsb3cnLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXJrQmFja2dyb3VuZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCBcInJnYmEoMjA3LCAyMDcsIDIwNywgLjYpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnBvcHVwQ29udGVudHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoIG1lc3NhZ2UsIHRpbWVvdXQsIHJlZGlyZWN0VXJsICkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgaWYgKCBtZXNzYWdlICE9PSB1bmRlZmluZWQgJiYgbWVzc2FnZSAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cC5odG1sKG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRpbWVvdXQgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmNsb3NlUG9wdXAocmVkaXJlY3RVcmwpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmNsb3NlUG9wdXAocmVkaXJlY3RVcmwpO1xyXG4gICAgICAgICAgICAgICAgfSwgdGltZW91dClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlUG9wdXAgPSBmdW5jdGlvbiAoIHJlZGlyZWN0VXJsICkge1xyXG4gICAgICAgICAgICBpZiAoIHJlZGlyZWN0VXJsICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gcmVkaXJlY3RVcmw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zaXRpb24nLCAnbm9uZScpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdwYWRkaW5nLXRvcCcsIDApO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5oaWRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5jc3MoJ292ZXJmbG93JywgJ3Zpc2libGUnKTtcclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cFZpc2libGUgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCBcInRyYW5zcGFyZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGVsZW1lbnQsIHJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gZWxlbWVudC5hdHRyKHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gcmVxdWVzdERhdGEgPT09IDAgPyB7fSA6IHJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YVt0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXV0gPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHkrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXSA9IHRoaXMuYWxsRWxlbWVudHNBdE9uY2UgPyB7fSA6IFtdO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWpheEFjdGlvbiAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEuYWN0aW9uID0gdGhpcy5hamF4QWN0aW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBwb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZFBvcHVwVHJpZ2dlcnMgPSBqUXVlcnkoJ1snICsgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG5cclxuICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEocG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoZGVmZXJyZWRQb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZpbGxSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggcG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCBkZWZlciApIHtcclxuICAgICAgICAgICAgaWYgKCBkZWZlciA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0ciA9ICFkZWZlciA/IHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICB2YXIgcG9wdXBUeXBlLCBlbGVtZW50O1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb3B1cFRyaWdnZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IGpRdWVyeShwb3B1cFRyaWdnZXJzW2ldKTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHBvcHVwVHlwZSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0RnJvbVBhZ2UuaW5kZXhPZihwb3B1cFR5cGUpID09PSAtMSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuYWxsRWxlbWVudHNBdE9uY2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV1bcG9wdXBUeXBlXSA9IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV1bcG9wdXBUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicG9wdXBJRFwiOiBwb3B1cFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImVsZW1lbnRcIjogZWxlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicmVxdWVzdFwiOiB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YShlbGVtZW50LCBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdW3BvcHVwVHlwZV0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHRoaXMuZ2V0RnJvbVBhZ2UuaW5kZXhPZihwb3B1cFR5cGUpICE9PSAtMSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcG9wdXBUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBqUXVlcnkoJ1snICsgdGhpcy5jb250ZW50QXR0cmlidXRlICsgJz0nICsgcG9wdXBUeXBlICsgJ10nKS5odG1sKClcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudE9iamVjdCA9IGpRdWVyeSh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHBvcHVwQ2xvc2VCdG4gPSAnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzICsgJ1wiPicgKyB0aGlzLnBvcHVwQ2xvc2VJbWFnZSArICc8L2Rpdj4nO1xyXG4gICAgICAgICAgICBpZiAoIGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgKyAnXCI+JyArIHBvcHVwQ2xvc2VCdG4gKyAnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwID0galF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbGFzcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyID0gdGhpcy5wb3B1cC5jbG9zZXN0KCcuJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0UG9wdXBBdHRyaWJ1dGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMudHJpZ2dlclNlbGVjdG9ycyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHNlbGVjdG9ycztcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciB0cmlnZ2VyIGluIHRoaXMudHJpZ2dlclNlbGVjdG9ycyApIHtcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RvcnMgPSB0aGlzLnRyaWdnZXJTZWxlY3RvcnNbdHJpZ2dlcl0uam9pbignLCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShzZWxlY3RvcnMpLmF0dHIodGhpcy50cmlnZ2VyQXR0cmlidXRlLCB0cmlnZ2VyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgYXR0cjtcclxuICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF0dHIgPSAkdGhpcy5hbGxFbGVtZW50c0F0T25jZSA/ICR0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiAnZGF0YS1oYXNoJztcclxuXHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoalF1ZXJ5KHRoaXMpLmF0dHIoYXR0cikpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSBbJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yc107XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMuam9pbignLCcpKS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGpRdWVyeShldmVudC50YXJnZXQpLmhhc0NsYXNzKCR0aGlzLnBvcHVwV3JhcHBlckNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmhhbmRsZUFsbEZvcm1zICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMuaGFuZGxlQWxsRm9ybXMgPT09ICdmdW5jdGlvbicgKSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdzdWJtaXQnLCAnLicgKyB0aGlzLnBvcHVwQ2xhc3MgKyBcIiBmb3JtXCIsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5oYW5kbGVBbGxGb3JtcyhqUXVlcnkodGhpcyksICR0aGlzKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3B1cFRyaWdnZXJDYWxsYmFjayA9IGZ1bmN0aW9uICggdHJpZ2dlciApIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cCh0cmlnZ2VyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSA9IGZ1bmN0aW9uICggcG9wdXAgKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBvcHVwV3JhcHBlcjtcclxuICAgICAgICAgICAgdmFyIHBhZGRpbmcgPSAocGFyZW50Lm91dGVySGVpZ2h0KCkgLSB0aGlzLnBvcHVwLm91dGVySGVpZ2h0KCkpIC8gMjtcclxuICAgICAgICAgICAgcGFyZW50LmNzcygncGFkZGluZy10b3AnLCBwYWRkaW5nKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmlzRXF1YWwgPSBmdW5jdGlvbiAoIGZpcnN0T2JqZWN0LCBzZWNvbmRPYmplY3QgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmaXJzdE9iamVjdCkgPT09IEpTT04uc3RyaW5naWZ5KHNlY29uZE9iamVjdCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFdyYXBwZXJTdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFN0eWxlcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0bi5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBDbG9zZUJ0blN0eWxlcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0bi5jc3MoJ2ZpbGwnLCB0aGlzLmNsb3NlQnV0dG9uQ29sb3IpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKS5jc3MoJ2N1cnNvcicsICdwb2ludGVyJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYW5pbWF0ZWRTaG93ICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwicGFkZGluZyBcIiArIHRoaXMucG9wdXBTaG93U3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcImJhY2tncm91bmQgXCIgKyB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgaWYgKCB0cmFuc2l0aW9uICE9PSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgdHJhbnNpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIoKTtcclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

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

        this.hidePopup = function () {
            this.popupWrapper.css('-webkit-transition', 'none');
            this.popupWrapper.css('transition', 'none');

            this.popupWrapper.css('padding-top', 0);
            this.popupWrapper.hide();
            this.popup.html('');

            jQuery('body').css('overflow', 'visible');
            if ( !this.popupVisible ) {
                this.popupWrapper.css('background', "transparent");
            }
            this.popupVisible = false;
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

                jQuery($this.popupCloseSelectors.join(',')).click(function () {
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
                    $this.handleAllForms(jQuery(this));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJwb3B1cC1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gUG9wdXBIYW5kbGVyICgpIHtcclxuICAgIGlmICggdGhpcyBpbnN0YW5jZW9mIFBvcHVwSGFuZGxlciApIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5hbGxFbGVtZW50c0F0T25jZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaGFzaEF0dHJpYnV0ZSA9ICdkYXRhLWhhc2gnO1xyXG4gICAgICAgIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtZGVmZXJyZWQtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuY29udGVudEF0dHJpYnV0ZSA9ICdkYXRhLWNvbnRlbnQnO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgdGhpcy5nZXRGcm9tUGFnZSA9IFtdO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbGFzcyA9ICdiLXBvcHVwJztcclxuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fd3JhcHBlcic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX19jbG9zZS1idG4nO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9IFsnW2RhdGEtcG9wdXAtY2xvc2VdJywgJy4nICsgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3NdO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MgPSAnanMtZGlzYWJsZWQnO1xyXG4gICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICAgICAgdGhpcy5mb2N1c09uRmlyc3RJbnB1dCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgIHRoaXMuYW5pbWF0ZWRTaG93ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnBvcHVwU2hvd1NwZWVkID0gMjAwO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCA9IDUwMDtcclxuICAgICAgICB0aGlzLmRhcmtCYWNrZ3JvdW5kID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZSA9ICdwb3B1cFJlcXVlc3REYXRhJztcclxuICAgICAgICB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kID0gJyc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvblNpemUgPSAnNDBweCc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yID0gXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5wb3B1cFN0eWxlcyA9ICdtYXgtd2lkdGg6IDQwMHB4O21hcmdpbjogMCBhdXRvO2JhY2tncm91bmQ6IHdoaXRlO3BhZGRpbmc6IDMwcHg7Ym9yZGVyLXJhZGl1czogM3B4OydcclxuICAgICAgICB0aGlzLnBvcHVwV3JhcHBlclN0eWxlcyA9ICdiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6MTAwO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6IDEwMCU7d2lkdGg6IDEwMCU7bGVmdDowO3RvcDowOyc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlSW1hZ2UgPSAnPHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCAzNzEuMjMgMzcxLjIzXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM3MS4yMyAzNzEuMjM7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48cG9seWdvbiBwb2ludHM9XCIzNzEuMjMsMjEuMjEzIDM1MC4wMTgsMCAxODUuNjE1LDE2NC40MDIgMjEuMjEzLDAgMCwyMS4yMTMgMTY0LjQwMiwxODUuNjE1IDAsMzUwLjAxOCAyMS4yMTMsMzcxLjIzIDE4NS42MTUsMjA2LjgyOCAzNTAuMDE4LDM3MS4yMyAzNzEuMjMsMzUwLjAxOCAyMDYuODI4LDE4NS42MTUgXCIvPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlQnRuU3R5bGVzID1cclxuICAgICAgICAgICAgJ3dpZHRoOiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAnaGVpZ2h0OiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlOycgK1xyXG4gICAgICAgICAgICAncmlnaHQ6IDIlOycgK1xyXG4gICAgICAgICAgICAndG9wOiAyJTsnICtcclxuICAgICAgICAgICAgJ2N1cnNvcjogcG9pbnRlcjsnO1xyXG5cclxuICAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgc2V0dGluZyBpbiBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddID0gc2V0dGluZ3Nbc2V0dGluZ107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KHRoaXMuYWxsRWxlbWVudHNBdE9uY2UpO1xyXG4gICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwKCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0biA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnModGhpcy5hbGxFbGVtZW50c0F0T25jZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwQXR0cmlidXRlcygpO1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzUmVxdWVzdHNTYW1lID0gdGhpcy5pc0VxdWFsKGFqYXhSZXF1ZXN0RGF0YSwgdGhpcy5hamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0pLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmFqYXhVcmwgIT09ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGFqYXhSZXF1ZXN0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVzcG9uc2UgIT09IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0galF1ZXJ5LnBhcnNlSlNPTihyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5mb3JtSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgPSAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCA9PT0gdW5kZWZpbmVkID8gcG9wdXBUeXBlIDogJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cENvZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJpZ2dlckVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLCBmdW5jdGlvbiAoIGluZGV4LCBwb3B1cFJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyaWdnZXJFbGVtZW50ID0gcG9wdXBSZXF1ZXN0RGF0YS5lbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhID0gJHRoaXMuYWpheEFjdGlvbiAhPSAnJyA/IHsnYWN0aW9uJzogJHRoaXMuYWpheEFjdGlvbn0gOiB7fTtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhWyR0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0gPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVskdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnBvcHVwSUQgPSBwb3B1cFJlcXVlc3REYXRhLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVskdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnJlcXVlc3QgPSBwb3B1cFJlcXVlc3REYXRhLnJlcXVlc3Q7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXBDb2RlID0gYnRvYShKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwQ29kZV0gPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAkdGhpcy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9PSBcIm5vIGNvbnRlbnRcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBKU09OLnBhcnNlKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRCA9IHJlc3BvbnNlLmZvcm1JRCAhPT0gdW5kZWZpbmVkID8gcmVzcG9uc2UuZm9ybUlEIDogZGF0YVskdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSByZXNwb25zZS5jb250ZW50ICE9PSB1bmRlZmluZWQgPyByZXNwb25zZS5jb250ZW50IDogJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwQ29kZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwQ29kZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiBwb3B1cElELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogY29udGVudCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6IHRyaWdnZXJFbGVtZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyRWxlbWVudC5hdHRyKCdkYXRhLWhhc2gnLCBwb3B1cENvZGUpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZpbGxQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlICkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgZm9ybUlEID0gdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRDtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5odG1sKHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLmNvbnRlbnQpO1xyXG4gICAgICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQoKTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmhhbmRsZUFsbEZvcm1zID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBIYW5kbGVyc1tmb3JtSURdICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMucG9wdXBIYW5kbGVyc1tmb3JtSURdID09PSBcImZ1bmN0aW9uXCIgJiYgalF1ZXJ5KCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEKS5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0galF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhY3VycmVudEZvcm0uaGFzQ2xhc3MoJHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIGZvcm1JRCwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdKGZvcm0sIHBvcHVwSGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93UG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGRlZmVyID0gZGVmZXIgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmZXI7XHJcbiAgICAgICAgICAgIHZhciBhdHRyO1xyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBwb3B1cFR5cGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWxsRWxlbWVudHNBdE9uY2UgKSB7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cih0aGlzLmhhc2hBdHRyaWJ1dGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5jc3MoJ292ZXJmbG93JywgJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIHRoaXMuZGFya0JhY2tncm91bmQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIFwicmdiYSgxLCAxLCAxLCAuNylcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDIwNywgMjA3LCAyMDcsIC42KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZvY3VzT25GaXJzdElucHV0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLmZpbmQoJ2lucHV0JykuZXEoMCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2hvd1BvcHVwJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5wb3B1cENvbnRlbnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5odG1sKCcnKTtcclxuXHJcbiAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmNzcygnb3ZlcmZsb3cnLCAndmlzaWJsZScpO1xyXG4gICAgICAgICAgICBpZiAoICF0aGlzLnBvcHVwVmlzaWJsZSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIFwidHJhbnNwYXJlbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggZWxlbWVudCwgcmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggcmVxdWVzdERhdGEgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZVZhbHVlLCBxdWFudGl0eSA9IDA7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSByZXF1ZXN0RGF0YSA9PT0gMCA/IHt9IDogcmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhW3RoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldXSA9IGF0dHJpYnV0ZVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpID09PSB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggLSAxICYmIHF1YW50aXR5ID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdID0gdGhpcy5hbGxFbGVtZW50c0F0T25jZSA/IHt9IDogW107XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hamF4QWN0aW9uICE9PSAnJyApIHtcclxuICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YS5hY3Rpb24gPSB0aGlzLmFqYXhBY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHBvcHVwVHJpZ2dlcnMgPSBqUXVlcnkoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuICAgICAgICAgICAgdmFyIGRlZmVycmVkUG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcblxyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShkZWZlcnJlZFBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBpZiAoIGRlZmVyID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gIWRlZmVyID8gdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvcHVwVHJpZ2dlcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0galF1ZXJ5KHBvcHVwVHJpZ2dlcnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gZWxlbWVudC5hdHRyKGF0dHIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcG9wdXBUeXBlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgPT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5hbGxFbGVtZW50c0F0T25jZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwb3B1cElEXCI6IHBvcHVwVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZWxlbWVudFwiOiBlbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0XCI6IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV1bcG9wdXBUeXBlXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgIT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiBwb3B1cFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGpRdWVyeSgnWycgKyB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgKyAnPScgKyBwb3B1cFR5cGUgKyAnXScpLmh0bWwoKVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbiAoIGNvbnRlbnRJZCwgbmV3RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0galF1ZXJ5KHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0ZW1wQ29udGVudE9iamVjdC5maW5kKHNlbGVjdG9yKSwgdGVtcENvbnRlbnRPYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBjb250ZW50Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluamVjdFBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcG9wdXBDbG9zZUJ0biA9ICc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3MgKyAnXCI+JyArIHRoaXMucG9wdXBDbG9zZUltYWdlICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgIGlmICggalF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbGFzcykubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCdib2R5JykuYXBwZW5kKCc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyArICdcIj4nICsgcG9wdXBDbG9zZUJ0biArICc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAgPSBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIgPSB0aGlzLnBvcHVwLmNsb3Nlc3QoJy4nICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRQb3B1cEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy50cmlnZ2VyU2VsZWN0b3JzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3JzO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIHRyaWdnZXIgaW4gdGhpcy50cmlnZ2VyU2VsZWN0b3JzICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9ycyA9IHRoaXMudHJpZ2dlclNlbGVjdG9yc1t0cmlnZ2VyXS5qb2luKCcsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KHNlbGVjdG9ycykuYXR0cih0aGlzLnRyaWdnZXJBdHRyaWJ1dGUsIHRyaWdnZXIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBhdHRyO1xyXG4gICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgYXR0ciA9ICR0aGlzLmFsbEVsZW1lbnRzQXRPbmNlID8gJHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6ICdkYXRhLWhhc2gnO1xyXG5cclxuICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cChqUXVlcnkodGhpcykuYXR0cihhdHRyKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9IFskdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycy5qb2luKCcsJykpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggJHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggalF1ZXJ5KGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoJHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuaGFuZGxlQWxsRm9ybXMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5oYW5kbGVBbGxGb3JtcyA9PT0gJ2Z1bmN0aW9uJyApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ3N1Ym1pdCcsICcuJyArIHRoaXMucG9wdXBDbGFzcyArIFwiIGZvcm1cIiwgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmhhbmRsZUFsbEZvcm1zKGpRdWVyeSh0aGlzKSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucG9wdXBUcmlnZ2VyQ2FsbGJhY2sgPSBmdW5jdGlvbiAoIHRyaWdnZXIgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAodHJpZ2dlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkgPSBmdW5jdGlvbiAoIHBvcHVwICkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wb3B1cFdyYXBwZXI7XHJcbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gKHBhcmVudC5vdXRlckhlaWdodCgpIC0gdGhpcy5wb3B1cC5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgIHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFkZGluZyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VxdWFsID0gZnVuY3Rpb24gKCBmaXJzdE9iamVjdCwgc2Vjb25kT2JqZWN0ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZmlyc3RPYmplY3QpID09PSBKU09OLnN0cmluZ2lmeShzZWNvbmRPYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBXcmFwcGVyU3R5bGVzKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBTdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uYXR0cignc3R5bGUnLCB0aGlzLnBvcHVwQ2xvc2VCdG5TdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uY3NzKCdmaWxsJywgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yKTtcclxuICAgICAgICAgICAgalF1ZXJ5KCdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJykuY3NzKCdjdXJzb3InLCAncG9pbnRlcicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFuaW1hdGVkU2hvdyApIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcInBhZGRpbmcgXCIgKyB0aGlzLnBvcHVwU2hvd1NwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJiYWNrZ3JvdW5kIFwiICsgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbi5qb2luKCcsJyk7XHJcbiAgICAgICAgICAgIGlmICggdHJhbnNpdGlvbiAhPT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygndHJhbnNpdGlvbicsIHRyYW5zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9wdXBIYW5kbGVyKCk7XHJcbiAgICB9XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

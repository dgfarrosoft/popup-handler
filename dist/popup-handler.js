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
        this.backgroundTransitionSpeed = 1000;
        this.darkBackground = false;
        this.ajaxAction = '';
        this.ajaxDataObjectName = 'popupRequestData';
        this.customWrapperBackground = '';
        this.closeButtonSize = '40px';
        this.closeButtonColor = "#000";
        this.popupStyles = 'background:transparent;text-align:center;position:fixed;z-index:100;display:none;height: 100%;width: 100%;left:0;top:0;';
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
                $.each(ajaxRequestData[this.ajaxDataObjectName], function ( index, popupRequestData ) {
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
            if ( this.popupHandlers[formID] !== undefined && typeof this.popupHandlers[formID] === "function" && jQuery('form#' + this.popupContents[popupType].popupID).length !== 0 ) {
                jQuery('form#' + this.popupContents[popupType].popupID).submit(function ( event ) {
                    event.preventDefault();
                    var currentForm = jQuery(this);

                    if ( !currentForm.hasClass($this.disabledFormClass) ) {
                        $this.formSubmission($this, formID, currentForm);
                    }
                });
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

            this.hidePopup(true);
            if ( this.popupContents[popupType] !== undefined ) {
                if ( this.popupContents[popupType].popupID !== "" ) {
                    this.fillPopup(popupType);
                    this.popupVisible = true;

                    jQuery(document).trigger('popup-show', [this.popup]);

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

            this.setPopupStyles();
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
                    $(selectors).attr(this.triggerAttribute, trigger);
                }
            }
        };

        this.initEventListeners = function () {
            var $this = this;
            var attr;
            //if ( this.triggerSelectors !== undefined ) {
            //    var selectors;
            //    for ( var trigger in this.triggerSelectors ) {
            //        selectors = this.triggerSelectors[trigger].join(',');
            //        $(document).on('click', selectors, this.popupTriggerCallback(trigger));
            //    }
            //}
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

            this.popupWrapper.attr('style', this.popupStyles);
            this.popupCloseBtn.attr('style', this.popupCloseBtnStyles);
            this.popupCloseBtn.css('fill', this.closeButtonColor);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicG9wdXAtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIFBvcHVwSGFuZGxlciAoKSB7XHJcbiAgICBpZiAoIHRoaXMgaW5zdGFuY2VvZiBQb3B1cEhhbmRsZXIgKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuYWxsRWxlbWVudHNBdE9uY2UgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmhhc2hBdHRyaWJ1dGUgPSAnZGF0YS1oYXNoJztcclxuICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLWRlZmVycmVkLXBvcHVwJztcclxuICAgICAgICB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgPSAnZGF0YS1jb250ZW50JztcclxuICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZ2V0RnJvbVBhZ2UgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyA9IHRoaXMucG9wdXBDbGFzcyArICdfX3dyYXBwZXInO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSBbJ1tkYXRhLXBvcHVwLWNsb3NlXScsICcuJyArIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzXTtcclxuICAgICAgICB0aGlzLmRpc2FibGVkRm9ybUNsYXNzID0gJ2pzLWRpc2FibGVkJztcclxuICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hamF4VXJsID0gJyc7XHJcbiAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICB0aGlzLmFuaW1hdGVkU2hvdyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5wb3B1cFNob3dTcGVlZCA9IDIwMDtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgPSAxMDAwO1xyXG4gICAgICAgIHRoaXMuZGFya0JhY2tncm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZSA9ICdwb3B1cFJlcXVlc3REYXRhJztcclxuICAgICAgICB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kID0gJyc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvblNpemUgPSAnNDBweCc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yID0gXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5wb3B1cFN0eWxlcyA9ICdiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6MTAwO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6IDEwMCU7d2lkdGg6IDEwMCU7bGVmdDowO3RvcDowOyc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlSW1hZ2UgPSAnPHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCAzNzEuMjMgMzcxLjIzXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM3MS4yMyAzNzEuMjM7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48cG9seWdvbiBwb2ludHM9XCIzNzEuMjMsMjEuMjEzIDM1MC4wMTgsMCAxODUuNjE1LDE2NC40MDIgMjEuMjEzLDAgMCwyMS4yMTMgMTY0LjQwMiwxODUuNjE1IDAsMzUwLjAxOCAyMS4yMTMsMzcxLjIzIDE4NS42MTUsMjA2LjgyOCAzNTAuMDE4LDM3MS4yMyAzNzEuMjMsMzUwLjAxOCAyMDYuODI4LDE4NS42MTUgXCIvPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlQnRuU3R5bGVzID1cclxuICAgICAgICAgICAgJ3dpZHRoOiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAnaGVpZ2h0OiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlOycgK1xyXG4gICAgICAgICAgICAncmlnaHQ6IDIlOycgK1xyXG4gICAgICAgICAgICAndG9wOiAyJTsnICtcclxuICAgICAgICAgICAgJ2N1cnNvcjogcG9pbnRlcjsnO1xyXG5cclxuICAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgc2V0dGluZyBpbiBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddID0gc2V0dGluZ3Nbc2V0dGluZ107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KHRoaXMuYWxsRWxlbWVudHNBdE9uY2UpO1xyXG4gICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwKCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZUJ0biA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnModGhpcy5hbGxFbGVtZW50c0F0T25jZSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwQXR0cmlidXRlcygpO1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzUmVxdWVzdHNTYW1lID0gdGhpcy5pc0VxdWFsKGFqYXhSZXF1ZXN0RGF0YSwgdGhpcy5hamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0pLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmFqYXhVcmwgIT09ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IGFqYXhSZXF1ZXN0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVzcG9uc2UgIT09IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0galF1ZXJ5LnBhcnNlSlNPTihyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5mb3JtSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgPSAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCA9PT0gdW5kZWZpbmVkID8gcG9wdXBUeXBlIDogJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBvcHVwSUQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cENvZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJpZ2dlckVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICAkLmVhY2goYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXSwgZnVuY3Rpb24gKCBpbmRleCwgcG9wdXBSZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmlnZ2VyRWxlbWVudCA9IHBvcHVwUmVxdWVzdERhdGEuZWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YSA9ICR0aGlzLmFqYXhBY3Rpb24gIT0gJycgPyB7J2FjdGlvbic6ICR0aGlzLmFqYXhBY3Rpb259IDoge307XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVskdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdID0ge307XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbJHRoaXMuYWpheERhdGFPYmplY3ROYW1lXS5wb3B1cElEID0gcG9wdXBSZXF1ZXN0RGF0YS5wb3B1cElEO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbJHRoaXMuYWpheERhdGFPYmplY3ROYW1lXS5yZXF1ZXN0ID0gcG9wdXBSZXF1ZXN0RGF0YS5yZXF1ZXN0O1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwQ29kZSA9IGJ0b2EoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHRoaXMucG9wdXBDb250ZW50c1twb3B1cENvZGVdID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZShyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQgPSByZXNwb25zZS5mb3JtSUQgIT09IHVuZGVmaW5lZCA/IHJlc3BvbnNlLmZvcm1JRCA6IGRhdGFbJHRoaXMuYWpheERhdGFPYmplY3ROYW1lXS5wb3B1cElEO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gcmVzcG9uc2UuY29udGVudCAhPT0gdW5kZWZpbmVkID8gcmVzcG9uc2UuY29udGVudCA6ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3B1cENvZGUgPSBidG9hKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cENvZGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcG9wdXBJRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiB0cmlnZ2VyRWxlbWVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdHJpZ2dlckVsZW1lbnQuYXR0cignZGF0YS1oYXNoJywgcG9wdXBDb2RlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSApIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIGZvcm1JRCA9IHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQ7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW2Zvcm1JRF0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW2Zvcm1JRF0gPT09IFwiZnVuY3Rpb25cIiAmJiBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCkuc3VibWl0KGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSBqUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIGZvcm1JRCwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JtU3VibWlzc2lvbiA9IGZ1bmN0aW9uICggcG9wdXBIYW5kbGVyLCBoYW5kbGVyVHlwZSwgZm9ybSApIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXShmb3JtLCBwb3B1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1BvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBkZWZlciA9IGRlZmVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmVyO1xyXG4gICAgICAgICAgICB2YXIgYXR0cjtcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgIGF0dHIgPSBkZWZlciA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogdGhpcy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gcG9wdXBUeXBlLmF0dHIoYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFsbEVsZW1lbnRzQXRPbmNlICkge1xyXG4gICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gcG9wdXBUeXBlLmF0dHIodGhpcy5oYXNoQXR0cmlidXRlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5oaWRlUG9wdXAodHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCAhPT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXJrQmFja2dyb3VuZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCBcInJnYmEoMjA3LCAyMDcsIDIwNywgLjYpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyh0aGlzLnBvcHVwQ29udGVudHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnLXdlYmtpdC10cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygncGFkZGluZy10b3AnLCAwKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwoJycpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICBpZiAoICF0aGlzLnBvcHVwVmlzaWJsZSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIFwidHJhbnNwYXJlbnRcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggZWxlbWVudCwgcmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggcmVxdWVzdERhdGEgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHJpYnV0ZVZhbHVlLCBxdWFudGl0eSA9IDA7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSByZXF1ZXN0RGF0YSA9PT0gMCA/IHt9IDogcmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhW3RoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldXSA9IGF0dHJpYnV0ZVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpID09PSB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggLSAxICYmIHF1YW50aXR5ID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdID0gdGhpcy5hbGxFbGVtZW50c0F0T25jZSA/IHt9IDogW107XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hamF4QWN0aW9uICE9PSAnJyApIHtcclxuICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YS5hY3Rpb24gPSB0aGlzLmFqYXhBY3Rpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHBvcHVwVHJpZ2dlcnMgPSBqUXVlcnkoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuICAgICAgICAgICAgdmFyIGRlZmVycmVkUG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcblxyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShkZWZlcnJlZFBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBpZiAoIGRlZmVyID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gIWRlZmVyID8gdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvcHVwVHJpZ2dlcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0galF1ZXJ5KHBvcHVwVHJpZ2dlcnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gZWxlbWVudC5hdHRyKGF0dHIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggcG9wdXBUeXBlICE9PSB1bmRlZmluZWQgJiYgdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgPT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5hbGxFbGVtZW50c0F0T25jZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGFbdGhpcy5hamF4RGF0YU9iamVjdE5hbWVdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwb3B1cElEXCI6IHBvcHVwVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZWxlbWVudFwiOiBlbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXF1ZXN0XCI6IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV1bcG9wdXBUeXBlXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgIT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiBwb3B1cFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGpRdWVyeSgnWycgKyB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgKyAnPScgKyBwb3B1cFR5cGUgKyAnXScpLmh0bWwoKVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbiAoIGNvbnRlbnRJZCwgbmV3RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0galF1ZXJ5KHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0ZW1wQ29udGVudE9iamVjdC5maW5kKHNlbGVjdG9yKSwgdGVtcENvbnRlbnRPYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBjb250ZW50Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluamVjdFBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgcG9wdXBDbG9zZUJ0biA9ICc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsb3NlQnV0dG9uQ2xhc3MgKyAnXCI+JyArIHRoaXMucG9wdXBDbG9zZUltYWdlICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgIGlmICggalF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbGFzcykubGVuZ3RoID09PSAwICkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCdib2R5JykuYXBwZW5kKCc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyArICdcIj4nICsgcG9wdXBDbG9zZUJ0biArICc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAgPSBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIgPSB0aGlzLnBvcHVwLmNsb3Nlc3QoJy4nICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRQb3B1cEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy50cmlnZ2VyU2VsZWN0b3JzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc2VsZWN0b3JzO1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIHRyaWdnZXIgaW4gdGhpcy50cmlnZ2VyU2VsZWN0b3JzICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdG9ycyA9IHRoaXMudHJpZ2dlclNlbGVjdG9yc1t0cmlnZ2VyXS5qb2luKCcsJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChzZWxlY3RvcnMpLmF0dHIodGhpcy50cmlnZ2VyQXR0cmlidXRlLCB0cmlnZ2VyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgYXR0cjtcclxuICAgICAgICAgICAgLy9pZiAoIHRoaXMudHJpZ2dlclNlbGVjdG9ycyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAvLyAgICB2YXIgc2VsZWN0b3JzO1xyXG4gICAgICAgICAgICAvLyAgICBmb3IgKCB2YXIgdHJpZ2dlciBpbiB0aGlzLnRyaWdnZXJTZWxlY3RvcnMgKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICBzZWxlY3RvcnMgPSB0aGlzLnRyaWdnZXJTZWxlY3RvcnNbdHJpZ2dlcl0uam9pbignLCcpO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgJChkb2N1bWVudCkub24oJ2NsaWNrJywgc2VsZWN0b3JzLCB0aGlzLnBvcHVwVHJpZ2dlckNhbGxiYWNrKHRyaWdnZXIpKTtcclxuICAgICAgICAgICAgLy8gICAgfVxyXG4gICAgICAgICAgICAvL31cclxuICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF0dHIgPSAkdGhpcy5hbGxFbGVtZW50c0F0T25jZSA/ICR0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiAnZGF0YS1oYXNoJztcclxuXHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoalF1ZXJ5KHRoaXMpLmF0dHIoYXR0cikpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSBbJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yc107XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMuam9pbignLCcpKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGpRdWVyeShldmVudC50YXJnZXQpLmhhc0NsYXNzKCR0aGlzLnBvcHVwV3JhcHBlckNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMucG9wdXBUcmlnZ2VyQ2FsbGJhY2sgPSBmdW5jdGlvbiAoIHRyaWdnZXIgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAodHJpZ2dlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkgPSBmdW5jdGlvbiAoIHBvcHVwICkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wb3B1cFdyYXBwZXI7XHJcbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gKHBhcmVudC5vdXRlckhlaWdodCgpIC0gdGhpcy5wb3B1cC5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgIHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFkZGluZyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VxdWFsID0gZnVuY3Rpb24gKCBmaXJzdE9iamVjdCwgc2Vjb25kT2JqZWN0ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZmlyc3RPYmplY3QpID09PSBKU09OLnN0cmluZ2lmeShzZWNvbmRPYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBTdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uYXR0cignc3R5bGUnLCB0aGlzLnBvcHVwQ2xvc2VCdG5TdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uY3NzKCdmaWxsJywgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hbmltYXRlZFNob3cgKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJwYWRkaW5nIFwiICsgdGhpcy5wb3B1cFNob3dTcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwiYmFja2dyb3VuZCBcIiArIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJhbnNpdGlvbiA9IHRyYW5zaXRpb24uam9pbignLCcpO1xyXG4gICAgICAgICAgICBpZiAoIHRyYW5zaXRpb24gIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCB0cmFuc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcigpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

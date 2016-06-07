jQuery(function ( $ ) {
    function PopupHandler () {
        if ( this instanceof PopupHandler ) {
            this.triggerAttribute = 'data-popup';
            this.popupVisible = false;
            this.additionalDataAttributes = [];
            this.deferredTriggerAttribute = 'data-deferred-popup';
            this.disabledFormClass = 'js-disabled';
            this.popupClass = 'b-popup';
            this.popupWrapperClass = this.popupClass + '__wrapper';
            this.popupCloseSelector = '[data-popup-close]';
            this.popupContents = {};
            this.popupHandlers = {};
            this.focusOnFirstInput = true;
            this.closeOnWrapperClick = true;
            this.ajaxUrl = '';
            this.ajaxRequestData = {};
            this.animatedShow = true;
            this.popupShowSpeed = 200;
            this.backgroundTransition = true;
            this.backgroundTransitionSpeed = 1000;
            this.darkBackground = false;
            this.popupStyles = 'background-color:transparent;text-align:center;position:fixed;z-index:100;display:none;height: 100%;width: 100%;left:0;top:0;';

            this.init = function ( settings ) {
                if ( settings !== undefined ) {
                    for ( var setting in settings ) {
                        this[setting] = settings[setting];
                    }
                }

                this.getPopupsContent();
                this.injectPopup();
                this.setPopupStyles();
                this.initEventListeners();

            };

            this.getPopupsContent = function () {
                var $this = this;
                var newAjaxRequestData = this.getAjaxRequestData();
                var isRequestsSame = this.isEqual(newAjaxRequestData, this.ajaxRequestData);
                this.ajaxRequestData = newAjaxRequestData;
                if ( Object.keys(newAjaxRequestData.popupRequestData).length !== 0 && this.ajaxUrl != '' && !isRequestsSame ) {
                    $.ajax({
                        url: this.ajaxUrl,
                        type: "POST",
                        data: newAjaxRequestData,
                        success: function ( response ) {
                            if ( response != "no content" ) {
                                response = $.parseJSON(response);
                                for ( var popupType in response ) {
                                    $this.popupContents[popupType] = {
                                        formID: response[popupType].formID,
                                        content: response[popupType].content
                                    };
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
            };

            this.fillPopup = function ( popupType ) {
                var $this = this;
                this.popup.html(this.popupContents[popupType].content);
                this.getPopupsContent();
                if ( this.popupHandlers[popupType] !== undefined && typeof this.popupHandlers[popupType] == "function" ) {
                    $('form#' + this.popupContents[popupType].formID).submit(function ( event ) {
                        event.preventDefault();
                        var currentForm = $(this);

                        if ( !currentForm.hasClass($this.disabledFormClass) ) {
                            $this.formSubmission($this, popupType, currentForm);
                        }
                    });
                }
            };

            this.formSubmission = function ( popupHandler, handlerType, form ) {
                this.popupHandlers[handlerType](form, popupHandler);
            };

            this.showPopup = function ( popupType, defer ) {
                if ( typeof popupType !== 'string' ) {
                    defer = defer === undefined ? false : defer;
                    var attr = defer ? this.deferredTriggerAttribute : this.triggerAttribute;
                    popupType = popupType.attr(attr);
                }

                this.hidePopup(true);

                if ( this.popupContents[popupType] !== undefined ) {
                    if ( this.popupContents[popupType].formID != "" ) {
                        this.fillPopup(popupType);
                        this.popupVisible = true;

                        $(document).trigger('popup-show', [this.popup]);

                        this.popupWrapper.show();
                        this.centerVertically();
                        if ( this.customWrapperBackground !== undefined ) {
                            this.popupWrapper.css('background-color', this.customWrapperBackground);
                        }
                        else if ( this.darkBackground ) {
                            this.popupWrapper.css('background-color', "rgba(1, 1, 1, .7)");
                        } else {
                            this.popupWrapper.css('background-color', "rgba(207, 207, 207, .6)");
                        }
                        if ( this.focusOnFirstInput ) {
                            this.popup.find('input').eq(0).focus();
                        }
                    }
                } else {
                    console.log('showPopup');
                    console.log(popupType);
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
                    this.popupWrapper.css('background-color', "transparent");
                }
                this.popupVisible = false;
            };

            this.getSingleAjaxRequestData = function ( element, requestData ) {
                if ( requestData === undefined ) {
                    requestData = {};
                }
                var attributeValue, quantity = 0;
                if ( this.additionalDataAttributes.length != 0 ) {
                    for ( var i = 0; i < this.additionalDataAttributes.length; i++ ) {
                        attributeValue = element.attr(this.additionalDataAttributes[i]);
                        if ( attributeValue !== undefined ) {
                            requestData = requestData == 0 ? {} : requestData;
                            requestData[this.additionalDataAttributes[i]] = attributeValue;
                            quantity++;
                        }

                        if ( i == this.additionalDataAttributes.length - 1 && quantity == 0 ) {
                            requestData = 0;
                        }
                    }
                } else {
                    requestData = 0;
                }
                return requestData;
            };

            this.getAjaxRequestData = function () {
                var ajaxRequestData = {
                    action: "ajaxGetPopupContent",
                    popupRequestData: {}
                };

                var popupTriggers = $('[' + this.triggerAttribute + ']');
                var deferredPopupTriggers = $('[' + this.deferredTriggerAttribute + ']');

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
                    element = $(popupTriggers[i]);
                    popupType = element.attr(attr);

                    if ( popupType != undefined ) {
                        ajaxRequestData.popupRequestData[popupType] = this.getSingleAjaxRequestData(element, ajaxRequestData.popupRequestData[popupType]);
                    }
                }
                return ajaxRequestData;
            };

            this.updateContent = function ( contentId, newData ) {
                if ( this.popupContents[contentId] !== undefined ) {
                    var tempContent = document.createElement('div');
                    tempContent.innerHTML = this.popupContents[contentId].content;
                    var tempContentObject = $(tempContent);

                    $.each(newData, function ( selector, callback ) {
                        callback(tempContentObject.find(selector), tempContentObject);
                    });

                    this.popupContents[contentId].content = tempContent.innerHTML;
                } else {
                    console.log('no content');
                }
            };

            this.injectPopup = function () {
                if ( $('.' + this.popupClass).length == 0 ) {
                    $('body').append('<div class = "' + this.popupWrapperClass + '"><div class = "' + this.popupClass + '__close-btn"></div><div class = "' + this.popupClass + '"></div></div>');
                }
                this.popup = $('.' + this.popupClass);
                this.popupWrapper = this.popup.closest('.' + this.popupWrapperClass);
            };

            this.initEventListeners = function () {
                var $this = this;
                $(document).on('click', '[' + this.triggerAttribute + ']', function ( event ) {
                    event.preventDefault();

                    $this.showPopup($(this).attr($this.triggerAttribute));

                    $($this.popupCloseSelector).click(function () {
                        $this.hidePopup();
                    });

                    if ( $this.closeOnWrapperClick ) {
                        $(document).click(function ( event ) {
                            if ( $(event.target).hasClass($this.popupWrapperClass) ) {
                                $this.hidePopup();
                            }
                        });
                    }
                });
            };

            this.centerVertically = function () {
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

                if ( this.animatedShow ) {
                    transition.push("padding " + this.popupShowSpeed / 1000 + "s");
                }
                if ( this.backgroundTransition ) {
                    transition.push("background-color " + this.backgroundTransitionSpeed / 1000 + "s");
                }
                transition = transition.join(',');
                if ( transition != "" ) {
                    this.popupWrapper.css('transition', transition);
                }
            }

        } else {
            return new PopupHandler();
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicG9wdXAtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImpRdWVyeShmdW5jdGlvbiAoICQgKSB7XHJcbiAgICBmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgICAgIGlmICggdGhpcyBpbnN0YW5jZW9mIFBvcHVwSGFuZGxlciApIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLWRlZmVycmVkLXBvcHVwJztcclxuICAgICAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbGFzcyA9ICdiLXBvcHVwJztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyA9IHRoaXMucG9wdXBDbGFzcyArICdfX3dyYXBwZXInO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHMgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmFqYXhVcmwgPSAnJztcclxuICAgICAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5hbmltYXRlZFNob3cgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwU2hvd1NwZWVkID0gMjAwO1xyXG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkID0gMTAwMDtcclxuICAgICAgICAgICAgdGhpcy5kYXJrQmFja2dyb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwU3R5bGVzID0gJ2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxMDA7ZGlzcGxheTpub25lO2hlaWdodDogMTAwJTt3aWR0aDogMTAwJTtsZWZ0OjA7dG9wOjA7JztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHNldHRpbmcgaW4gc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10gPSBzZXR0aW5nc1tzZXR0aW5nXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycygpO1xyXG5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3QWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICAgICAgICAgIHZhciBpc1JlcXVlc3RzU2FtZSA9IHRoaXMuaXNFcXVhbChuZXdBamF4UmVxdWVzdERhdGEsIHRoaXMuYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0gbmV3QWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBPYmplY3Qua2V5cyhuZXdBamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YSkubGVuZ3RoICE9PSAwICYmIHRoaXMuYWpheFVybCAhPSAnJyAmJiAhaXNSZXF1ZXN0c1NhbWUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB0aGlzLmFqYXhVcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdBamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gJC5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBwb3B1cFR5cGUgaW4gcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1JRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5mb3JtSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGxQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwSGFuZGxlcnNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLnBvcHVwSGFuZGxlcnNbcG9wdXBUeXBlXSA9PSBcImZ1bmN0aW9uXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmZvcm1TdWJtaXNzaW9uKCR0aGlzLCBwb3B1cFR5cGUsIGN1cnJlbnRGb3JtKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5mb3JtU3VibWlzc2lvbiA9IGZ1bmN0aW9uICggcG9wdXBIYW5kbGVyLCBoYW5kbGVyVHlwZSwgZm9ybSApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0oZm9ybSwgcG9wdXBIYW5kbGVyKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd1BvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUsIGRlZmVyICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlciA9IGRlZmVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmVyO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZGVmZXIgPyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMudHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5mb3JtSUQgIT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtc2hvdycsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhcmtCYWNrZ3JvdW5kICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwicmdiYSgyMDcsIDIwNywgMjA3LCAuNilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZvY3VzT25GaXJzdElucHV0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5maW5kKCdpbnB1dCcpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygncGFkZGluZy10b3AnLCAwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cFZpc2libGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgXCJ0cmFuc3BhcmVudFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggZWxlbWVudCwgcmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggIT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHJlcXVlc3REYXRhID09IDAgPyB7fSA6IHJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcImFqYXhHZXRQb3B1cENvbnRlbnRcIixcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cFJlcXVlc3REYXRhOiB7fVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9ICQoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZFBvcHVwVHJpZ2dlcnMgPSAkKCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoZGVmZXJyZWRQb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggcG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCBkZWZlciApIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb3B1cFRyaWdnZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSAkKHBvcHVwVHJpZ2dlcnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGFbcG9wdXBUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uICggY29udGVudElkLCBuZXdEYXRhICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBDb250ZW50LmlubmVySFRNTCA9IHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0gJCh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICQuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIGNvbnRlbnQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoICQoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyArICdcIj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuXCI+PC9kaXY+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAgPSAkKCcuJyArIHRoaXMucG9wdXBDbGFzcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlciA9IHRoaXMucG9wdXAuY2xvc2VzdCgnLicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoJCh0aGlzKS5hdHRyKCR0aGlzLnRyaWdnZXJBdHRyaWJ1dGUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgJCgkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3IpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggJChldmVudC50YXJnZXQpLmhhc0NsYXNzKCR0aGlzLnBvcHVwV3JhcHBlckNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wb3B1cFdyYXBwZXI7XHJcbiAgICAgICAgICAgICAgICB2YXIgcGFkZGluZyA9IChwYXJlbnQub3V0ZXJIZWlnaHQoKSAtIHRoaXMucG9wdXAub3V0ZXJIZWlnaHQoKSkgLyAyO1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LmNzcygncGFkZGluZy10b3AnLCBwYWRkaW5nKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaXNFcXVhbCA9IGZ1bmN0aW9uICggZmlyc3RPYmplY3QsIHNlY29uZE9iamVjdCApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmaXJzdE9iamVjdCkgPT09IEpTT04uc3RyaW5naWZ5KHNlY29uZE9iamVjdCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBTdHlsZXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5hbmltYXRlZFNob3cgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwicGFkZGluZyBcIiArIHRoaXMucG9wdXBTaG93U3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcImJhY2tncm91bmQtY29sb3IgXCIgKyB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbiA9IHRyYW5zaXRpb24uam9pbignLCcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0cmFuc2l0aW9uICE9IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgdHJhbnNpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

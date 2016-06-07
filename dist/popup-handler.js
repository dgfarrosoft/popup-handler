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
            this.ajaxAction = 'ajaxGetPopupContent';
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
                    jQuery.ajax({
                        url: this.ajaxUrl,
                        type: "POST",
                        data: newAjaxRequestData,
                        success: function ( response ) {
                            if ( response != "no content" ) {
                                response = jQuery.parseJSON(response);
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
                    jQuery('form#' + this.popupContents[popupType].formID).submit(function ( event ) {
                        event.preventDefault();
                        var currentForm = jQuery(this);

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

                        jQuery(document).trigger('popup-show', [this.popup]);

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
                    action: this.ajaxAction,
                    popupRequestData: {}
                };

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
                if ( jQuery('.' + this.popupClass).length == 0 ) {
                    jQuery('body').append('<div class = "' + this.popupWrapperClass + '"><div class = "' + this.popupClass + '__close-btn"></div><div class = "' + this.popupClass + '"></div></div>');
                }
                this.popup = jQuery('.' + this.popupClass);
                this.popupWrapper = this.popup.closest('.' + this.popupWrapperClass);
            };

            this.initEventListeners = function () {
                var $this = this;
                jQuery(document).on('click', '[' + this.triggerAttribute + ']', function ( event ) {
                    event.preventDefault();

                    $this.showPopup(jQuery(this).attr($this.triggerAttribute));

                    jQuery($this.popupCloseSelector).click(function () {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgICAgZnVuY3Rpb24gUG9wdXBIYW5kbGVyICgpIHtcclxuICAgICAgICBpZiAoIHRoaXMgaW5zdGFuY2VvZiBQb3B1cEhhbmRsZXIgKSB7XHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLXBvcHVwJztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFZpc2libGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMgPSBbXTtcclxuICAgICAgICAgICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MgPSAnanMtZGlzYWJsZWQnO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX193cmFwcGVyJztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsb3NlU2VsZWN0b3IgPSAnW2RhdGEtcG9wdXAtY2xvc2VdJztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5hamF4VXJsID0gJyc7XHJcbiAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZWRTaG93ID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFNob3dTcGVlZCA9IDIwMDtcclxuICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCA9IDEwMDA7XHJcbiAgICAgICAgICAgIHRoaXMuZGFya0JhY2tncm91bmQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gJ2FqYXhHZXRQb3B1cENvbnRlbnQnO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwU3R5bGVzID0gJ2JhY2tncm91bmQtY29sb3I6dHJhbnNwYXJlbnQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxMDA7ZGlzcGxheTpub25lO2hlaWdodDogMTAwJTt3aWR0aDogMTAwJTtsZWZ0OjA7dG9wOjA7JztcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHNldHRpbmcgaW4gc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10gPSBzZXR0aW5nc1tzZXR0aW5nXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycygpO1xyXG5cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3QWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICAgICAgICAgIHZhciBpc1JlcXVlc3RzU2FtZSA9IHRoaXMuaXNFcXVhbChuZXdBamF4UmVxdWVzdERhdGEsIHRoaXMuYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0gbmV3QWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBPYmplY3Qua2V5cyhuZXdBamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YSkubGVuZ3RoICE9PSAwICYmIHRoaXMuYWpheFVybCAhPSAnJyAmJiAhaXNSZXF1ZXN0c1NhbWUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ld0FqYXhSZXF1ZXN0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVzcG9uc2UgIT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBqUXVlcnkucGFyc2VKU09OKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uZm9ybUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2VbcG9wdXBUeXBlXS5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSApIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwodGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQoKTtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gPT0gXCJmdW5jdGlvblwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0galF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhY3VycmVudEZvcm0uaGFzQ2xhc3MoJHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIHBvcHVwVHlwZSwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXShmb3JtLCBwb3B1cEhhbmRsZXIpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93UG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiBwb3B1cFR5cGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlZmVyID0gZGVmZXIgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkZWZlciA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogdGhpcy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKGF0dHIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVBvcHVwKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLmZvcm1JRCAhPSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLnRyaWdnZXIoJ3BvcHVwLXNob3cnLCBbdGhpcy5wb3B1cF0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXJrQmFja2dyb3VuZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwicmdiYSgxLCAxLCAxLCAuNylcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBcInJnYmEoMjA3LCAyMDcsIDIwNywgLjYpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5mb2N1c09uRmlyc3RJbnB1dCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2hvd1BvcHVwJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zaXRpb24nLCAnbm9uZScpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgJ25vbmUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwoJycpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBWaXNpYmxlICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwidHJhbnNwYXJlbnRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGVsZW1lbnQsIHJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoICE9IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gZWxlbWVudC5hdHRyKHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSByZXF1ZXN0RGF0YSA9PSAwID8ge30gOiByZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhW3RoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldXSA9IGF0dHJpYnV0ZVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHkrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBpID09IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAtIDEgJiYgcXVhbnRpdHkgPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogdGhpcy5hamF4QWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwUmVxdWVzdERhdGE6IHt9XHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShwb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoZGVmZXJyZWRQb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggcG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCBkZWZlciApIHtcclxuICAgICAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb3B1cFRyaWdnZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBqUXVlcnkocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gZWxlbWVudC5hdHRyKGF0dHIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHBvcHVwVHlwZSAhPSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhW3BvcHVwVHlwZV0gPSB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YShlbGVtZW50LCBhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGVtcENvbnRlbnRPYmplY3QgPSBqUXVlcnkodGVtcENvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIGNvbnRlbnQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpLmxlbmd0aCA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgKyAnXCI+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdfX2Nsb3NlLWJ0blwiPjwvZGl2PjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnXCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwID0galF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbGFzcyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlciA9IHRoaXMucG9wdXAuY2xvc2VzdCgnLicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzKTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cChqUXVlcnkodGhpcykuYXR0cigkdGhpcy50cmlnZ2VyQXR0cmlidXRlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3IpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBqUXVlcnkoZXZlbnQudGFyZ2V0KS5oYXNDbGFzcygkdGhpcy5wb3B1cFdyYXBwZXJDbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jZW50ZXJWZXJ0aWNhbGx5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucG9wdXBXcmFwcGVyO1xyXG4gICAgICAgICAgICAgICAgdmFyIHBhZGRpbmcgPSAocGFyZW50Lm91dGVySGVpZ2h0KCkgLSB0aGlzLnBvcHVwLm91dGVySGVpZ2h0KCkpIC8gMjtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFkZGluZyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmlzRXF1YWwgPSBmdW5jdGlvbiAoIGZpcnN0T2JqZWN0LCBzZWNvbmRPYmplY3QgKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZmlyc3RPYmplY3QpID09PSBKU09OLnN0cmluZ2lmeShzZWNvbmRPYmplY3QpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuYXR0cignc3R5bGUnLCB0aGlzLnBvcHVwU3R5bGVzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuYW5pbWF0ZWRTaG93ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcInBhZGRpbmcgXCIgKyB0aGlzLnBvcHVwU2hvd1NwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJiYWNrZ3JvdW5kLWNvbG9yIFwiICsgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgICAgIGlmICggdHJhbnNpdGlvbiAhPSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygndHJhbnNpdGlvbicsIHRyYW5zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9wdXBIYW5kbGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

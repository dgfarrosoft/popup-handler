function PopupHandler () {
    if ( this instanceof PopupHandler ) {
        this.triggerAttribute = 'data-popup';
        this.contentAttribute = 'data-content';
        this.getFromPage = [];
        this.popupVisible = false;
        this.additionalDataAttributes = [];
        this.deferredTriggerAttribute = 'data-deferred-popup';
        this.disabledFormClass = 'js-disabled';
        this.popupClass = 'b-popup';
        this.popupWrapperClass = this.popupClass + '__wrapper';
        this.popupCloseSelectors = '[data-popup-close]';
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
            if ( Object.keys(newAjaxRequestData.popupRequestData).length !== 0 && this.ajaxUrl !== '' && !isRequestsSame ) {
                jQuery.ajax({
                    url: this.ajaxUrl,
                    type: "POST",
                    data: newAjaxRequestData,
                    success: function ( response ) {
                        if ( response !== "no content" ) {
                            response = jQuery.parseJSON(response);
                            for ( var popupType in response ) {
                                $this.popupContents[popupType] = {
                                    popupID: response[popupType].popupID,
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
        };

        this.fillPopup = function ( popupType ) {
            var $this = this;
            this.popup.html(this.popupContents[popupType].content);
            this.getPopupsContent();
            if ( this.popupHandlers[popupType] !== undefined && typeof this.popupHandlers[popupType] === "function" && jQuery('form#' + this.popupContents[popupType].popupID).length !== 0 ) {
                jQuery('form#' + this.popupContents[popupType].popupID).submit(function ( event ) {
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
                if ( this.popupContents[popupType].popupID !== "" ) {
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

                if ( popupType !== undefined && this.getFromPage.indexOf(popupType) === -1 ) {
                    ajaxRequestData.popupRequestData[popupType] = this.getSingleAjaxRequestData(element, ajaxRequestData.popupRequestData[popupType]);
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
            if ( jQuery('.' + this.popupClass).length === 0 ) {
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

            if ( this.animatedShow ) {
                transition.push("padding " + this.popupShowSpeed / 1000 + "s");
            }
            if ( this.backgroundTransition ) {
                transition.push("background-color " + this.backgroundTransitionSpeed / 1000 + "s");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicG9wdXAtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIFBvcHVwSGFuZGxlciAoKSB7XHJcbiAgICBpZiAoIHRoaXMgaW5zdGFuY2VvZiBQb3B1cEhhbmRsZXIgKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuY29udGVudEF0dHJpYnV0ZSA9ICdkYXRhLWNvbnRlbnQnO1xyXG4gICAgICAgIHRoaXMuZ2V0RnJvbVBhZ2UgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gJ2ItcG9wdXAnO1xyXG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX193cmFwcGVyJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSAnW2RhdGEtcG9wdXAtY2xvc2VdJztcclxuICAgICAgICB0aGlzLnBvcHVwQ29udGVudHMgPSB7fTtcclxuICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgICAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYWpheFVybCA9ICcnO1xyXG4gICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgdGhpcy5hbmltYXRlZFNob3cgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMucG9wdXBTaG93U3BlZWQgPSAyMDA7XHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkID0gMTAwMDtcclxuICAgICAgICB0aGlzLmRhcmtCYWNrZ3JvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5hamF4QWN0aW9uID0gJ2FqYXhHZXRQb3B1cENvbnRlbnQnO1xyXG4gICAgICAgIHRoaXMucG9wdXBTdHlsZXMgPSAnYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjEwMDtkaXNwbGF5Om5vbmU7aGVpZ2h0OiAxMDAlO3dpZHRoOiAxMDAlO2xlZnQ6MDt0b3A6MDsnO1xyXG5cclxuICAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgc2V0dGluZyBpbiBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddID0gc2V0dGluZ3Nbc2V0dGluZ107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycygpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgdmFyIG5ld0FqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhKCk7XHJcbiAgICAgICAgICAgIHZhciBpc1JlcXVlc3RzU2FtZSA9IHRoaXMuaXNFcXVhbChuZXdBamF4UmVxdWVzdERhdGEsIHRoaXMuYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSBuZXdBamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgIGlmICggT2JqZWN0LmtleXMobmV3QWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGEpLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmFqYXhVcmwgIT09ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdBamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGpRdWVyeS5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0ucG9wdXBJRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2VbcG9wdXBUeXBlXS5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCA9ICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEID09PSB1bmRlZmluZWQgPyBwb3B1cFR5cGUgOiAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZpbGxQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlICkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwodGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uY29udGVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBIYW5kbGVyc1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMucG9wdXBIYW5kbGVyc1twb3B1cFR5cGVdID09PSBcImZ1bmN0aW9uXCIgJiYgalF1ZXJ5KCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEKS5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLnN1Ym1pdChmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0galF1ZXJ5KHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICFjdXJyZW50Rm9ybS5oYXNDbGFzcygkdGhpcy5kaXNhYmxlZEZvcm1DbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmZvcm1TdWJtaXNzaW9uKCR0aGlzLCBwb3B1cFR5cGUsIGN1cnJlbnRGb3JtKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZm9ybVN1Ym1pc3Npb24gPSBmdW5jdGlvbiAoIHBvcHVwSGFuZGxlciwgaGFuZGxlclR5cGUsIGZvcm0gKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0oZm9ybSwgcG9wdXBIYW5kbGVyKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlLCBkZWZlciApIHtcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZGVmZXIgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmZXI7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5oaWRlUG9wdXAodHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtc2hvdycsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhcmtCYWNrZ3JvdW5kICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBcInJnYmEoMSwgMSwgMSwgLjcpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwicmdiYSgyMDcsIDIwNywgMjA3LCAuNilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5mb2N1c09uRmlyc3RJbnB1dCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5maW5kKCdpbnB1dCcpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Nob3dQb3B1cCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5odG1sKCcnKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cFZpc2libGUgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBcInRyYW5zcGFyZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGVsZW1lbnQsIHJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gZWxlbWVudC5hdHRyKHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gcmVxdWVzdERhdGEgPT09IDAgPyB7fSA6IHJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YVt0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXV0gPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHkrKztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggaSA9PT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IHRoaXMuYWpheEFjdGlvbixcclxuICAgICAgICAgICAgICAgIHBvcHVwUmVxdWVzdERhdGE6IHt9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGRlZmVycmVkUG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdmFyIHBvcHVwVHlwZSwgZWxlbWVudDtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBqUXVlcnkocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBlbGVtZW50LmF0dHIoYXR0cik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldEZyb21QYWdlLmluZGV4T2YocG9wdXBUeXBlKSA9PT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGFbcG9wdXBUeXBlXSA9IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhW3BvcHVwVHlwZV0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgIT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3B1cElEOiBwb3B1cFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGpRdWVyeSgnWycgKyB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgKyAnPScgKyBwb3B1cFR5cGUgKyAnXScpLmh0bWwoKVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbiAoIGNvbnRlbnRJZCwgbmV3RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgICAgICB0ZW1wQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50O1xyXG4gICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0galF1ZXJ5KHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0ZW1wQ29udGVudE9iamVjdC5maW5kKHNlbGVjdG9yKSwgdGVtcENvbnRlbnRPYmplY3QpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBjb250ZW50Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluamVjdFBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAoIGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgKyAnXCI+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdfX2Nsb3NlLWJ0blwiPjwvZGl2PjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnXCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cCA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlciA9IHRoaXMucG9wdXAuY2xvc2VzdCgnLicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cChqUXVlcnkodGhpcykuYXR0cigkdGhpcy50cmlnZ2VyQXR0cmlidXRlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0eXBlb2YgJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9IFskdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzXTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycy5qb2luKCcsJykpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggJHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggalF1ZXJ5KGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoJHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5jZW50ZXJWZXJ0aWNhbGx5ID0gZnVuY3Rpb24gKCBwb3B1cCApIHtcclxuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHRoaXMucG9wdXBXcmFwcGVyO1xyXG4gICAgICAgICAgICB2YXIgcGFkZGluZyA9IChwYXJlbnQub3V0ZXJIZWlnaHQoKSAtIHRoaXMucG9wdXAub3V0ZXJIZWlnaHQoKSkgLyAyO1xyXG4gICAgICAgICAgICBwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcsIHBhZGRpbmcpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaXNFcXVhbCA9IGZ1bmN0aW9uICggZmlyc3RPYmplY3QsIHNlY29uZE9iamVjdCApIHtcclxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGZpcnN0T2JqZWN0KSA9PT0gSlNPTi5zdHJpbmdpZnkoc2Vjb25kT2JqZWN0KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgdHJhbnNpdGlvbiA9IFtdO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuYXR0cignc3R5bGUnLCB0aGlzLnBvcHVwU3R5bGVzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hbmltYXRlZFNob3cgKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJwYWRkaW5nIFwiICsgdGhpcy5wb3B1cFNob3dTcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwiYmFja2dyb3VuZC1jb2xvciBcIiArIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJhbnNpdGlvbiA9IHRyYW5zaXRpb24uam9pbignLCcpO1xyXG4gICAgICAgICAgICBpZiAoIHRyYW5zaXRpb24gIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCB0cmFuc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcigpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

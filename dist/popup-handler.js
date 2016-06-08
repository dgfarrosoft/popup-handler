function PopupHandler () {
    if ( this instanceof PopupHandler ) {
        this.triggerAttribute = 'data-popup';
        this.deferredTriggerAttribute = 'data-deferred-popup';
        this.contentAttribute = 'data-content';
        this.additionalDataAttributes = [];
        this.getFromPage = [];
        this.popupClass = 'b-popup';
        this.popupWrapperClass = this.popupClass + '__wrapper';
        this.popupCloseSelectors = '[data-popup-close]';
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
        this.popupStyles = 'background:transparent;text-align:center;position:fixed;z-index:100;display:none;height: 100%;width: 100%;left:0;top:0;';

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
            if ( Object.keys(newAjaxRequestData[this.ajaxDataObjectName]).length !== 0 && this.ajaxUrl !== '' && !isRequestsSame ) {
                jQuery.ajax({
                    url: this.ajaxUrl,
                    type: "POST",
                    data: newAjaxRequestData,
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
            ajaxRequestData[this.ajaxDataObjectName] = {};
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
                    ajaxRequestData[this.ajaxDataObjectName][popupType] = this.getSingleAjaxRequestData(element, ajaxRequestData[this.ajaxDataObjectName][popupType]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgaWYgKCB0aGlzIGluc3RhbmNlb2YgUG9wdXBIYW5kbGVyICkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLXBvcHVwJztcclxuICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLWRlZmVycmVkLXBvcHVwJztcclxuICAgICAgICB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgPSAnZGF0YS1jb250ZW50JztcclxuICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZ2V0RnJvbVBhZ2UgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyA9IHRoaXMucG9wdXBDbGFzcyArICdfX3dyYXBwZXInO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZVNlbGVjdG9ycyA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MgPSAnanMtZGlzYWJsZWQnO1xyXG4gICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICAgICAgdGhpcy5mb2N1c09uRmlyc3RJbnB1dCA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmFqYXhVcmwgPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgIHRoaXMuYW5pbWF0ZWRTaG93ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnBvcHVwU2hvd1NwZWVkID0gMjAwO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCA9IDEwMDA7XHJcbiAgICAgICAgdGhpcy5kYXJrQmFja2dyb3VuZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuYWpheEFjdGlvbiA9ICcnO1xyXG4gICAgICAgIHRoaXMuYWpheERhdGFPYmplY3ROYW1lID0gJ3BvcHVwUmVxdWVzdERhdGEnO1xyXG4gICAgICAgIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgPSAnJztcclxuICAgICAgICB0aGlzLnBvcHVwU3R5bGVzID0gJ2JhY2tncm91bmQ6dHJhbnNwYXJlbnQ7dGV4dC1hbGlnbjpjZW50ZXI7cG9zaXRpb246Zml4ZWQ7ei1pbmRleDoxMDA7ZGlzcGxheTpub25lO2hlaWdodDogMTAwJTt3aWR0aDogMTAwJTtsZWZ0OjA7dG9wOjA7JztcclxuXHJcbiAgICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgaWYgKCBzZXR0aW5ncyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIHNldHRpbmcgaW4gc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tzZXR0aW5nXSA9IHNldHRpbmdzW3NldHRpbmddO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBuZXdBamF4UmVxdWVzdERhdGEgPSB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSgpO1xyXG4gICAgICAgICAgICB2YXIgaXNSZXF1ZXN0c1NhbWUgPSB0aGlzLmlzRXF1YWwobmV3QWpheFJlcXVlc3REYXRhLCB0aGlzLmFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0gbmV3QWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKG5ld0FqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0pLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmFqYXhVcmwgIT09ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdBamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGpRdWVyeS5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uZm9ybUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEID0gJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgPT09IHVuZGVmaW5lZCA/IHBvcHVwVHlwZSA6ICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gPT09IFwiZnVuY3Rpb25cIiAmJiBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCkuc3VibWl0KGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSBqUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIHBvcHVwVHlwZSwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JtU3VibWlzc2lvbiA9IGZ1bmN0aW9uICggcG9wdXBIYW5kbGVyLCBoYW5kbGVyVHlwZSwgZm9ybSApIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXShmb3JtLCBwb3B1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1BvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBwb3B1cFR5cGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZGVmZXIgPyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMudHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCAhPT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXJrQmFja2dyb3VuZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCBcInJnYmEoMjA3LCAyMDcsIDIwNywgLjYpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zaXRpb24nLCAnbm9uZScpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdwYWRkaW5nLXRvcCcsIDApO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5oaWRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcbiAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBWaXNpYmxlICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJ0cmFuc3BhcmVudFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBlbGVtZW50LCByZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGVsZW1lbnQuYXR0cih0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHJlcXVlc3REYXRhID09PSAwID8ge30gOiByZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT09IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAtIDEgJiYgcXVhbnRpdHkgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0gPSB7fTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFqYXhBY3Rpb24gIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLmFjdGlvbiA9IHRoaXMuYWpheEFjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGRlZmVycmVkUG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdmFyIHBvcHVwVHlwZSwgZWxlbWVudDtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBqUXVlcnkocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBlbGVtZW50LmF0dHIoYXR0cik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldEZyb21QYWdlLmluZGV4T2YocG9wdXBUeXBlKSA9PT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHRoaXMuZ2V0RnJvbVBhZ2UuaW5kZXhPZihwb3B1cFR5cGUpICE9PSAtMSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcG9wdXBUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBqUXVlcnkoJ1snICsgdGhpcy5jb250ZW50QXR0cmlidXRlICsgJz0nICsgcG9wdXBUeXBlICsgJ10nKS5odG1sKClcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudE9iamVjdCA9IGpRdWVyeSh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5hcHBlbmQoJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzICsgJ1wiPjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnX19jbG9zZS1idG5cIj48L2Rpdj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAgPSBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIgPSB0aGlzLnBvcHVwLmNsb3Nlc3QoJy4nICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ2NsaWNrJywgJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nLCBmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoalF1ZXJ5KHRoaXMpLmF0dHIoJHRoaXMudHJpZ2dlckF0dHJpYnV0ZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSBbJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yc107XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMuam9pbignLCcpKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGpRdWVyeShldmVudC50YXJnZXQpLmhhc0NsYXNzKCR0aGlzLnBvcHVwV3JhcHBlckNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSA9IGZ1bmN0aW9uICggcG9wdXAgKSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBvcHVwV3JhcHBlcjtcclxuICAgICAgICAgICAgdmFyIHBhZGRpbmcgPSAocGFyZW50Lm91dGVySGVpZ2h0KCkgLSB0aGlzLnBvcHVwLm91dGVySGVpZ2h0KCkpIC8gMjtcclxuICAgICAgICAgICAgcGFyZW50LmNzcygncGFkZGluZy10b3AnLCBwYWRkaW5nKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmlzRXF1YWwgPSBmdW5jdGlvbiAoIGZpcnN0T2JqZWN0LCBzZWNvbmRPYmplY3QgKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShmaXJzdE9iamVjdCkgPT09IEpTT04uc3RyaW5naWZ5KHNlY29uZE9iamVjdCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHRyYW5zaXRpb24gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFN0eWxlcyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYW5pbWF0ZWRTaG93ICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwicGFkZGluZyBcIiArIHRoaXMucG9wdXBTaG93U3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvbiApIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcImJhY2tncm91bmQgXCIgKyB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgLyAxMDAwICsgXCJzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24gPSB0cmFuc2l0aW9uLmpvaW4oJywnKTtcclxuICAgICAgICAgICAgaWYgKCB0cmFuc2l0aW9uICE9PSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgdHJhbnNpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIoKTtcclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

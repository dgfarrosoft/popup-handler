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
                                    popupID: response[popupType].popupID,
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
                if ( this.popupContents[popupType].popupID != "" ) {
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

                if ( popupType != undefined && this.getFromPage.indexOf(popupType) === -1 ) {
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
            if ( transition != "" ) {
                this.popupWrapper.css('transition', transition);
            }
        }

    } else {
        return new PopupHandler();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicG9wdXAtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIFBvcHVwSGFuZGxlciAoKSB7XHJcbiAgICBpZiAoIHRoaXMgaW5zdGFuY2VvZiBQb3B1cEhhbmRsZXIgKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuY29udGVudEF0dHJpYnV0ZSA9ICdkYXRhLWNvbnRlbnQnO1xyXG4gICAgICAgIHRoaXMuZ2V0RnJvbVBhZ2UgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gJ2ItcG9wdXAnO1xyXG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX193cmFwcGVyJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hamF4VXJsID0gJyc7XHJcbiAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICB0aGlzLmFuaW1hdGVkU2hvdyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5wb3B1cFNob3dTcGVlZCA9IDIwMDtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgPSAxMDAwO1xyXG4gICAgICAgIHRoaXMuZGFya0JhY2tncm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSAnYWpheEdldFBvcHVwQ29udGVudCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cFN0eWxlcyA9ICdiYWNrZ3JvdW5kLWNvbG9yOnRyYW5zcGFyZW50O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6MTAwO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6IDEwMCU7d2lkdGg6IDEwMCU7bGVmdDowO3RvcDowOyc7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBzZXR0aW5nIGluIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10gPSBzZXR0aW5nc1tzZXR0aW5nXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycygpO1xyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBuZXdBamF4UmVxdWVzdERhdGEgPSB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSgpO1xyXG4gICAgICAgICAgICB2YXIgaXNSZXF1ZXN0c1NhbWUgPSB0aGlzLmlzRXF1YWwobmV3QWpheFJlcXVlc3REYXRhLCB0aGlzLmFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0gbmV3QWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKG5ld0FqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhKS5sZW5ndGggIT09IDAgJiYgdGhpcy5hamF4VXJsICE9ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdBamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPSBcIm5vIGNvbnRlbnRcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0galF1ZXJ5LnBhcnNlSlNPTihyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5wb3B1cElELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gPT0gXCJmdW5jdGlvblwiICkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50Rm9ybSA9IGpRdWVyeSh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhY3VycmVudEZvcm0uaGFzQ2xhc3MoJHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5mb3JtU3VibWlzc2lvbigkdGhpcywgcG9wdXBUeXBlLCBjdXJyZW50Rm9ybSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdKGZvcm0sIHBvcHVwSGFuZGxlcik7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93UG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mIHBvcHVwVHlwZSAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWZlciA9IGRlZmVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmVyO1xyXG4gICAgICAgICAgICAgICAgdmFyIGF0dHIgPSBkZWZlciA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogdGhpcy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gcG9wdXBUeXBlLmF0dHIoYXR0cik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuaGlkZVBvcHVwKHRydWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEICE9IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtc2hvdycsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkoKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhcmtCYWNrZ3JvdW5kICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBcInJnYmEoMSwgMSwgMSwgLjcpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwicmdiYSgyMDcsIDIwNywgMjA3LCAuNilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5mb2N1c09uRmlyc3RJbnB1dCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5maW5kKCdpbnB1dCcpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3Nob3dQb3B1cCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocG9wdXBUeXBlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygndHJhbnNpdGlvbicsICdub25lJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5odG1sKCcnKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cFZpc2libGUgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBcInRyYW5zcGFyZW50XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGVsZW1lbnQsIHJlcXVlc3REYXRhICkge1xyXG4gICAgICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAhPSAwICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSByZXF1ZXN0RGF0YSA9PSAwID8ge30gOiByZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogdGhpcy5hamF4QWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgcG9wdXBSZXF1ZXN0RGF0YToge31cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZFBvcHVwVHJpZ2dlcnMgPSBqUXVlcnkoJ1snICsgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG5cclxuICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEocG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoZGVmZXJyZWRQb3B1cFRyaWdnZXJzLCBhamF4UmVxdWVzdERhdGEsIHRydWUpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZpbGxSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggcG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCBkZWZlciApIHtcclxuICAgICAgICAgICAgaWYgKCBkZWZlciA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0ciA9ICFkZWZlciA/IHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICB2YXIgcG9wdXBUeXBlLCBlbGVtZW50O1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb3B1cFRyaWdnZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudCA9IGpRdWVyeShwb3B1cFRyaWdnZXJzW2ldKTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHBvcHVwVHlwZSAhPSB1bmRlZmluZWQgJiYgdGhpcy5nZXRGcm9tUGFnZS5pbmRleE9mKHBvcHVwVHlwZSkgPT09IC0xICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhW3BvcHVwVHlwZV0gPSB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YShlbGVtZW50LCBhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHRoaXMuZ2V0RnJvbVBhZ2UuaW5kZXhPZihwb3B1cFR5cGUpICE9PSAtMSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcG9wdXBUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBqUXVlcnkoJ1snICsgdGhpcy5jb250ZW50QXR0cmlidXRlICsgJz0nICsgcG9wdXBUeXBlICsgJ10nKS5odG1sKClcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudE9iamVjdCA9IGpRdWVyeSh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgKyAnXCI+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdfX2Nsb3NlLWJ0blwiPjwvZGl2PjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnXCI+PC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wb3B1cCA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlciA9IHRoaXMucG9wdXAuY2xvc2VzdCgnLicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cChqUXVlcnkodGhpcykuYXR0cigkdGhpcy50cmlnZ2VyQXR0cmlidXRlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcikuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAkdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBqUXVlcnkoZXZlbnQudGFyZ2V0KS5oYXNDbGFzcygkdGhpcy5wb3B1cFdyYXBwZXJDbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkgPSBmdW5jdGlvbiAoIHBvcHVwICkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wb3B1cFdyYXBwZXI7XHJcbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gKHBhcmVudC5vdXRlckhlaWdodCgpIC0gdGhpcy5wb3B1cC5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgIHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFkZGluZyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VxdWFsID0gZnVuY3Rpb24gKCBmaXJzdE9iamVjdCwgc2Vjb25kT2JqZWN0ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZmlyc3RPYmplY3QpID09PSBKU09OLnN0cmluZ2lmeShzZWNvbmRPYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBTdHlsZXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFuaW1hdGVkU2hvdyApIHtcclxuICAgICAgICAgICAgICAgIHRyYW5zaXRpb24ucHVzaChcInBhZGRpbmcgXCIgKyB0aGlzLnBvcHVwU2hvd1NwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJiYWNrZ3JvdW5kLWNvbG9yIFwiICsgdGhpcy5iYWNrZ3JvdW5kVHJhbnNpdGlvblNwZWVkIC8gMTAwMCArIFwic1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbi5qb2luKCcsJyk7XHJcbiAgICAgICAgICAgIGlmICggdHJhbnNpdGlvbiAhPSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCd0cmFuc2l0aW9uJywgdHJhbnNpdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcigpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

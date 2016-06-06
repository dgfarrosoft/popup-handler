function PopupHandler () {
    if ( this instanceof PopupHandler ) {
        this.triggerAttribute = 'data-popup';
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

        this.init = function ( settings ) {
            if ( settings !== undefined ) {
                for ( var setting in settings ) {
                    this[setting] = settings[setting];
                }
            }

            this.getPopupsContent();
            this.injectPopup();
            this.initEventListeners();
        };

        this.getPopupsContent = function () {

            var $this = this;
            var ajaxRequestData = this.getAjaxRequestData();
            if ( Object.keys(ajaxRequestData.popupRequestData).length !== 0 ) {
                $.ajax({
                    url: themeVars.ajaxUrl,
                    type: "POST",
                    data: ajaxRequestData,
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
            $('form#' + this.popupContents[popupType].formID).submit(function ( event ) {
                event.preventDefault();
                var currentForm = $(this);

                if ( !currentForm.hasClass($this.disabledFormClass) ) {
                    $this.formSubmission($this, popupType, currentForm);
                }
            });
        };

        this.formSubmission = function ( popupHandler, handlerType, form ) {
            if ( this.popupHandlers[handlerType] !== undefined ) {
                this.popupHandlers[handlerType](form, popupHandler);
            } else {
                console.log('formSubmission-default');
                console.log(handlerType);
            }
        };

        this.showPopup = function ( popupType, defer ) {
            if ( typeof popupType !== 'string' ) {
                defer = defer === undefined ? false : defer;
                var attr = defer ? this.deferredTriggerAttribute : this.triggerAttribute;
                popupType = popupType.attr(attr);
            }
            this.hidePopup();

            if ( this.popupContents[popupType] !== undefined ) {
                if ( this.popupContents[popupType].formID != "" ) {
                    this.fillPopup(popupType);

                    $(document).trigger('popup-show', [this.popup]);

                    this.popup.parent().show();
                    centerVertically(this.popup);
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
            this.popup.parent().css('padding-top', 0);

            $(document).trigger('popup-hide', [this.popup]);

            this.popup.parent().hide();
            this.popup.html('');
        };

        this.getSingleAjaxRequestData = function ( element, requestData ) {
            if ( requestData === undefined ) {
                requestData = {};
            }
            var attributeValue, quantity = 0;
            if ( this.additionalDataAttributes !== undefined ) {
                for ( var i = 0; i < this.additionalDataAttributes.length; i++ ) {
                    attributeValue = element.attr(this.additionalDataAttributes[i]);
                    if ( attributeValue !== undefined ) {
                        requestData[this.additionalDataAttributes[i]] = attributeValue;
                        quantity++;
                    }

                    if ( i == this.additionalDataAttributes.length - 1 && quantity == 0 ) {
                        requestData = 0;
                    }
                }
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

            ajaxRequestData = this.fillRequestData(ajaxRequestData, popupTriggers);
            ajaxRequestData = this.fillRequestData(ajaxRequestData, deferredPopupTriggers, true);

            return ajaxRequestData;
        };

        this.fillRequestData = function ( ajaxRequestData, popupTriggers, defer ) {
            if ( defer === undefined ) {
                defer = false;
            }
            var attr = !defer ? this.triggerAttribute : this.deferredTriggerAttribute;
            var popupType, element;
            for ( var i = 0; i < popupTriggers.length; i++ ) {
                element = $(popupTriggers[i]);
                popupType = element.attr(attr);
                if ( !this.popupContents[popupType] && popupType != undefined ) {
                    ajaxRequestData.popupRequestData[popupType] = this.getSingleAjaxRequestData(element, ajaxRequestData[popupType]);
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
    } else {
        return new PopupHandler();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoicG9wdXAtaGFuZGxlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIFBvcHVwSGFuZGxlciAoKSB7XHJcbiAgICBpZiAoIHRoaXMgaW5zdGFuY2VvZiBQb3B1cEhhbmRsZXIgKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gJ2ItcG9wdXAnO1xyXG4gICAgICAgIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgPSB0aGlzLnBvcHVwQ2xhc3MgKyAnX193cmFwcGVyJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgICAgIHRoaXMucG9wdXBIYW5kbGVycyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA9IHRydWU7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdCA9IGZ1bmN0aW9uICggc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGZvciAoIHZhciBzZXR0aW5nIGluIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXNbc2V0dGluZ10gPSBzZXR0aW5nc1tzZXR0aW5nXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICAgICAgaWYgKCBPYmplY3Qua2V5cyhhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YSkubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoZW1lVmFycy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGFqYXhSZXF1ZXN0RGF0YSxcclxuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSAkLnBhcnNlSlNPTihyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybUlEOiByZXNwb25zZVtwb3B1cFR5cGVdLmZvcm1JRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2VbcG9wdXBUeXBlXS5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgICQoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLmZvcm1JRCkuc3VibWl0KGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICFjdXJyZW50Rm9ybS5oYXNDbGFzcygkdGhpcy5kaXNhYmxlZEZvcm1DbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIHBvcHVwVHlwZSwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0oZm9ybSwgcG9wdXBIYW5kbGVyKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmb3JtU3VibWlzc2lvbi1kZWZhdWx0Jyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhoYW5kbGVyVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNob3dQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlLCBkZWZlciApIHtcclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZGVmZXIgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogZGVmZXI7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5mb3JtSUQgIT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5wYXJlbnQoKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY2VudGVyVmVydGljYWxseSh0aGlzLnBvcHVwKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cC5wYXJlbnQoKS5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcblxyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1oaWRlJywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAucGFyZW50KCkuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwLmh0bWwoJycpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBlbGVtZW50LCByZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IFwiYWpheEdldFBvcHVwQ29udGVudFwiLFxyXG4gICAgICAgICAgICAgICAgcG9wdXBSZXF1ZXN0RGF0YToge31cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHZhciBwb3B1cFRyaWdnZXJzID0gJCgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0gJCgnWycgKyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcblxyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShhamF4UmVxdWVzdERhdGEsIHBvcHVwVHJpZ2dlcnMpO1xyXG4gICAgICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShhamF4UmVxdWVzdERhdGEsIGRlZmVycmVkUG9wdXBUcmlnZ2VycywgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBhamF4UmVxdWVzdERhdGEsIHBvcHVwVHJpZ2dlcnMsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBpZiAoIGRlZmVyID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciBhdHRyID0gIWRlZmVyID8gdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvcHVwVHJpZ2dlcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50ID0gJChwb3B1cFRyaWdnZXJzW2ldKTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICYmIHBvcHVwVHlwZSAhPSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGFbcG9wdXBUeXBlXSA9IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uICggY29udGVudElkLCBuZXdEYXRhICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHRlbXBDb250ZW50LmlubmVySFRNTCA9IHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGVtcENvbnRlbnRPYmplY3QgPSAkKHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAkLmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgaWYgKCAkKCcuJyArIHRoaXMucG9wdXBDbGFzcykubGVuZ3RoID09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyArICdcIj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuXCI+PC9kaXY+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwID0gJCgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cCgkKHRoaXMpLmF0dHIoJHRoaXMudHJpZ2dlckF0dHJpYnV0ZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICQoJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAkKGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoJHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb3B1cEhhbmRsZXIoKTtcclxuICAgIH1cclxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

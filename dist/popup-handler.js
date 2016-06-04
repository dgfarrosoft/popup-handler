function PopupHandler () {
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMgPSBbXTtcclxuICAgIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtZGVmZXJyZWQtcG9wdXAnO1xyXG4gICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICB0aGlzLnBvcHVwV3JhcHBlckNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fd3JhcHBlcic7XHJcbiAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIHNldHRpbmdzICkge1xyXG4gICAgICAgIGlmICggc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIHNldHRpbmcgaW4gc2V0dGluZ3MgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddID0gc2V0dGluZ3Nbc2V0dGluZ107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycygpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhKCk7XHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyhhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YSkubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB0aGVtZVZhcnMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogYWpheFJlcXVlc3REYXRhLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9ICQucGFyc2VKU09OKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uZm9ybUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLnBvcHVwLmh0bWwodGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uY29udGVudCk7XHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgJCgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmZvcm1TdWJtaXNzaW9uKCR0aGlzLCBwb3B1cFR5cGUsIGN1cnJlbnRGb3JtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdKGZvcm0sIHBvcHVwSGFuZGxlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Zvcm1TdWJtaXNzaW9uLWRlZmF1bHQnKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaGFuZGxlclR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zaG93UG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSwgZGVmZXIgKSB7XHJcbiAgICAgICAgaWYgKCB0eXBlb2YgcG9wdXBUeXBlICE9PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICAgICAgdmFyIGF0dHIgPSBkZWZlciA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogdGhpcy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICBwb3B1cFR5cGUgPSBwb3B1cFR5cGUuYXR0cihhdHRyKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5oaWRlUG9wdXAoKTtcclxuXHJcbiAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLmZvcm1JRCAhPSBcIlwiICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsUG9wdXAocG9wdXBUeXBlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLnBhcmVudCgpLnNob3coKTtcclxuICAgICAgICAgICAgICAgIGNlbnRlclZlcnRpY2FsbHkodGhpcy5wb3B1cCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5maW5kKCdpbnB1dCcpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2hvd1BvcHVwJyk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnBvcHVwLnBhcmVudCgpLmNzcygncGFkZGluZy10b3AnLCAwKTtcclxuXHJcbiAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtaGlkZScsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wdXAucGFyZW50KCkuaGlkZSgpO1xyXG4gICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBlbGVtZW50LCByZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgIGlmICggdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGVsZW1lbnQuYXR0cih0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcXVhbnRpdHkrKztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIGkgPT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcXVlc3REYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IFwiYWpheEdldFBvcHVwQ29udGVudFwiLFxyXG4gICAgICAgICAgICBwb3B1cFJlcXVlc3REYXRhOiB7fVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhciBwb3B1cFRyaWdnZXJzID0gJCgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgIHZhciBkZWZlcnJlZFBvcHVwVHJpZ2dlcnMgPSAkKCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoYWpheFJlcXVlc3REYXRhLCBwb3B1cFRyaWdnZXJzKTtcclxuICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShhamF4UmVxdWVzdERhdGEsIGRlZmVycmVkUG9wdXBUcmlnZ2VycywgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZmlsbFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBhamF4UmVxdWVzdERhdGEsIHBvcHVwVHJpZ2dlcnMsIGRlZmVyICkge1xyXG4gICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgZGVmZXIgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICB2YXIgcG9wdXBUeXBlLCBlbGVtZW50O1xyXG4gICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHBvcHVwVHJpZ2dlcnMubGVuZ3RoOyBpKysgKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQgPSAkKHBvcHVwVHJpZ2dlcnNbaV0pO1xyXG4gICAgICAgICAgICBwb3B1cFR5cGUgPSBlbGVtZW50LmF0dHIoYXR0cik7XHJcbiAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICYmIHBvcHVwVHlwZSAhPSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3BvcHVwVHlwZV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uICggY29udGVudElkLCBuZXdEYXRhICkge1xyXG4gICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIHRlbXBDb250ZW50LmlubmVySFRNTCA9IHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudE9iamVjdCA9ICQodGVtcENvbnRlbnQpO1xyXG5cclxuICAgICAgICAgICAgJC5lYWNoKG5ld0RhdGEsIGZ1bmN0aW9uICggc2VsZWN0b3IsIGNhbGxiYWNrICkge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50ID0gdGVtcENvbnRlbnQuaW5uZXJIVE1MO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBjb250ZW50Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluamVjdFBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICggJCgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpLmxlbmd0aCA9PSAwICkge1xyXG4gICAgICAgICAgICAkKCdib2R5JykuYXBwZW5kKCc8ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyArICdcIj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuXCI+PC9kaXY+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3B1cCA9ICQoJy4nICsgdGhpcy5wb3B1cENsYXNzKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScsIGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoJCh0aGlzKS5hdHRyKCR0aGlzLnRyaWdnZXJBdHRyaWJ1dGUpKTtcclxuXHJcbiAgICAgICAgICAgICQoJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS5jbGljayhmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggJChldmVudC50YXJnZXQpLmhhc0NsYXNzKCR0aGlzLnBvcHVwV3JhcHBlckNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuaGlkZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

function PopupHandler () {
    this.triggerAttribute = 'data-popup';
    this.deferredTriggerAttribute = 'data-deferred-popup';
    this.disabledFormClass = 'js-disabled';
    this.popupClass = 'b-popup';
    this.popupContents = {};
    this.popupHandlers = {};
    this.focusOnFirstInput = true;

    this.init = function ( handlerSettings ) {
        if ( handlerSettings !== undefined ) {
            this.popupHandlers = handlerSettings.popupHandlers;
            if ( handlerSettings.additionalDataAttributes !== undefined ) {
                this.additionalDataAttributes = handlerSettings.additionalDataAttributes;
            }
            this.triggerAttribute = handlerSettings.triggerAttribute === undefined ? this.triggerAttribute : handlerSettings.triggerAttribute;
            this.deferredTriggerAttribute = handlerSettings.deferredTriggerAttribute === undefined ? this.deferredTriggerAttribute : handlerSettings.deferredTriggerAttribute;
            this.disabledFormClass = handlerSettings.disabledFormClass === undefined ? this.disabledFormClass : handlerSettings.disabledFormClass;
            this.popupClass = handlerSettings.popupClass === undefined ? this.popupClass : handlerSettings.popupClass;
            this.focusOnFirstInput = handlerSettings.focusOnFirstInput === undefined ? this.focusOnFirstInput : handlerSettings.focusOnFirstInput;
        }

        this.getPopupsContent(this.triggerAttribute);
        this.injectPopup();
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

    this.showPopup = function ( pushedButton, defer ) {
        defer = defer === undefined ? false : defer;
        var attr = defer ? this.deferredTriggerAttribute : this.triggerAttribute;
        var popupType = pushedButton.attr(attr);
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
            $('body').append('<div class = "' + this.popupClass + '__wrapper"><div class = "' + this.popupClass + '__close-btn"></div><div class = "' + this.popupClass + '"></div></div>');
        }
        this.popup = $('.' + this.popupClass);
    };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtcG9wdXAnO1xyXG4gICAgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1kZWZlcnJlZC1wb3B1cCc7XHJcbiAgICB0aGlzLmRpc2FibGVkRm9ybUNsYXNzID0gJ2pzLWRpc2FibGVkJztcclxuICAgIHRoaXMucG9wdXBDbGFzcyA9ICdiLXBvcHVwJztcclxuICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgdGhpcy5wb3B1cEhhbmRsZXJzID0ge307XHJcbiAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIGhhbmRsZXJTZXR0aW5ncyApIHtcclxuICAgICAgICBpZiAoIGhhbmRsZXJTZXR0aW5ncyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSBoYW5kbGVyU2V0dGluZ3MucG9wdXBIYW5kbGVycztcclxuICAgICAgICAgICAgaWYgKCBoYW5kbGVyU2V0dGluZ3MuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IGhhbmRsZXJTZXR0aW5ncy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gaGFuZGxlclNldHRpbmdzLnRyaWdnZXJBdHRyaWJ1dGUgPT09IHVuZGVmaW5lZCA/IHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6IGhhbmRsZXJTZXR0aW5ncy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9IGhhbmRsZXJTZXR0aW5ncy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPT09IHVuZGVmaW5lZCA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogaGFuZGxlclNldHRpbmdzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9IGhhbmRsZXJTZXR0aW5ncy5kaXNhYmxlZEZvcm1DbGFzcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA6IGhhbmRsZXJTZXR0aW5ncy5kaXNhYmxlZEZvcm1DbGFzcztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gaGFuZGxlclNldHRpbmdzLnBvcHVwQ2xhc3MgPT09IHVuZGVmaW5lZCA/IHRoaXMucG9wdXBDbGFzcyA6IGhhbmRsZXJTZXR0aW5ncy5wb3B1cENsYXNzO1xyXG4gICAgICAgICAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gaGFuZGxlclNldHRpbmdzLmZvY3VzT25GaXJzdElucHV0ID09PSB1bmRlZmluZWQgPyB0aGlzLmZvY3VzT25GaXJzdElucHV0IDogaGFuZGxlclNldHRpbmdzLmZvY3VzT25GaXJzdElucHV0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KHRoaXMudHJpZ2dlckF0dHJpYnV0ZSk7XHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhKCk7XHJcbiAgICAgICAgaWYgKCBPYmplY3Qua2V5cyhhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YSkubGVuZ3RoICE9PSAwICkge1xyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB0aGVtZVZhcnMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiUE9TVFwiLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogYWpheFJlcXVlc3REYXRhLFxyXG4gICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHJlc3BvbnNlICE9IFwibm8gY29udGVudFwiICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9ICQucGFyc2VKU09OKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uZm9ybUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uY29udGVudFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLnBvcHVwLmh0bWwodGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uY29udGVudCk7XHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgJCgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEKS5zdWJtaXQoZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgdmFyIGN1cnJlbnRGb3JtID0gJCh0aGlzKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmZvcm1TdWJtaXNzaW9uKCR0aGlzLCBwb3B1cFR5cGUsIGN1cnJlbnRGb3JtKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZvcm1TdWJtaXNzaW9uID0gZnVuY3Rpb24gKCBwb3B1cEhhbmRsZXIsIGhhbmRsZXJUeXBlLCBmb3JtICkge1xyXG4gICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdKGZvcm0sIHBvcHVwSGFuZGxlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Zvcm1TdWJtaXNzaW9uLWRlZmF1bHQnKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coaGFuZGxlclR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zaG93UG9wdXAgPSBmdW5jdGlvbiAoIHB1c2hlZEJ1dHRvbiwgZGVmZXIgKSB7XHJcbiAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICB2YXIgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgdmFyIHBvcHVwVHlwZSA9IHB1c2hlZEJ1dHRvbi5hdHRyKGF0dHIpO1xyXG4gICAgICAgIHRoaXMuaGlkZVBvcHVwKCk7XHJcblxyXG4gICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5mb3JtSUQgIT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsbFBvcHVwKHBvcHVwVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtc2hvdycsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5wYXJlbnQoKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICBjZW50ZXJWZXJ0aWNhbGx5KHRoaXMucG9wdXApO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZvY3VzT25GaXJzdElucHV0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ3Nob3dQb3B1cCcpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwb3B1cFR5cGUpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5wb3B1cC5wYXJlbnQoKS5jc3MoJ3BhZGRpbmctdG9wJywgMCk7XHJcblxyXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3BvcHVwLWhpZGUnLCBbdGhpcy5wb3B1cF0pO1xyXG5cclxuICAgICAgICB0aGlzLnBvcHVwLnBhcmVudCgpLmhpZGUoKTtcclxuICAgICAgICB0aGlzLnBvcHVwLmh0bWwoJycpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggZWxlbWVudCwgcmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICBpZiAoIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhW3RoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldXSA9IGF0dHJpYnV0ZVZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBpID09IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAtIDEgJiYgcXVhbnRpdHkgPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXF1ZXN0RGF0YTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGFqYXhSZXF1ZXN0RGF0YSA9IHtcclxuICAgICAgICAgICAgYWN0aW9uOiBcImFqYXhHZXRQb3B1cENvbnRlbnRcIixcclxuICAgICAgICAgICAgcG9wdXBSZXF1ZXN0RGF0YToge31cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9ICQoJ1snICsgdGhpcy50cmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0gJCgnWycgKyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcblxyXG4gICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGFqYXhSZXF1ZXN0RGF0YSwgcG9wdXBUcmlnZ2Vycyk7XHJcbiAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEoYWpheFJlcXVlc3REYXRhLCBkZWZlcnJlZFBvcHVwVHJpZ2dlcnMsIHRydWUpO1xyXG5cclxuICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmZpbGxSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggYWpheFJlcXVlc3REYXRhLCBwb3B1cFRyaWdnZXJzLCBkZWZlciApIHtcclxuICAgICAgICBpZiAoIGRlZmVyID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGRlZmVyID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhdHRyID0gIWRlZmVyID8gdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgdmFyIHBvcHVwVHlwZSwgZWxlbWVudDtcclxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBwb3B1cFRyaWdnZXJzLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICBlbGVtZW50ID0gJChwb3B1cFRyaWdnZXJzW2ldKTtcclxuICAgICAgICAgICAgcG9wdXBUeXBlID0gZWxlbWVudC5hdHRyKGF0dHIpO1xyXG4gICAgICAgICAgICBpZiAoICF0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSAmJiBwb3B1cFR5cGUgIT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGFbcG9wdXBUeXBlXSA9IHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhKGVsZW1lbnQsIGFqYXhSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnVwZGF0ZUNvbnRlbnQgPSBmdW5jdGlvbiAoIGNvbnRlbnRJZCwgbmV3RGF0YSApIHtcclxuICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0ZW1wQ29udGVudC5pbm5lckhUTUwgPSB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXS5jb250ZW50O1xyXG4gICAgICAgICAgICB2YXIgdGVtcENvbnRlbnRPYmplY3QgPSAkKHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICQuZWFjaChuZXdEYXRhLCBmdW5jdGlvbiAoIHNlbGVjdG9yLCBjYWxsYmFjayApIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRlbXBDb250ZW50T2JqZWN0LmZpbmQoc2VsZWN0b3IpLCB0ZW1wQ29udGVudE9iamVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudCA9IHRlbXBDb250ZW50LmlubmVySFRNTDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoICQoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT0gMCApIHtcclxuICAgICAgICAgICAgJCgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdfX3dyYXBwZXJcIj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuXCI+PC9kaXY+PGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5wb3B1cCA9ICQoJy4nICsgdGhpcy5wb3B1cENsYXNzKTtcclxuICAgIH07XHJcbn1cclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

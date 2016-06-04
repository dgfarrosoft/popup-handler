function PopupHandler () {
    this.triggerAttribute = 'data-popup';
    this.deferredTriggerAttribute = 'data-deferred-popup';
    this.disabledFormClass = 'js-disabled';
    this.popupClass = 'b-popup';
    this.popupWrapperClass = this.popupClass + '__wrapper';
    this.popupCloseSelector = '[data-popup-close]';
    this.popupContents = {};
    this.popupHandlers = {};
    this.focusOnFirstInput = true;
    this.closeOnWrapperClick = true;

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
            this.popupCloseSelector = handlerSettings.popupCloseSelector === undefined ? this.popupCloseSelector : handlerSettings.popupCloseSelector;
            this.closeOnWrapperClick = handlerSettings.closeOnWrapperClick === undefined ? this.closeOnWrapperClick : handlerSettings.closeOnWrapperClick;
        }

        this.getPopupsContent(this.triggerAttribute);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJwb3B1cC1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gUG9wdXBIYW5kbGVyICgpIHtcclxuICAgIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLXBvcHVwJztcclxuICAgIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtZGVmZXJyZWQtcG9wdXAnO1xyXG4gICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9ICdqcy1kaXNhYmxlZCc7XHJcbiAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICB0aGlzLnBvcHVwV3JhcHBlckNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fd3JhcHBlcic7XHJcbiAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9ICdbZGF0YS1wb3B1cC1jbG9zZV0nO1xyXG4gICAgdGhpcy5wb3B1cENvbnRlbnRzID0ge307XHJcbiAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gdHJ1ZTtcclxuXHJcbiAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIGhhbmRsZXJTZXR0aW5ncyApIHtcclxuICAgICAgICBpZiAoIGhhbmRsZXJTZXR0aW5ncyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSBoYW5kbGVyU2V0dGluZ3MucG9wdXBIYW5kbGVycztcclxuICAgICAgICAgICAgaWYgKCBoYW5kbGVyU2V0dGluZ3MuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IGhhbmRsZXJTZXR0aW5ncy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyQXR0cmlidXRlID0gaGFuZGxlclNldHRpbmdzLnRyaWdnZXJBdHRyaWJ1dGUgPT09IHVuZGVmaW5lZCA/IHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6IGhhbmRsZXJTZXR0aW5ncy50cmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9IGhhbmRsZXJTZXR0aW5ncy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgPT09IHVuZGVmaW5lZCA/IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlIDogaGFuZGxlclNldHRpbmdzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA9IGhhbmRsZXJTZXR0aW5ncy5kaXNhYmxlZEZvcm1DbGFzcyA9PT0gdW5kZWZpbmVkID8gdGhpcy5kaXNhYmxlZEZvcm1DbGFzcyA6IGhhbmRsZXJTZXR0aW5ncy5kaXNhYmxlZEZvcm1DbGFzcztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gaGFuZGxlclNldHRpbmdzLnBvcHVwQ2xhc3MgPT09IHVuZGVmaW5lZCA/IHRoaXMucG9wdXBDbGFzcyA6IGhhbmRsZXJTZXR0aW5ncy5wb3B1cENsYXNzO1xyXG4gICAgICAgICAgICB0aGlzLmZvY3VzT25GaXJzdElucHV0ID0gaGFuZGxlclNldHRpbmdzLmZvY3VzT25GaXJzdElucHV0ID09PSB1bmRlZmluZWQgPyB0aGlzLmZvY3VzT25GaXJzdElucHV0IDogaGFuZGxlclNldHRpbmdzLmZvY3VzT25GaXJzdElucHV0O1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvciA9IGhhbmRsZXJTZXR0aW5ncy5wb3B1cENsb3NlU2VsZWN0b3IgPT09IHVuZGVmaW5lZCA/IHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yIDogaGFuZGxlclNldHRpbmdzLnBvcHVwQ2xvc2VTZWxlY3RvcjtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrID0gaGFuZGxlclNldHRpbmdzLmNsb3NlT25XcmFwcGVyQ2xpY2sgPT09IHVuZGVmaW5lZCA/IHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA6IGhhbmRsZXJTZXR0aW5ncy5jbG9zZU9uV3JhcHBlckNsaWNrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KHRoaXMudHJpZ2dlckF0dHJpYnV0ZSk7XHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0gdGhpcy5nZXRBamF4UmVxdWVzdERhdGEoKTtcclxuICAgICAgICBpZiAoIE9iamVjdC5rZXlzKGFqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhKS5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHRoZW1lVmFycy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJQT1NUXCIsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBhamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggcmVzcG9uc2UgIT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gJC5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgcG9wdXBUeXBlIGluIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1JRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5mb3JtSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudDogcmVzcG9uc2VbcG9wdXBUeXBlXS5jb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5maWxsUG9wdXAgPSBmdW5jdGlvbiAoIHBvcHVwVHlwZSApIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQoKTtcclxuICAgICAgICAkKCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5mb3JtSUQpLnN1Ym1pdChmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSAkKHRoaXMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCAhY3VycmVudEZvcm0uaGFzQ2xhc3MoJHRoaXMuZGlzYWJsZWRGb3JtQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIHBvcHVwVHlwZSwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZm9ybVN1Ym1pc3Npb24gPSBmdW5jdGlvbiAoIHBvcHVwSGFuZGxlciwgaGFuZGxlclR5cGUsIGZvcm0gKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBIYW5kbGVyc1toYW5kbGVyVHlwZV0oZm9ybSwgcG9wdXBIYW5kbGVyKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZm9ybVN1Ym1pc3Npb24tZGVmYXVsdCcpO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhoYW5kbGVyVHlwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLnNob3dQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlLCBkZWZlciApIHtcclxuICAgICAgICBpZiAoIHR5cGVvZiBwb3B1cFR5cGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICBkZWZlciA9IGRlZmVyID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGRlZmVyO1xyXG4gICAgICAgICAgICB2YXIgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKGF0dHIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmhpZGVQb3B1cCgpO1xyXG5cclxuICAgICAgICBpZiAoIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEICE9IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3BvcHVwLXNob3cnLCBbdGhpcy5wb3B1cF0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAucGFyZW50KCkuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgY2VudGVyVmVydGljYWxseSh0aGlzLnBvcHVwKTtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5mb2N1c09uRmlyc3RJbnB1dCApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwLmZpbmQoJ2lucHV0JykuZXEoMCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocG9wdXBUeXBlKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaGlkZVBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMucG9wdXAucGFyZW50KCkuY3NzKCdwYWRkaW5nLXRvcCcsIDApO1xyXG5cclxuICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1oaWRlJywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3B1cC5wYXJlbnQoKS5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy5wb3B1cC5odG1sKCcnKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGVsZW1lbnQsIHJlcXVlc3REYXRhICkge1xyXG4gICAgICAgIGlmICggcmVxdWVzdERhdGEgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGF0dHJpYnV0ZVZhbHVlLCBxdWFudGl0eSA9IDA7XHJcbiAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gZWxlbWVudC5hdHRyKHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzW2ldKTtcclxuICAgICAgICAgICAgICAgIGlmICggYXR0cmlidXRlVmFsdWUgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YVt0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXV0gPSBhdHRyaWJ1dGVWYWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBxdWFudGl0eSsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmICggaSA9PSB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggLSAxICYmIHF1YW50aXR5ID09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7XHJcbiAgICAgICAgICAgIGFjdGlvbjogXCJhamF4R2V0UG9wdXBDb250ZW50XCIsXHJcbiAgICAgICAgICAgIHBvcHVwUmVxdWVzdERhdGE6IHt9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFyIHBvcHVwVHJpZ2dlcnMgPSAkKCdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcbiAgICAgICAgdmFyIGRlZmVycmVkUG9wdXBUcmlnZ2VycyA9ICQoJ1snICsgdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG5cclxuICAgICAgICBhamF4UmVxdWVzdERhdGEgPSB0aGlzLmZpbGxSZXF1ZXN0RGF0YShhamF4UmVxdWVzdERhdGEsIHBvcHVwVHJpZ2dlcnMpO1xyXG4gICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXJyZWRQb3B1cFRyaWdnZXJzLCB0cnVlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIGFqYXhSZXF1ZXN0RGF0YSwgcG9wdXBUcmlnZ2VycywgZGVmZXIgKSB7XHJcbiAgICAgICAgaWYgKCBkZWZlciA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICBkZWZlciA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYXR0ciA9ICFkZWZlciA/IHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlO1xyXG4gICAgICAgIHZhciBwb3B1cFR5cGUsIGVsZW1lbnQ7XHJcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgZWxlbWVudCA9ICQocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gJiYgcG9wdXBUeXBlICE9IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhW3BvcHVwVHlwZV0gPSB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YShlbGVtZW50LCBhamF4UmVxdWVzdERhdGFbcG9wdXBUeXBlXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICB2YXIgdGVtcENvbnRlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0gJCh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAkLmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh0ZW1wQ29udGVudE9iamVjdC5maW5kKHNlbGVjdG9yKSwgdGVtcENvbnRlbnRPYmplY3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ25vIGNvbnRlbnQnKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuaW5qZWN0UG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKCAkKCcuJyArIHRoaXMucG9wdXBDbGFzcykubGVuZ3RoID09IDAgKSB7XHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQoJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzICsgJ1wiPjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnX19jbG9zZS1idG5cIj48L2Rpdj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnBvcHVwID0gJCgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgfTtcclxuXHJcbiAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICR0aGlzLnNob3dQb3B1cCgkKHRoaXMpLmF0dHIoJHRoaXMudHJpZ2dlckF0dHJpYnV0ZSkpO1xyXG5cclxuICAgICAgICAgICAgJCgkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3IpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICggJHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayApIHtcclxuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLmNsaWNrKGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkKGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoJHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

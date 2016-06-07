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
                    action: "ajaxGetPopupContent",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJwb3B1cC1oYW5kbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiICAgIGZ1bmN0aW9uIFBvcHVwSGFuZGxlciAoKSB7XHJcbiAgICAgICAgaWYgKCB0aGlzIGluc3RhbmNlb2YgUG9wdXBIYW5kbGVyICkge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgPSAnZGF0YS1wb3B1cCc7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlID0gJ2RhdGEtZGVmZXJyZWQtcG9wdXAnO1xyXG4gICAgICAgICAgICB0aGlzLmRpc2FibGVkRm9ybUNsYXNzID0gJ2pzLWRpc2FibGVkJztcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsYXNzID0gJ2ItcG9wdXAnO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlckNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fd3JhcHBlcic7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yID0gJ1tkYXRhLXBvcHVwLWNsb3NlXSc7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgICAgICAgICAgdGhpcy5mb2N1c09uRmlyc3RJbnB1dCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuYWpheFVybCA9ICcnO1xyXG4gICAgICAgICAgICB0aGlzLmFqYXhSZXF1ZXN0RGF0YSA9IHt9O1xyXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVkU2hvdyA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBTaG93U3BlZWQgPSAyMDA7XHJcbiAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgPSAxMDAwO1xyXG4gICAgICAgICAgICB0aGlzLmRhcmtCYWNrZ3JvdW5kID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBTdHlsZXMgPSAnYmFja2dyb3VuZC1jb2xvcjp0cmFuc3BhcmVudDt0ZXh0LWFsaWduOmNlbnRlcjtwb3NpdGlvbjpmaXhlZDt6LWluZGV4OjEwMDtkaXNwbGF5Om5vbmU7aGVpZ2h0OiAxMDAlO3dpZHRoOiAxMDAlO2xlZnQ6MDt0b3A6MDsnO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pbml0ID0gZnVuY3Rpb24gKCBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgIGlmICggc2V0dGluZ3MgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgc2V0dGluZyBpbiBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1tzZXR0aW5nXSA9IHNldHRpbmdzW3NldHRpbmddO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzKCk7XHJcblxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHZhciBuZXdBamF4UmVxdWVzdERhdGEgPSB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSgpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGlzUmVxdWVzdHNTYW1lID0gdGhpcy5pc0VxdWFsKG5ld0FqYXhSZXF1ZXN0RGF0YSwgdGhpcy5hamF4UmVxdWVzdERhdGEpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSBuZXdBamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKG5ld0FqYXhSZXF1ZXN0RGF0YS5wb3B1cFJlcXVlc3REYXRhKS5sZW5ndGggIT09IDAgJiYgdGhpcy5hamF4VXJsICE9ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkuYWpheCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdGhpcy5hamF4VXJsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogbmV3QWpheFJlcXVlc3REYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPSBcIm5vIGNvbnRlbnRcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGpRdWVyeS5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIHZhciBwb3B1cFR5cGUgaW4gcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1JRDogcmVzcG9uc2VbcG9wdXBUeXBlXS5mb3JtSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoIHJlc3BvbnNlICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGxQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlICkge1xyXG4gICAgICAgICAgICAgICAgdmFyICR0aGlzID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0UG9wdXBzQ29udGVudCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwSGFuZGxlcnNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB0aGlzLnBvcHVwSGFuZGxlcnNbcG9wdXBUeXBlXSA9PSBcImZ1bmN0aW9uXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCdmb3JtIycgKyB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5mb3JtSUQpLnN1Ym1pdChmdW5jdGlvbiAoIGV2ZW50ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSBqUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFjdXJyZW50Rm9ybS5oYXNDbGFzcygkdGhpcy5kaXNhYmxlZEZvcm1DbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5mb3JtU3VibWlzc2lvbigkdGhpcywgcG9wdXBUeXBlLCBjdXJyZW50Rm9ybSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZm9ybVN1Ym1pc3Npb24gPSBmdW5jdGlvbiAoIHBvcHVwSGFuZGxlciwgaGFuZGxlclR5cGUsIGZvcm0gKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnNbaGFuZGxlclR5cGVdKGZvcm0sIHBvcHVwSGFuZGxlcik7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNob3dQb3B1cCA9IGZ1bmN0aW9uICggcG9wdXBUeXBlLCBkZWZlciApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIHBvcHVwVHlwZSAhPT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0ciA9IGRlZmVyID8gdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLnRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9wdXBUeXBlID0gcG9wdXBUeXBlLmF0dHIoYXR0cik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5oaWRlUG9wdXAodHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0uZm9ybUlEICE9IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsbFBvcHVwKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkudHJpZ2dlcigncG9wdXAtc2hvdycsIFt0aGlzLnBvcHVwXSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQgIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0aGlzLmRhcmtCYWNrZ3JvdW5kICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsIFwicmdiYSgyMDcsIDIwNywgMjA3LCAuNilcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCB0aGlzLmZvY3VzT25GaXJzdElucHV0ICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cC5maW5kKCdpbnB1dCcpLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5oaWRlUG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJy13ZWJraXQtdHJhbnNpdGlvbicsICdub25lJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygncGFkZGluZy10b3AnLCAwKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRQb3B1cFN0eWxlcygpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCAhdGhpcy5wb3B1cFZpc2libGUgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgXCJ0cmFuc3BhcmVudFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldFNpbmdsZUFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICggZWxlbWVudCwgcmVxdWVzdERhdGEgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlcXVlc3REYXRhID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBhdHRyaWJ1dGVWYWx1ZSwgcXVhbnRpdHkgPSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggIT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlVmFsdWUgPSBlbGVtZW50LmF0dHIodGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGF0dHJpYnV0ZVZhbHVlICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHJlcXVlc3REYXRhID09IDAgPyB7fSA6IHJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBxdWFudGl0eSsrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT0gdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXMubGVuZ3RoIC0gMSAmJiBxdWFudGl0eSA9PSAwICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdERhdGE7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBhamF4UmVxdWVzdERhdGEgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBcImFqYXhHZXRQb3B1cENvbnRlbnRcIixcclxuICAgICAgICAgICAgICAgICAgICBwb3B1cFJlcXVlc3REYXRhOiB7fVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGRlZmVycmVkUG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSArICddJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhID0gdGhpcy5maWxsUmVxdWVzdERhdGEocG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhKTtcclxuICAgICAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGRlZmVycmVkUG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIGRlZmVyID09PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gIWRlZmVyID8gdGhpcy50cmlnZ2VyQXR0cmlidXRlIDogdGhpcy5kZWZlcnJlZFRyaWdnZXJBdHRyaWJ1dGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgcG9wdXBUeXBlLCBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50ID0galF1ZXJ5KHBvcHVwVHJpZ2dlcnNbaV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IGVsZW1lbnQuYXR0cihhdHRyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhamF4UmVxdWVzdERhdGEucG9wdXBSZXF1ZXN0RGF0YVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhLnBvcHVwUmVxdWVzdERhdGFbcG9wdXBUeXBlXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFqYXhSZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udGVudCA9IGZ1bmN0aW9uICggY29udGVudElkLCBuZXdEYXRhICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLnBvcHVwQ29udGVudHNbY29udGVudElkXSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRlbXBDb250ZW50LmlubmVySFRNTCA9IHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXBDb250ZW50T2JqZWN0ID0galF1ZXJ5KHRlbXBDb250ZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRlbXBDb250ZW50T2JqZWN0LmZpbmQoc2VsZWN0b3IpLCB0ZW1wQ29udGVudE9iamVjdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBjb250ZW50Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluamVjdFBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCBqUXVlcnkoJy4nICsgdGhpcy5wb3B1cENsYXNzKS5sZW5ndGggPT0gMCApIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5hcHBlbmQoJzxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwV3JhcHBlckNsYXNzICsgJ1wiPjxkaXYgY2xhc3MgPSBcIicgKyB0aGlzLnBvcHVwQ2xhc3MgKyAnX19jbG9zZS1idG5cIj48L2Rpdj48ZGl2IGNsYXNzID0gXCInICsgdGhpcy5wb3B1cENsYXNzICsgJ1wiPjwvZGl2PjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cCA9IGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIgPSB0aGlzLnBvcHVwLmNsb3Nlc3QoJy4nICsgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5zaG93UG9wdXAoalF1ZXJ5KHRoaXMpLmF0dHIoJHRoaXMudHJpZ2dlckF0dHJpYnV0ZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJHRoaXMucG9wdXBDbG9zZVNlbGVjdG9yKS5jbGljayhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoICR0aGlzLmNsb3NlT25XcmFwcGVyQ2xpY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggalF1ZXJ5KGV2ZW50LnRhcmdldCkuaGFzQ2xhc3MoJHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBwYXJlbnQgPSB0aGlzLnBvcHVwV3JhcHBlcjtcclxuICAgICAgICAgICAgICAgIHZhciBwYWRkaW5nID0gKHBhcmVudC5vdXRlckhlaWdodCgpIC0gdGhpcy5wb3B1cC5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQuY3NzKCdwYWRkaW5nLXRvcCcsIHBhZGRpbmcpO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pc0VxdWFsID0gZnVuY3Rpb24gKCBmaXJzdE9iamVjdCwgc2Vjb25kT2JqZWN0ICkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGZpcnN0T2JqZWN0KSA9PT0gSlNPTi5zdHJpbmdpZnkoc2Vjb25kT2JqZWN0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHJhbnNpdGlvbiA9IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmF0dHIoJ3N0eWxlJywgdGhpcy5wb3B1cFN0eWxlcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLmFuaW1hdGVkU2hvdyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJwYWRkaW5nIFwiICsgdGhpcy5wb3B1cFNob3dTcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb24gKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwiYmFja2dyb3VuZC1jb2xvciBcIiArIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uID0gdHJhbnNpdGlvbi5qb2luKCcsJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHRyYW5zaXRpb24gIT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCB0cmFuc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcigpO1xyXG4gICAgICAgIH1cclxuICAgIH0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

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

            this.hidePopup();

            if ( this.popupContents[popupType] !== undefined ) {
                if ( this.popupContents[popupType].formID != "" ) {
                    this.fillPopup(popupType);
                    this.popupVisible = true;

                    $(document).trigger('popup-show', [this.popup]);

                    this.popupWrapper.show();
                    this.centerVertically();
                    if ( this.darkBackground ) {
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
            if ( this.animatedShow ) {
                transition.push("padding " + this.popupShowSpeed / 1000 + "s");
            }
            if ( this.backgroundTransition ) {
                transition.push("background-color " + this.backgroundTransitionSpeed / 1000 + "s");
            }
            if ( transition != "" ) {
                this.popupStyles += "transition: " + transition + ";";
            }
            this.popupWrapper.attr('style', this.popupStyles);
        }

    } else {
        return new PopupHandler();
    }
}
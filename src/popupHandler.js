function PopupHandler () {
    this.triggerAttribute = 'data-popup';
    this.deferredTriggerAttribute = 'data-deferred-popup';
    this.disabledFormClass = 'js-disabled';
    this.popupSelector = '.b-popup';
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
            this.popupSelector = handlerSettings.popupSelector === undefined ? this.popupSelector : handlerSettings.popupSelector;
            this.focusOnFirstInput = handlerSettings.focusOnFirstInput === undefined ? this.focusOnFirstInput : handlerSettings.focusOnFirstInput;
        }
        this.popup = $(this.popupSelector);

        this.getPopupsContent(this.triggerAttribute);
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
                $('body').addClass('element--overflow-hidden');
                $('.b-site-content').addClass('element--unfocused');

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
        $('body').removeClass('element--overflow-hidden');
        $('.b-site-content').removeClass('element--unfocused');

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
}

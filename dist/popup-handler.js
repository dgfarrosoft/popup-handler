function PopupHandler () {
    if ( this instanceof PopupHandler ) {
        this.triggerAttribute = 'data-popup';
        this.deferredTriggerAttribute = 'data-deferred-popup';
        this.contentAttribute = 'data-content';
        this.additionalDataAttributes = [];
        this.getFromPage = [];
        this.popupClass = 'b-popup';
        this.popupWrapperClass = this.popupClass + '__wrapper';
        this.popupCloseButtonClass = this.popupClass + '__close-btn';
        this.popupCloseSelectors = ['[data-popup-close]', '.' + this.popupCloseButtonClass];
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
        this.closeButtonSize = '40px';
        this.closeButtonColor = "#000";
        this.popupStyles = 'background:transparent;text-align:center;position:fixed;z-index:100;display:none;height: 100%;width: 100%;left:0;top:0;';
        this.popupCloseImage = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 371.23 371.23" style="enable-background:new 0 0 371.23 371.23;" xml:space="preserve"><polygon points="371.23,21.213 350.018,0 185.615,164.402 21.213,0 0,21.213 164.402,185.615 0,350.018 21.213,371.23 185.615,206.828 350.018,371.23 371.23,350.018 206.828,185.615 "/><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>';
        this.popupCloseBtnStyles =
            'width: ' + this.closeButtonSize + ';' +
            'height: ' + this.closeButtonSize + ';' +
            'position: absolute;' +
            'right: 2%;' +
            'top: 2%;' +
            'cursor: pointer;';

        this.init = function ( settings ) {
            if ( settings !== undefined ) {
                for ( var setting in settings ) {
                    this[setting] = settings[setting];
                }
            }
            this.getPopupsContent();
            this.injectPopup();
            this.popupCloseBtn = $('.' + this.popupCloseButtonClass);
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
            var popupCloseBtn = '<div class = "' + this.popupCloseButtonClass + '">' + this.popupCloseImage + '</div>';
            if ( jQuery('.' + this.popupClass).length === 0 ) {
                jQuery('body').append('<div class = "' + this.popupWrapperClass + '">' + popupCloseBtn + '<div class = "' + this.popupClass + '"></div></div>');
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
            this.popupCloseBtn.attr('style', this.popupCloseBtnStyles);
            this.popupCloseBtn.css('fill', this.closeButtonColor);

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvcHVwSGFuZGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6InBvcHVwLWhhbmRsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJmdW5jdGlvbiBQb3B1cEhhbmRsZXIgKCkge1xyXG4gICAgaWYgKCB0aGlzIGluc3RhbmNlb2YgUG9wdXBIYW5kbGVyICkge1xyXG4gICAgICAgIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLXBvcHVwJztcclxuICAgICAgICB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA9ICdkYXRhLWRlZmVycmVkLXBvcHVwJztcclxuICAgICAgICB0aGlzLmNvbnRlbnRBdHRyaWJ1dGUgPSAnZGF0YS1jb250ZW50JztcclxuICAgICAgICB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuZ2V0RnJvbVBhZ2UgPSBbXTtcclxuICAgICAgICB0aGlzLnBvcHVwQ2xhc3MgPSAnYi1wb3B1cCc7XHJcbiAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXJDbGFzcyA9IHRoaXMucG9wdXBDbGFzcyArICdfX3dyYXBwZXInO1xyXG4gICAgICAgIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzID0gdGhpcy5wb3B1cENsYXNzICsgJ19fY2xvc2UtYnRuJztcclxuICAgICAgICB0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnMgPSBbJ1tkYXRhLXBvcHVwLWNsb3NlXScsICcuJyArIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzXTtcclxuICAgICAgICB0aGlzLmRpc2FibGVkRm9ybUNsYXNzID0gJ2pzLWRpc2FibGVkJztcclxuICAgICAgICB0aGlzLnBvcHVwSGFuZGxlcnMgPSB7fTtcclxuICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMucG9wdXBDb250ZW50cyA9IHt9O1xyXG4gICAgICAgIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuY2xvc2VPbldyYXBwZXJDbGljayA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5hamF4VXJsID0gJyc7XHJcbiAgICAgICAgdGhpcy5hamF4UmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICB0aGlzLmFuaW1hdGVkU2hvdyA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5wb3B1cFNob3dTcGVlZCA9IDIwMDtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uU3BlZWQgPSAxMDAwO1xyXG4gICAgICAgIHRoaXMuZGFya0JhY2tncm91bmQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmFqYXhBY3Rpb24gPSAnJztcclxuICAgICAgICB0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZSA9ICdwb3B1cFJlcXVlc3REYXRhJztcclxuICAgICAgICB0aGlzLmN1c3RvbVdyYXBwZXJCYWNrZ3JvdW5kID0gJyc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvblNpemUgPSAnNDBweCc7XHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yID0gXCIjMDAwXCI7XHJcbiAgICAgICAgdGhpcy5wb3B1cFN0eWxlcyA9ICdiYWNrZ3JvdW5kOnRyYW5zcGFyZW50O3RleHQtYWxpZ246Y2VudGVyO3Bvc2l0aW9uOmZpeGVkO3otaW5kZXg6MTAwO2Rpc3BsYXk6bm9uZTtoZWlnaHQ6IDEwMCU7d2lkdGg6IDEwMCU7bGVmdDowO3RvcDowOyc7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlSW1hZ2UgPSAnPHN2ZyB2ZXJzaW9uPVwiMS4xXCIgaWQ9XCJMYXllcl8xXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHg9XCIwcHhcIiB5PVwiMHB4XCIgdmlld0JveD1cIjAgMCAzNzEuMjMgMzcxLjIzXCIgc3R5bGU9XCJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDM3MS4yMyAzNzEuMjM7XCIgeG1sOnNwYWNlPVwicHJlc2VydmVcIj48cG9seWdvbiBwb2ludHM9XCIzNzEuMjMsMjEuMjEzIDM1MC4wMTgsMCAxODUuNjE1LDE2NC40MDIgMjEuMjEzLDAgMCwyMS4yMTMgMTY0LjQwMiwxODUuNjE1IDAsMzUwLjAxOCAyMS4yMTMsMzcxLjIzIDE4NS42MTUsMjA2LjgyOCAzNTAuMDE4LDM3MS4yMyAzNzEuMjMsMzUwLjAxOCAyMDYuODI4LDE4NS42MTUgXCIvPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPic7XHJcbiAgICAgICAgdGhpcy5wb3B1cENsb3NlQnRuU3R5bGVzID1cclxuICAgICAgICAgICAgJ3dpZHRoOiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAnaGVpZ2h0OiAnICsgdGhpcy5jbG9zZUJ1dHRvblNpemUgKyAnOycgK1xyXG4gICAgICAgICAgICAncG9zaXRpb246IGFic29sdXRlOycgK1xyXG4gICAgICAgICAgICAncmlnaHQ6IDIlOycgK1xyXG4gICAgICAgICAgICAndG9wOiAyJTsnICtcclxuICAgICAgICAgICAgJ2N1cnNvcjogcG9pbnRlcjsnO1xyXG5cclxuICAgICAgICB0aGlzLmluaXQgPSBmdW5jdGlvbiAoIHNldHRpbmdzICkge1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzICE9PSB1bmRlZmluZWQgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgc2V0dGluZyBpbiBzZXR0aW5ncyApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzW3NldHRpbmddID0gc2V0dGluZ3Nbc2V0dGluZ107XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5qZWN0UG9wdXAoKTtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cENsb3NlQnRuID0gJCgnLicgKyB0aGlzLnBvcHVwQ2xvc2VCdXR0b25DbGFzcyk7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0RXZlbnRMaXN0ZW5lcnMoKTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldFBvcHVwc0NvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHZhciBuZXdBamF4UmVxdWVzdERhdGEgPSB0aGlzLmdldEFqYXhSZXF1ZXN0RGF0YSgpO1xyXG4gICAgICAgICAgICB2YXIgaXNSZXF1ZXN0c1NhbWUgPSB0aGlzLmlzRXF1YWwobmV3QWpheFJlcXVlc3REYXRhLCB0aGlzLmFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIHRoaXMuYWpheFJlcXVlc3REYXRhID0gbmV3QWpheFJlcXVlc3REYXRhO1xyXG4gICAgICAgICAgICBpZiAoIE9iamVjdC5rZXlzKG5ld0FqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0pLmxlbmd0aCAhPT0gMCAmJiB0aGlzLmFqYXhVcmwgIT09ICcnICYmICFpc1JlcXVlc3RzU2FtZSApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeS5hamF4KHtcclxuICAgICAgICAgICAgICAgICAgICB1cmw6IHRoaXMuYWpheFVybCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIlBPU1RcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXdBamF4UmVxdWVzdERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKCByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXNwb25zZSAhPT0gXCJubyBjb250ZW50XCIgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IGpRdWVyeS5wYXJzZUpTT04ocmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggdmFyIHBvcHVwVHlwZSBpbiByZXNwb25zZSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvcHVwSUQ6IHJlc3BvbnNlW3BvcHVwVHlwZV0uZm9ybUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiByZXNwb25zZVtwb3B1cFR5cGVdLmNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEID0gJHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQgPT09IHVuZGVmaW5lZCA/IHBvcHVwVHlwZSA6ICR0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5wb3B1cElEO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICggcmVzcG9uc2UgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsbFBvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUgKSB7XHJcbiAgICAgICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCh0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXS5jb250ZW50KTtcclxuICAgICAgICAgICAgdGhpcy5nZXRQb3B1cHNDb250ZW50KCk7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5wb3B1cEhhbmRsZXJzW3BvcHVwVHlwZV0gPT09IFwiZnVuY3Rpb25cIiAmJiBqUXVlcnkoJ2Zvcm0jJyArIHRoaXMucG9wdXBDb250ZW50c1twb3B1cFR5cGVdLnBvcHVwSUQpLmxlbmd0aCAhPT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnZm9ybSMnICsgdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCkuc3VibWl0KGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudEZvcm0gPSBqUXVlcnkodGhpcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICggIWN1cnJlbnRGb3JtLmhhc0NsYXNzKCR0aGlzLmRpc2FibGVkRm9ybUNsYXNzKSApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJHRoaXMuZm9ybVN1Ym1pc3Npb24oJHRoaXMsIHBvcHVwVHlwZSwgY3VycmVudEZvcm0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5mb3JtU3VibWlzc2lvbiA9IGZ1bmN0aW9uICggcG9wdXBIYW5kbGVyLCBoYW5kbGVyVHlwZSwgZm9ybSApIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cEhhbmRsZXJzW2hhbmRsZXJUeXBlXShmb3JtLCBwb3B1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1BvcHVwID0gZnVuY3Rpb24gKCBwb3B1cFR5cGUsIGRlZmVyICkge1xyXG4gICAgICAgICAgICBpZiAoIHR5cGVvZiBwb3B1cFR5cGUgIT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgZGVmZXIgPSBkZWZlciA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBkZWZlcjtcclxuICAgICAgICAgICAgICAgIHZhciBhdHRyID0gZGVmZXIgPyB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZSA6IHRoaXMudHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgICAgIHBvcHVwVHlwZSA9IHBvcHVwVHlwZS5hdHRyKGF0dHIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmhpZGVQb3B1cCh0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW3BvcHVwVHlwZV0ucG9wdXBJRCAhPT0gXCJcIiApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGxQb3B1cChwb3B1cFR5cGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBWaXNpYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS50cmlnZ2VyKCdwb3B1cC1zaG93JywgW3RoaXMucG9wdXBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2VudGVyVmVydGljYWxseSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICggdGhpcy5jdXN0b21XcmFwcGVyQmFja2dyb3VuZCAhPT0gJycgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyLmNzcygnYmFja2dyb3VuZCcsIHRoaXMuY3VzdG9tV3JhcHBlckJhY2tncm91bmQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggdGhpcy5kYXJrQmFja2dyb3VuZCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJyZ2JhKDEsIDEsIDEsIC43KVwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ2JhY2tncm91bmQnLCBcInJnYmEoMjA3LCAyMDcsIDIwNywgLjYpXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIHRoaXMuZm9jdXNPbkZpcnN0SW5wdXQgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9wdXAuZmluZCgnaW5wdXQnKS5lcSgwKS5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaG93UG9wdXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHBvcHVwVHlwZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCctd2Via2l0LXRyYW5zaXRpb24nLCAnbm9uZScpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdwYWRkaW5nLXRvcCcsIDApO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5oaWRlKCk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAuaHRtbCgnJyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNldFBvcHVwU3R5bGVzKCk7XHJcbiAgICAgICAgICAgIGlmICggIXRoaXMucG9wdXBWaXNpYmxlICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wb3B1cFdyYXBwZXIuY3NzKCdiYWNrZ3JvdW5kJywgXCJ0cmFuc3BhcmVudFwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwVmlzaWJsZSA9IGZhbHNlO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0U2luZ2xlQWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCBlbGVtZW50LCByZXF1ZXN0RGF0YSApIHtcclxuICAgICAgICAgICAgaWYgKCByZXF1ZXN0RGF0YSA9PT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdERhdGEgPSB7fTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgYXR0cmlidXRlVmFsdWUsIHF1YW50aXR5ID0gMDtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGggIT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCB0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlcy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVWYWx1ZSA9IGVsZW1lbnQuYXR0cih0aGlzLmFkZGl0aW9uYWxEYXRhQXR0cmlidXRlc1tpXSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhdHRyaWJ1dGVWYWx1ZSAhPT0gdW5kZWZpbmVkICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IHJlcXVlc3REYXRhID09PSAwID8ge30gOiByZXF1ZXN0RGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdERhdGFbdGhpcy5hZGRpdGlvbmFsRGF0YUF0dHJpYnV0ZXNbaV1dID0gYXR0cmlidXRlVmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1YW50aXR5Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIGkgPT09IHRoaXMuYWRkaXRpb25hbERhdGFBdHRyaWJ1dGVzLmxlbmd0aCAtIDEgJiYgcXVhbnRpdHkgPT09IDAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3REYXRhID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0RGF0YSA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3REYXRhO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0QWpheFJlcXVlc3REYXRhID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgYWpheFJlcXVlc3REYXRhID0ge307XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YVt0aGlzLmFqYXhEYXRhT2JqZWN0TmFtZV0gPSB7fTtcclxuICAgICAgICAgICAgaWYgKCB0aGlzLmFqYXhBY3Rpb24gIT09ICcnICkge1xyXG4gICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhLmFjdGlvbiA9IHRoaXMuYWpheEFjdGlvbjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgcG9wdXBUcmlnZ2VycyA9IGpRdWVyeSgnWycgKyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgKyAnXScpO1xyXG4gICAgICAgICAgICB2YXIgZGVmZXJyZWRQb3B1cFRyaWdnZXJzID0galF1ZXJ5KCdbJyArIHRoaXMuZGVmZXJyZWRUcmlnZ2VyQXR0cmlidXRlICsgJ10nKTtcclxuXHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSk7XHJcbiAgICAgICAgICAgIGFqYXhSZXF1ZXN0RGF0YSA9IHRoaXMuZmlsbFJlcXVlc3REYXRhKGRlZmVycmVkUG9wdXBUcmlnZ2VycywgYWpheFJlcXVlc3REYXRhLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5maWxsUmVxdWVzdERhdGEgPSBmdW5jdGlvbiAoIHBvcHVwVHJpZ2dlcnMsIGFqYXhSZXF1ZXN0RGF0YSwgZGVmZXIgKSB7XHJcbiAgICAgICAgICAgIGlmICggZGVmZXIgPT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIGRlZmVyID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGF0dHIgPSAhZGVmZXIgPyB0aGlzLnRyaWdnZXJBdHRyaWJ1dGUgOiB0aGlzLmRlZmVycmVkVHJpZ2dlckF0dHJpYnV0ZTtcclxuICAgICAgICAgICAgdmFyIHBvcHVwVHlwZSwgZWxlbWVudDtcclxuICAgICAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcG9wdXBUcmlnZ2Vycy5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQgPSBqUXVlcnkocG9wdXBUcmlnZ2Vyc1tpXSk7XHJcbiAgICAgICAgICAgICAgICBwb3B1cFR5cGUgPSBlbGVtZW50LmF0dHIoYXR0cik7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCBwb3B1cFR5cGUgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldEZyb21QYWdlLmluZGV4T2YocG9wdXBUeXBlKSA9PT0gLTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdID0gdGhpcy5nZXRTaW5nbGVBamF4UmVxdWVzdERhdGEoZWxlbWVudCwgYWpheFJlcXVlc3REYXRhW3RoaXMuYWpheERhdGFPYmplY3ROYW1lXVtwb3B1cFR5cGVdKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHRoaXMuZ2V0RnJvbVBhZ2UuaW5kZXhPZihwb3B1cFR5cGUpICE9PSAtMSApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcHVwQ29udGVudHNbcG9wdXBUeXBlXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9wdXBJRDogcG9wdXBUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBqUXVlcnkoJ1snICsgdGhpcy5jb250ZW50QXR0cmlidXRlICsgJz0nICsgcG9wdXBUeXBlICsgJ10nKS5odG1sKClcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBhamF4UmVxdWVzdERhdGE7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDb250ZW50ID0gZnVuY3Rpb24gKCBjb250ZW50SWQsIG5ld0RhdGEgKSB7XHJcbiAgICAgICAgICAgIGlmICggdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0gIT09IHVuZGVmaW5lZCApIHtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICAgICAgdGVtcENvbnRlbnQuaW5uZXJIVE1MID0gdGhpcy5wb3B1cENvbnRlbnRzW2NvbnRlbnRJZF0uY29udGVudDtcclxuICAgICAgICAgICAgICAgIHZhciB0ZW1wQ29udGVudE9iamVjdCA9IGpRdWVyeSh0ZW1wQ29udGVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5LmVhY2gobmV3RGF0YSwgZnVuY3Rpb24gKCBzZWxlY3RvciwgY2FsbGJhY2sgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sodGVtcENvbnRlbnRPYmplY3QuZmluZChzZWxlY3RvciksIHRlbXBDb250ZW50T2JqZWN0KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucG9wdXBDb250ZW50c1tjb250ZW50SWRdLmNvbnRlbnQgPSB0ZW1wQ29udGVudC5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnbm8gY29udGVudCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pbmplY3RQb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgdmFyIHBvcHVwQ2xvc2VCdG4gPSAnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbG9zZUJ1dHRvbkNsYXNzICsgJ1wiPicgKyB0aGlzLnBvcHVwQ2xvc2VJbWFnZSArICc8L2Rpdj4nO1xyXG4gICAgICAgICAgICBpZiAoIGpRdWVyeSgnLicgKyB0aGlzLnBvcHVwQ2xhc3MpLmxlbmd0aCA9PT0gMCApIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnYm9keScpLmFwcGVuZCgnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MgKyAnXCI+JyArIHBvcHVwQ2xvc2VCdG4gKyAnPGRpdiBjbGFzcyA9IFwiJyArIHRoaXMucG9wdXBDbGFzcyArICdcIj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwID0galF1ZXJ5KCcuJyArIHRoaXMucG9wdXBDbGFzcyk7XHJcbiAgICAgICAgICAgIHRoaXMucG9wdXBXcmFwcGVyID0gdGhpcy5wb3B1cC5jbG9zZXN0KCcuJyArIHRoaXMucG9wdXBXcmFwcGVyQ2xhc3MpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIgJHRoaXMgPSB0aGlzO1xyXG4gICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbJyArIHRoaXMudHJpZ2dlckF0dHJpYnV0ZSArICddJywgZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJHRoaXMuc2hvd1BvcHVwKGpRdWVyeSh0aGlzKS5hdHRyKCR0aGlzLnRyaWdnZXJBdHRyaWJ1dGUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIHR5cGVvZiAkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzID09PSAnc3RyaW5nJyApIHtcclxuICAgICAgICAgICAgICAgICAgICAkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzID0gWyR0aGlzLnBvcHVwQ2xvc2VTZWxlY3RvcnNdO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGpRdWVyeSgkdGhpcy5wb3B1cENsb3NlU2VsZWN0b3JzLmpvaW4oJywnKSkuY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICR0aGlzLmhpZGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCAkdGhpcy5jbG9zZU9uV3JhcHBlckNsaWNrICkge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkuY2xpY2soZnVuY3Rpb24gKCBldmVudCApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBqUXVlcnkoZXZlbnQudGFyZ2V0KS5oYXNDbGFzcygkdGhpcy5wb3B1cFdyYXBwZXJDbGFzcykgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGhpcy5oaWRlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmNlbnRlclZlcnRpY2FsbHkgPSBmdW5jdGlvbiAoIHBvcHVwICkge1xyXG4gICAgICAgICAgICB2YXIgcGFyZW50ID0gdGhpcy5wb3B1cFdyYXBwZXI7XHJcbiAgICAgICAgICAgIHZhciBwYWRkaW5nID0gKHBhcmVudC5vdXRlckhlaWdodCgpIC0gdGhpcy5wb3B1cC5vdXRlckhlaWdodCgpKSAvIDI7XHJcbiAgICAgICAgICAgIHBhcmVudC5jc3MoJ3BhZGRpbmctdG9wJywgcGFkZGluZyk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5pc0VxdWFsID0gZnVuY3Rpb24gKCBmaXJzdE9iamVjdCwgc2Vjb25kT2JqZWN0ICkge1xyXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZmlyc3RPYmplY3QpID09PSBKU09OLnN0cmluZ2lmeShzZWNvbmRPYmplY3QpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuc2V0UG9wdXBTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uID0gW107XHJcblxyXG4gICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5hdHRyKCdzdHlsZScsIHRoaXMucG9wdXBTdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uYXR0cignc3R5bGUnLCB0aGlzLnBvcHVwQ2xvc2VCdG5TdHlsZXMpO1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwQ2xvc2VCdG4uY3NzKCdmaWxsJywgdGhpcy5jbG9zZUJ1dHRvbkNvbG9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdGhpcy5hbmltYXRlZFNob3cgKSB7XHJcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uLnB1c2goXCJwYWRkaW5nIFwiICsgdGhpcy5wb3B1cFNob3dTcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKCB0aGlzLmJhY2tncm91bmRUcmFuc2l0aW9uICkge1xyXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbi5wdXNoKFwiYmFja2dyb3VuZCBcIiArIHRoaXMuYmFja2dyb3VuZFRyYW5zaXRpb25TcGVlZCAvIDEwMDAgKyBcInNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJhbnNpdGlvbiA9IHRyYW5zaXRpb24uam9pbignLCcpO1xyXG4gICAgICAgICAgICBpZiAoIHRyYW5zaXRpb24gIT09IFwiXCIgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBvcHVwV3JhcHBlci5jc3MoJ3RyYW5zaXRpb24nLCB0cmFuc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvcHVwSGFuZGxlcigpO1xyXG4gICAgfVxyXG59Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

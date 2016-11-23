/*global define */
/*global module */
/*global fetch */
'use strict';
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {

        //define(['b'], factory);
        define(['../node-uuid/uuid', '../es6-promise/promise', '../fetch-polyfill/fetch'], factory);
    } else if (typeof exports === 'object') {
        //module.exports = factory(require('b'));
        module.exports = factory(require('uuid'), require('es6-promise'), require('fetch-polyfill'));
    } else {
        // Browser globals (root is window)
        root.utils = factory(root.react);
    }
}(this, function (React, uuid, ES6Promise, FetchPolyfill) {
    return  {
        getTimeUUID: function(){
            var uuid1 = uuid.v1();
            console.log(uuid1.toString());
            return uuid1;
        },
        getWrappedPromise: function() {
            var wrappedPromise = {};
            var promise;
            if (!window.Promise){
                promise = new ES6Promise.Promise(function(resolve, reject){
                    wrappedPromise.resolve = resolve;
                    wrappedPromise.reject = reject;
                });
            } else{
                promise = new window.Promise(function (resolve, reject) {
                wrappedPromise.resolve = resolve;
                wrappedPromise.reject = reject;
                });
            }
            wrappedPromise.then = promise.then.bind(promise);
            wrappedPromise.catch = promise.catch.bind(promise);
            wrappedPromise.promise = promise;// e.g. if you want to provide somewhere only promise, without .resolve/.reject/.catch methods
            return wrappedPromise;
        },
        getWrappedFetch: function() {
            var wrappedPromise = this.getWrappedPromise();
            var args = Array.prototype.slice.call(arguments);// arguments to Array
            if (!window.fetch){
                FetchPolyfill.apply(null, args)// calling original fetch() method
                .then(function (response) {
                    wrappedPromise.resolve(response);
                }, function (error) {
                    wrappedPromise.reject(error);
                })
                .catch(function (error) {
                    wrappedPromise.catch(error);
                });
            } else{
                fetch.apply(null, args)// calling original fetch() method
                .then(function (response) {
                    wrappedPromise.resolve(response);
                }, function (error) {
                    wrappedPromise.reject(error);
                })
                .catch(function (error) {
                    wrappedPromise.catch(error);
                });
            }


            return wrappedPromise;
        },
        /**
        * Fetch JSON by url
        * @param { {
        *  url: {String},
        *  [cacheBusting]: {Boolean}
        * } } params
        * @returns {Promise}
        */
        getJSON: function(params) {
            var MAX_WAITING_TIME = 5000;// in ms
            var qryurl;
            var url = params.url;
            if(params.queryParams != undefined){
                qryurl = '?' + params.queryParams;
                url += params.cacheBusting ? qryurl + '&ts=' + new Date().getTime() : qryurl;
            }
            else{
                url += params.cacheBusting ? '?ts=' + new Date().getTime() : '';
            }

            var apiHeaders = [];
            if (params.apiKey){
                apiHeaders = {
                        'Accept': 'application/json',
                        'X-CCB-Client-Id': params.clientId,
                        'X-CCB-ACO-Id': params.amalgamCompId,
                        'X-CCB-DCO-Id': params.dataComponentId,
                        'X-CCB-Collections-API-KEY' : params.apiKey
                    }
            } else{
                apiHeaders = {
                        'Accept': 'application/json',
                        'X-CCB-Client-Id': params.clientId,
                        'X-CCB-ACO-Id': params.amalgamCompId,
                        'X-CCB-DCO-Id': params.dataComponentId
                    }
            }
            var wrappedFetch = this.getWrappedFetch(
                url,
                {
                    method: 'get',// optional, "GET" is default value
                    headers: apiHeaders
                });

                var timeoutId = setTimeout(function () {
                    wrappedFetch.reject(new Error('Load timeout for resource: ' + params.url));// reject on timeout
                }, MAX_WAITING_TIME);

                return wrappedFetch.promise// getting clear promise from wrapped
                .then(function (response) {
                    clearTimeout(timeoutId);
                    return response;
                })
                .then(this.processStatus);
            },
            processStatus: function(response) {
                if (response.status === 200 || response.status === 0) {
                    return Promise.resolve(response.json());
                } else {
                    return Promise.reject(new Error(response.statusText));
                }
            },
            getStyleClass: function(itemsperpage){
                var cssClass;
                switch(itemsperpage){
                    case 1:
                    cssClass = 'col-md-12';
                    break;
                    case 2:
                    cssClass  = 'col-md-6';
                    break;
                    case 3:
                    cssClass = 'col-md-4';
                    break;
                    case 4:
                    cssClass = 'col-md-3';
                    break;
                    default:
                    cssClass = 'col-md-3';
                    break;
                }
                return cssClass;
            },
            createCSSString: function( style) {
                var cssString = '';
                for (var key in style) {
                    if (style.hasOwnProperty(key)) {
                        switch(key) {
                            case 'bgColor':
                            case 'background-color':
                            case 'bgcolor':
                            cssString  = cssString +  'background-color:' + style[key] + ';';
                            break;
                            case 'font-color':
                            case 'fontcolor':
                            case 'color':
                            cssString  = cssString +  'color:' + style[key] + ';';
                            break;
                            default:
                            cssString  = cssString + ' ' + key + ':' + style[key] + ';';
                        }
                        //var val = style[key];
                        //console.log(val);
                    }
                }
                return cssString;
            },
            attachCustomStyles: function (style) {
                var s = document.createElement('STYLE');
                s.type = 'text/css';
                //var t = document.createTextNode(container+ " {" + this.createCSSString(style) + "}");
                var t = document.createTextNode(style);
                s.appendChild(t);
                document.head.appendChild(s);
            },
            loadConfigJSON: function(fileName){
                var reader = new FileReader();
                var configData = reader.readAsDataURL(fileName);
                console.log(configData);
            },
            matches: function(el, selector) {
                return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
            },
            getClosest: function(element, selector) {
                for (; element && element !== document; element = element.parentNode) {
                    if (this.matches(element, selector)) {
                        return element;
                    }
                }
                return false;
            },
            classExists: function(elem,className) {
                var p = new RegExp('(^| )'+className+'( |$)');
                return (elem.className && elem.className.match(p));
            },
            classAdd: function(elem,className) {
                if(this.classExists(elem,className)) {
                    return true;
                }
                elem.className += ' '+className;
            },
            classRemove: function(elem,className) {
                var c = elem.className;
                var p = new RegExp('(^| )'+className+'( |$)');
                c = c.replace(p,' ').replace(/  /g,' ');
                elem.className = c;
            },
            sendAnalyticsData: function(gaObj, data) {
                 if(typeof gaObj == 'function') {
                    gaObj('send',  data);
                }
            },
            logger: function(text, debug) {
                if(debug){
                    console.log(text);
                }
            },
            getResourseClassName: function(type){
                var typeClass;
                switch(type) {
                    case 'Textbook':
                    case 'Reading':
                        typeClass  = 'fa fa-file-text-o';
                        break;
                    case 'Case':
                        typeClass = 'fa fa-briefcase';
                        break;
                    case 'Video':
                        typeClass = 'fa fa-film';
                        break;
                    case 'Image':
                        typeClass ='fa fa-picture-o';
                        break;
                    case 'Activity':
                        typeClass = 'fa fa-bullseye';
                        break;
                    case 'Lesson':
                        typeClass = 'fa fa-puzzle-piece';
                        break;
                    case 'Document':
                        typeClass = 'fa fa-file-o';
                        break;
                    case 'Audio':
                        typeClass = 'fa fa-music';
                        break;
                    case 'Lab':
                        typeClass = 'fa fa-flask';
                        break;
                    case 'Map':
                        typeClass = 'fa fa-map-marker';
                        break;
                    case 'Slide':
                        typeClass = 'fa fa-step-forward';
                        break;
                    case 'Study Guide':
                        typeClass = 'fa fa-lightbulb-o';
                        break;
                    case 'Website':
                        typeClass = 'fa fa-chain';
                        break;
                    case 'Quiz':
                        typeClass = 'fa fa-question';
                        break;
                    default:
                        typeClass = 'fa fa-question';
                        break;
                }
                return typeClass;
            },
            truncateString: function(str, length){
                if (typeof str ==="string" && str.length > length) {
                  return str.slice(0, length-1) + "...";
                } else {
                  return str;
                }
            },
            mergeConfig: function(appConfig, customConfig) {
                var originalConf = customConfig;;
                //originalConf = appConfig;
                for (var key in appConfig) {
                    if (customConfig && (customConfig.hasOwnProperty(key))) {
                        originalConf[key] = customConfig[key];
                    }
                    else {
                        originalConf[key] = appConfig[key];
                    }
                }
                return originalConf;
            }
        };
        
    }));

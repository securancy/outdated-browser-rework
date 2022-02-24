(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.outdatedBrowserRework = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var DEFAULTS = {
	Chrome: 57, // Includes Chrome for mobile devices
	Edge: 39,
	Safari: 10,
	"Mobile Safari": 10,
	Opera: 50,
	Firefox: 50,
	Vivaldi: 1,
	IE: false
}

var EDGEHTML_VS_EDGE_VERSIONS = {
	12: 0.1,
	13: 21,
	14: 31,
	15: 39,
	16: 41,
	17: 42,
	18: 44
}

var updateDefaults = function (defaults, updatedValues) {
	for (var key in updatedValues) {
		defaults[key] = updatedValues[key]
	}

	return defaults
}

module.exports = function (parsedUserAgent, options) {
	// Set default options
	var browserSupport = options.browserSupport ? updateDefaults(DEFAULTS, options.browserSupport) : DEFAULTS
	var requiredCssProperty = options.requiredCssProperty || false

	var browserName = parsedUserAgent.browser.name;

	var isAndroidButNotChrome
	if (options.requireChromeOnAndroid) {
		isAndroidButNotChrome = parsedUserAgent.os.name === "Android" && parsedUserAgent.browser.name !== "Chrome"
	}	
	
	var parseMinorVersion = function (version) {
		return version.replace(/[^\d.]/g, '').split(".")[1];
	}

	var isBrowserUnsupported = function () {
		var isUnsupported = false
		if (!(browserName in browserSupport)) {
			if (!options.isUnknownBrowserOK) {
				isUnsupported = true
			}
		} else if (!browserSupport[browserName]) {
			isUnsupported = true
		}
		return isUnsupported;
	}

	var isBrowserUnsupportedResult = isBrowserUnsupported();

	var isBrowserOutOfDate = function () {
		var browserVersion = parsedUserAgent.browser.version;
		var browserMajorVersion = parsedUserAgent.browser.major;
		var osName = parsedUserAgent.os.name;
		var osVersion = parsedUserAgent.os.version;

		// Edge legacy needed a version mapping, Edge on Chromium doesn't
		if (browserName === "Edge" && browserMajorVersion <= 18) {
			browserMajorVersion = EDGEHTML_VS_EDGE_VERSIONS[browserMajorVersion];
		}

		// Firefox Mobile on iOS is essentially Mobile Safari so needs to be handled that way
		// See: https://github.com/mikemaccana/outdated-browser-rework/issues/98#issuecomment-597721173
		if (browserName === 'Firefox' && osName === 'iOS') {
			browserName = 'Mobile Safari';
			browserVersion = osVersion;
			browserMajorVersion = osVersion.substring(0, osVersion.indexOf('.'));
		}

		var isOutOfDate = false
		if (isBrowserUnsupportedResult) {
			isOutOfDate = true;
		} else if (browserName in browserSupport) {
			var minVersion = browserSupport[browserName]
			if (typeof minVersion == 'object') {
				var minMajorVersion = minVersion.major
				var minMinorVersion = minVersion.minor

				if (browserMajorVersion < minMajorVersion) {
					isOutOfDate = true
				} else if (browserMajorVersion == minMajorVersion) {
					var browserMinorVersion = parseMinorVersion(browserVersion)

					if (browserMinorVersion < minMinorVersion) {
						isOutOfDate = true
					}
				}
			} else if (browserMajorVersion < minVersion) {
				isOutOfDate = true
			}
		}
		return isOutOfDate
	}

	// Returns true if a browser supports a css3 property
	var isPropertySupported = function (property) {
		if (!property) {
			return true
		}
		var div = document.createElement("div")
		var vendorPrefixes = ["khtml", "ms", "o", "moz", "webkit"]
		var count = vendorPrefixes.length

		// Note: HTMLElement.style.hasOwnProperty seems broken in Edge
		if (property in div.style) {
			return true
		}

		property = property.replace(/^[a-z]/, function (val) {
			return val.toUpperCase()
		})

		while (count--) {
			var prefixedProperty = vendorPrefixes[count] + property
			// See comment re: HTMLElement.style.hasOwnProperty above
			if (prefixedProperty in div.style) {
				return true
			}
		}
		return false
	}

	// Return results
	return {
		isAndroidButNotChrome: isAndroidButNotChrome,
		isBrowserOutOfDate: isBrowserOutOfDate(),
		isBrowserUnsupported: isBrowserUnsupportedResult,
		isPropertySupported: isPropertySupported(requiredCssProperty)
	};
}

},{}],2:[function(require,module,exports){
/* Highly dumbed down version of https://github.com/unclechu/node-deep-extend */

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
module.exports = function deepExtend(/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== "object") {
		return false
	}

	if (arguments.length < 2) {
		return arguments[0]
	}

	var target = arguments[0]

	for (var i = 1; i < arguments.length; i++) {
		var obj = arguments[i]

		for (var key in obj) {
			var src = target[key]
			var val = obj[key]

			if (typeof val !== "object" || val === null) {
				target[key] = val

				// just clone arrays (and recursive clone objects inside)
			} else if (typeof src !== "object" || src === null) {
				target[key] = deepExtend({}, val)

				// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val)
			}
		}
	}

	return target
}

},{}],3:[function(require,module,exports){
var evaluateBrowser = require("./evaluateBrowser")
var languageMessages = require("./languages.json")
var deepExtend = require("./extend")
var UserAgentParser = require("ua-parser-js")

var COLORS = {
	salmon: "#f25648",
	white: "white"
}

module.exports = function(options) {
	var main = function() {
		// Despite the docs, UA needs to be provided to constructor explicitly:
		// https://github.com/faisalman/ua-parser-js/issues/90
		var parsedUserAgent = new UserAgentParser(navigator.userAgent).getResult()

		// Variable definition (before ajax)
		var outdatedUI = document.getElementById("outdated")

		// Set default options
		options = options || {}

		var browserLocale = window.navigator.language || window.navigator.userLanguage // Everyone else, IE
		// CSS property to check for. You may also like 'borderSpacing', 'boxShadow', 'transform', 'borderImage';
		var backgroundColor = options.backgroundColor || COLORS.salmon
		var textColor = options.textColor || COLORS.white
		var fullscreen = options.fullscreen || false
		var language = options.language || browserLocale.slice(0, 2) // Language code

		var updateSource = "web" // Other possible values are 'googlePlay' or 'appStore'. Determines where we tell users to go for upgrades.

		// Chrome mobile is still Chrome (unlike Safari which is 'Mobile Safari')
		var isAndroid = parsedUserAgent.os.name === "Android"
		if (isAndroid) {
			updateSource = "googlePlay"
		} else if  (parsedUserAgent.os.name === "iOS") {
			updateSource = "appStore"
		}

		var isBrowserUnsupported = false // set later after browser evaluation

		var done = true

		var changeOpacity = function (opacityValue) {
			outdatedUI.style.opacity = opacityValue / 100
			outdatedUI.style.filter = "alpha(opacity=" + opacityValue + ")"
		}
	
		var fadeIn = function (opacityValue) {
			changeOpacity(opacityValue)
			if (opacityValue === 1) {
				outdatedUI.style.display = "table"
			}
			if (opacityValue === 100) {
				done = true
			}
		}
	
		var makeFadeInFunction = function (opacityValue) {
			return function () {
				fadeIn(opacityValue)
			}
		}

		// Style element explicitly - TODO: investigate and delete if not needed
		var startStylesAndEvents = function () {
			var buttonClose = document.getElementById("buttonCloseUpdateBrowser")

			// Commented out code below because the browser is probably not so old it doesnt support loading a CSS file
			// var buttonUpdate = document.getElementById("buttonUpdateBrowser")

			// //check settings attributes
			// outdatedUI.style.backgroundColor = backgroundColor
			// //way too hard to put !important on IE6
			// outdatedUI.style.color = textColor
			// outdatedUI.children[0].children[0].style.color = textColor
			// outdatedUI.children[0].children[1].style.color = textColor
			//
			// // Update button is desktop only
			// if (buttonUpdate) {
			// 	buttonUpdate.style.color = textColor
			// 	if (buttonUpdate.style.borderColor) {
			// 		buttonUpdate.style.borderColor = textColor
			// 	}
			//
			// 	// Override the update button color to match the background color
			// 	buttonUpdate.onmouseover = function () {
			// 		this.style.color = backgroundColor
			// 		this.style.backgroundColor = textColor
			// 	}
			//
			// 	buttonUpdate.onmouseout = function () {
			// 		this.style.color = textColor
			// 		this.style.backgroundColor = backgroundColor
			// 	}
			// }
			//
			// buttonClose.style.color = textColor

			buttonClose.onmousedown = function () {
				outdatedUI.style.display = "none"
				return false
			}
		}
	
		var getMessage = function (lang) {
			var defaultMessages = languageMessages[lang] || languageMessages.en
			var customMessages = options.messages && options.messages[lang]
			var messages = deepExtend({}, defaultMessages, customMessages)
	
			var updateMessages = {
				web:
					"<p>" +
					messages.update.web +
					(messages.url ? (
						'<a id="buttonUpdateBrowser" rel="nofollow" href="' +
						messages.url +
						'">' +
						messages.callToAction +
						"</a>"
					) : '') +
					"</p>",
				googlePlay:
					"<p>" +
					messages.update.googlePlay +
					'<a id="buttonUpdateBrowser" rel="nofollow" href="https://play.google.com/store/apps/details?id=com.android.chrome">' +
					messages.callToAction +
					"</a></p>",
				appStore: "<p>" + messages.update[updateSource] + "</p>"
			}
	
			var updateMessage = updateMessages[updateSource]
	
			var browserSupportMessage = messages.outOfDate;
			if (isBrowserUnsupported && messages.unsupported) {
				browserSupportMessage = messages.unsupported;
			}
	
			return (
				'<div class="vertical-center"><h6>' +
				browserSupportMessage +
				"</h6>" +
				updateMessage +
				'<p class="last"><a href="#" id="buttonCloseUpdateBrowser" title="' +
				messages.close +
				'">&times;</a></p></div>'
			)
		}

		var result = evaluateBrowser(parsedUserAgent, options);
		if (result.isAndroidButNotChrome || result.isBrowserOutOfDate || !result.isPropertySupported) {
			// This is an outdated browser and the banner needs to show

			// Set this flag with the result for `getMessage`
			isBrowserUnsupported = result.isBrowserUnsupported

			if (done && outdatedUI.style.opacity !== "1") {
				done = false
	
				for (var opacity = 1; opacity <= 100; opacity++) {
					setTimeout(makeFadeInFunction(opacity), opacity * 8)
				}
			}
	
			var insertContentHere = document.getElementById("outdated")
			if (fullscreen) {
				insertContentHere.classList.add("fullscreen")
			}
			insertContentHere.innerHTML = getMessage(language)
			startStylesAndEvents()
		}
	}

	// Load main when DOM ready.
	var oldOnload = window.onload
	if (typeof window.onload !== "function") {
		window.onload = main
	} else {
		window.onload = function() {
			if (oldOnload) {
				oldOnload()
			}
			main()
		}
	}
}

},{"./evaluateBrowser":1,"./extend":2,"./languages.json":4,"ua-parser-js":5}],4:[function(require,module,exports){
module.exports={
	"ko": {
    "outOfDate": "최신 브라우저가 아닙니다!",
    "update": {
      "web": "웹사이트를 제대로 보려면 브라우저를 업데이트하세요.",
      "googlePlay": "Google Play에서 Chrome을 설치하세요",
      "appStore": "설정 앱에서 iOS를 업데이트하세요"
    },
    "url": "https://browser-update.org/update-browser.html",
    "callToAction": "지금 브라우저 업데이트하기",
    "close": "닫기"
  },
  "ja": {
    "outOfDate": "古いブラウザをお使いのようです。",
    "update": {
      "web": "ウェブサイトを正しく表示できるように、ブラウザをアップデートしてください。",
      "googlePlay": "Google PlayからChromeをインストールしてください",
      "appStore": "設定からiOSをアップデートしてください"
    },
    "url": "https://browser-update.org/update-browser.html",
    "callToAction": "今すぐブラウザをアップデートする",
    "close": "閉じる"
  }, 
	"br": {
		"outOfDate": "O seu navegador est&aacute; desatualizado!",
		"update": {
			"web": "Atualize o seu navegador para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atualize o seu navegador agora",
		"close": "Fechar"
	},
	"ca": {
		"outOfDate": "El vostre navegador no està actualitzat!",
		"update": {
			"web": "Actualitzeu el vostre navegador per veure correctament aquest lloc web. ",
			"googlePlay": "Instal·leu Chrome des de Google Play",
			"appStore": "Actualitzeu iOS des de l'aplicació Configuració"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualitzar el meu navegador ara",
		"close": "Tancar"
	},
	"zh": {
		"outOfDate": "您的浏览器已过时",
		"update": {
			"web": "要正常浏览本网站请升级您的浏览器。",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "现在升级",
		"close": "关闭"
	},
	"cz": {
		"outOfDate": "Váš prohlížeč je zastaralý!",
		"update": {
			"web": "Pro správné zobrazení těchto stránek aktualizujte svůj prohlížeč. ",
			"googlePlay": "Nainstalujte si Chrome z Google Play",
			"appStore": "Aktualizujte si systém iOS"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Aktualizovat nyní svůj prohlížeč",
		"close": "Zavřít"
	},
	"da": {
		"outOfDate": "Din browser er forældet!",
		"update": {
			"web": "Opdatér din browser for at få vist denne hjemmeside korrekt. ",
			"googlePlay": "Installér venligst Chrome fra Google Play",
			"appStore": "Opdatér venligst iOS"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Opdatér din browser nu",
		"close": "Luk"
	},
	"de": {
		"outOfDate": "Ihr Browser ist veraltet!",
		"update": {
			"web": "Bitte aktualisieren Sie Ihren Browser, um diese Website korrekt darzustellen. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Den Browser jetzt aktualisieren ",
		"close": "Schließen"
	},
	"ee": {
		"outOfDate": "Sinu veebilehitseja on vananenud!",
		"update": {
			"web": "Palun uuenda oma veebilehitsejat, et näha lehekülge korrektselt. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Uuenda oma veebilehitsejat kohe",
		"close": "Sulge"
	},
	"en": {
		"outOfDate": "Your browser is out-of-date!",
		"update": {
			"web": "Update your browser to view this website correctly. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Update my browser now",
		"close": "Close"
	},
	"es": {
		"outOfDate": "¡Tu navegador está anticuado!",
		"update": {
			"web": "Actualiza tu navegador para ver esta página correctamente. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualizar mi navegador ahora",
		"close": "Cerrar"
	},
	"fa": {
		"rightToLeft": true,
		"outOfDate": "مرورگر شما منسوخ شده است!",
		"update": {
			"web": "جهت مشاهده صحیح این وبسایت، مرورگرتان را بروز رسانی نمایید. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "همین حالا مرورگرم را بروز کن",
		"close": "Close"
	},
	"fi": {
		"outOfDate": "Selaimesi on vanhentunut!",
		"update": {
			"web": "Lataa ajantasainen selain n&auml;hd&auml;ksesi t&auml;m&auml;n sivun oikein. ",
			"googlePlay": "Asenna uusin Chrome Google Play -kaupasta",
			"appStore": "Päivitä iOS puhelimesi asetuksista"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "P&auml;ivit&auml; selaimeni nyt ",
		"close": "Sulje"
	},
	"fr": {
		"outOfDate": "Votre navigateur n'est plus compatible !",
		"update": {
			"web": "Mettez à jour votre navigateur pour afficher correctement ce site Web. ",
			"googlePlay": "Merci d'installer Chrome depuis le Google Play Store",
			"appStore": "Merci de mettre à jour iOS depuis l'application Réglages"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Mettre à jour maintenant ",
		"close": "Fermer"
	},
	"hu": {
		"outOfDate": "A böngészője elavult!",
		"update": {
			"web": "Firssítse vagy cserélje le a böngészőjét. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "A böngészőm frissítése ",
		"close": "Close"
	},
	"id": {
		"outOfDate": "Browser yang Anda gunakan sudah ketinggalan zaman!",
		"update": {
			"web": "Perbaharuilah browser Anda agar bisa menjelajahi website ini dengan nyaman. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Perbaharui browser sekarang ",
		"close": "Close"
	},
	"it": {
		"outOfDate": "Il tuo browser non &egrave; aggiornato!",
		"update": {
			"web": "Aggiornalo per vedere questo sito correttamente. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Aggiorna ora",
		"close": "Chiudi"
	},
	"lt": {
		"outOfDate": "Jūsų naršyklės versija yra pasenusi!",
		"update": {
			"web": "Atnaujinkite savo naršyklę, kad galėtumėte peržiūrėti šią svetainę tinkamai. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atnaujinti naršyklę ",
		"close": "Close"
	},
	"nl": {
		"outOfDate": "Je gebruikt een oude browser!",
		"update": {
			"web": "Update je browser om problemen te voorkomen. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Update mijn browser nu ",
		"close": "Sluiten"
	},
	"pl": {
		"outOfDate": "Twoja przeglądarka jest przestarzała!",
		"update": {
			"web": "Zaktualizuj swoją przeglądarkę, aby poprawnie wyświetlić tę stronę. ",
			"googlePlay": "Proszę zainstalować przeglądarkę Chrome ze sklepu Google Play",
			"appStore": "Proszę zaktualizować iOS z Ustawień"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Zaktualizuj przeglądarkę już teraz",
		"close": "Zamknij"
	},
	"pt": {
		"outOfDate": "O seu browser est&aacute; desatualizado!",
		"update": {
			"web": "Atualize o seu browser para ter uma melhor experi&ecirc;ncia e visualiza&ccedil;&atilde;o deste site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Atualize o seu browser agora",
		"close": "Fechar"
	},
	"ro": {
		"outOfDate": "Browserul este învechit!",
		"update": {
			"web": "Actualizați browserul pentru a vizualiza corect acest site. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Actualizați browserul acum!",
		"close": "Close"
	},
	"ru": {
		"outOfDate": "Ваш браузер устарел!",
		"update": {
			"web": "Обновите ваш браузер для правильного отображения этого сайта. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Обновить мой браузер ",
		"close": "Закрыть"
	},
	"si": {
		"outOfDate": "Vaš brskalnik je zastarel!",
		"update": {
			"web": "Za pravilen prikaz spletne strani posodobite vaš brskalnik. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Posodobi brskalnik ",
		"close": "Zapri"
	},
	"sv": {
		"outOfDate": "Din webbläsare stödjs ej längre!",
		"update": {
			"web": "Uppdatera din webbläsare för att webbplatsen ska visas korrekt. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Uppdatera min webbläsare nu",
		"close": "Stäng"
	},
	"ua": {
		"outOfDate": "Ваш браузер застарів!",
		"update": {
			"web": "Оновіть ваш браузер для правильного відображення цього сайта. ",
			"googlePlay": "Please install Chrome from Google Play",
			"appStore": "Please update iOS from the Settings App"
		},
		"url": "https://browser-update.org/update-browser.html",
		"callToAction": "Оновити мій браузер ",
		"close": "Закрити"
	}
}

},{}],5:[function(require,module,exports){
/*!
 * UAParser.js v0.7.22
 * Lightweight JavaScript-based User-Agent string parser
 * https://github.com/faisalman/ua-parser-js
 *
 * Copyright © 2012-2019 Faisal Salman <f@faisalman.com>
 * Licensed under MIT License
 */

(function (window, undefined) {

    'use strict';

    //////////////
    // Constants
    /////////////


    var LIBVERSION  = '0.7.22',
        EMPTY       = '',
        UNKNOWN     = '?',
        FUNC_TYPE   = 'function',
        UNDEF_TYPE  = 'undefined',
        OBJ_TYPE    = 'object',
        STR_TYPE    = 'string',
        MAJOR       = 'major', // deprecated
        MODEL       = 'model',
        NAME        = 'name',
        TYPE        = 'type',
        VENDOR      = 'vendor',
        VERSION     = 'version',
        ARCHITECTURE= 'architecture',
        CONSOLE     = 'console',
        MOBILE      = 'mobile',
        TABLET      = 'tablet',
        SMARTTV     = 'smarttv',
        WEARABLE    = 'wearable',
        EMBEDDED    = 'embedded';


    ///////////
    // Helper
    //////////


    var util = {
        extend : function (regexes, extensions) {
            var mergedRegexes = {};
            for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                    mergedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                    mergedRegexes[i] = regexes[i];
                }
            }
            return mergedRegexes;
        },
        has : function (str1, str2) {
          if (typeof str1 === "string") {
            return str2.toLowerCase().indexOf(str1.toLowerCase()) !== -1;
          } else {
            return false;
          }
        },
        lowerize : function (str) {
            return str.toLowerCase();
        },
        major : function (version) {
            return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g,'').split(".")[0] : undefined;
        },
        trim : function (str) {
          return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        }
    };


    ///////////////
    // Map helper
    //////////////


    var mapper = {

        rgx : function (ua, arrays) {

            var i = 0, j, k, p, q, matches, match;

            // loop through all regexes maps
            while (i < arrays.length && !matches) {

                var regex = arrays[i],       // even sequence (0,2,4,..)
                    props = arrays[i + 1];   // odd sequence (1,3,5,..)
                j = k = 0;

                // try matching uastring with regexes
                while (j < regex.length && !matches) {

                    matches = regex[j++].exec(ua);

                    if (!!matches) {
                        for (p = 0; p < props.length; p++) {
                            match = matches[++k];
                            q = props[p];
                            // check if given property is actually array
                            if (typeof q === OBJ_TYPE && q.length > 0) {
                                if (q.length == 2) {
                                    if (typeof q[1] == FUNC_TYPE) {
                                        // assign modified match
                                        this[q[0]] = q[1].call(this, match);
                                    } else {
                                        // assign given value, ignore regex match
                                        this[q[0]] = q[1];
                                    }
                                } else if (q.length == 3) {
                                    // check whether function or regex
                                    if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                        // call function (usually string mapper)
                                        this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined;
                                    } else {
                                        // sanitize match using given regex
                                        this[q[0]] = match ? match.replace(q[1], q[2]) : undefined;
                                    }
                                } else if (q.length == 4) {
                                        this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined;
                                }
                            } else {
                                this[q] = match ? match : undefined;
                            }
                        }
                    }
                }
                i += 2;
            }
        },

        str : function (str, map) {

            for (var i in map) {
                // check if array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                    for (var j = 0; j < map[i].length; j++) {
                        if (util.has(map[i][j], str)) {
                            return (i === UNKNOWN) ? undefined : i;
                        }
                    }
                } else if (util.has(map[i], str)) {
                    return (i === UNKNOWN) ? undefined : i;
                }
            }
            return str;
        }
    };


    ///////////////
    // String map
    //////////////


    var maps = {

        browser : {
            oldsafari : {
                version : {
                    '1.0'   : '/8',
                    '1.2'   : '/1',
                    '1.3'   : '/3',
                    '2.0'   : '/412',
                    '2.0.2' : '/416',
                    '2.0.3' : '/417',
                    '2.0.4' : '/419',
                    '?'     : '/'
                }
            }
        },

        device : {
            amazon : {
                model : {
                    'Fire Phone' : ['SD', 'KF']
                }
            },
            sprint : {
                model : {
                    'Evo Shift 4G' : '7373KT'
                },
                vendor : {
                    'HTC'       : 'APA',
                    'Sprint'    : 'Sprint'
                }
            }
        },

        os : {
            windows : {
                version : {
                    'ME'        : '4.90',
                    'NT 3.11'   : 'NT3.51',
                    'NT 4.0'    : 'NT4.0',
                    '2000'      : 'NT 5.0',
                    'XP'        : ['NT 5.1', 'NT 5.2'],
                    'Vista'     : 'NT 6.0',
                    '7'         : 'NT 6.1',
                    '8'         : 'NT 6.2',
                    '8.1'       : 'NT 6.3',
                    '10'        : ['NT 6.4', 'NT 10.0'],
                    'RT'        : 'ARM'
                }
            }
        }
    };


    //////////////
    // Regex map
    /////////////


    var regexes = {

        browser : [[

            // Presto based
            /(opera\smini)\/([\w\.-]+)/i,                                       // Opera Mini
            /(opera\s[mobiletab]+).+version\/([\w\.-]+)/i,                      // Opera Mobi/Tablet
            /(opera).+version\/([\w\.]+)/i,                                     // Opera > 9.80
            /(opera)[\/\s]+([\w\.]+)/i                                          // Opera < 9.80
            ], [NAME, VERSION], [

            /(opios)[\/\s]+([\w\.]+)/i                                          // Opera mini on iphone >= 8.0
            ], [[NAME, 'Opera Mini'], VERSION], [

            /\s(opr)\/([\w\.]+)/i                                               // Opera Webkit
            ], [[NAME, 'Opera'], VERSION], [

            // Mixed
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /(lunascape|maxthon|netfront|jasmine|blazer)[\/\s]?([\w\.]*)/i,
                                                                                // Lunascape/Maxthon/Netfront/Jasmine/Blazer
            // Trident based
            /(avant\s|iemobile|slim)(?:browser)?[\/\s]?([\w\.]*)/i,
                                                                                // Avant/IEMobile/SlimBrowser
            /(bidubrowser|baidubrowser)[\/\s]?([\w\.]+)/i,                      // Baidu Browser
            /(?:ms|\()(ie)\s([\w\.]+)/i,                                        // Internet Explorer

            // Webkit/KHTML based
            /(rekonq)\/([\w\.]*)/i,                                             // Rekonq
            /(chromium|flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon)\/([\w\.-]+)/i
                                                                                // Chromium/Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
            ], [NAME, VERSION], [

            /(konqueror)\/([\w\.]+)/i                                           // Konqueror
            ], [[NAME, 'Konqueror'], VERSION], [

            /(trident).+rv[:\s]([\w\.]+).+like\sgecko/i                         // IE11
            ], [[NAME, 'IE'], VERSION], [

            /(edge|edgios|edga|edg)\/((\d+)?[\w\.]+)/i                          // Microsoft Edge
            ], [[NAME, 'Edge'], VERSION], [

            /(yabrowser)\/([\w\.]+)/i                                           // Yandex
            ], [[NAME, 'Yandex'], VERSION], [

            /(Avast)\/([\w\.]+)/i                                               // Avast Secure Browser
            ], [[NAME, 'Avast Secure Browser'], VERSION], [

            /(AVG)\/([\w\.]+)/i                                                 // AVG Secure Browser
            ], [[NAME, 'AVG Secure Browser'], VERSION], [

            /(puffin)\/([\w\.]+)/i                                              // Puffin
            ], [[NAME, 'Puffin'], VERSION], [

            /(focus)\/([\w\.]+)/i                                               // Firefox Focus
            ], [[NAME, 'Firefox Focus'], VERSION], [

            /(opt)\/([\w\.]+)/i                                                 // Opera Touch
            ], [[NAME, 'Opera Touch'], VERSION], [

            /((?:[\s\/])uc?\s?browser|(?:juc.+)ucweb)[\/\s]?([\w\.]+)/i         // UCBrowser
            ], [[NAME, 'UCBrowser'], VERSION], [

            /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
            ], [[NAME, /_/g, ' '], VERSION], [

            /(windowswechat qbcore)\/([\w\.]+)/i                                // WeChat Desktop for Windows Built-in Browser
            ], [[NAME, 'WeChat(Win) Desktop'], VERSION], [

            /(micromessenger)\/([\w\.]+)/i                                      // WeChat
            ], [[NAME, 'WeChat'], VERSION], [

            /(brave)\/([\w\.]+)/i                                               // Brave browser
            ], [[NAME, 'Brave'], VERSION], [

            /(qqbrowserlite)\/([\w\.]+)/i                                       // QQBrowserLite
            ], [NAME, VERSION], [

            /(QQ)\/([\d\.]+)/i                                                  // QQ, aka ShouQ
            ], [NAME, VERSION], [

            /m?(qqbrowser)[\/\s]?([\w\.]+)/i                                    // QQBrowser
            ], [NAME, VERSION], [

            /(baiduboxapp)[\/\s]?([\w\.]+)/i                                    // Baidu App
            ], [NAME, VERSION], [

            /(2345Explorer)[\/\s]?([\w\.]+)/i                                   // 2345 Browser
            ], [NAME, VERSION], [

            /(MetaSr)[\/\s]?([\w\.]+)/i                                         // SouGouBrowser
            ], [NAME], [

            /(LBBROWSER)/i                                                      // LieBao Browser
            ], [NAME], [

            /xiaomi\/miuibrowser\/([\w\.]+)/i                                   // MIUI Browser
            ], [VERSION, [NAME, 'MIUI Browser']], [

            /;fbav\/([\w\.]+);/i                                                // Facebook App for iOS & Android
            ], [VERSION, [NAME, 'Facebook']], [

            /safari\s(line)\/([\w\.]+)/i,                                       // Line App for iOS
            /android.+(line)\/([\w\.]+)\/iab/i                                  // Line App for Android
            ], [NAME, VERSION], [

            /headlesschrome(?:\/([\w\.]+)|\s)/i                                 // Chrome Headless
            ], [VERSION, [NAME, 'Chrome Headless']], [

            /\swv\).+(chrome)\/([\w\.]+)/i                                      // Chrome WebView
            ], [[NAME, /(.+)/, '$1 WebView'], VERSION], [

            /((?:oculus|samsung)browser)\/([\w\.]+)/i
            ], [[NAME, /(.+(?:g|us))(.+)/, '$1 $2'], VERSION], [                // Oculus / Samsung Browser

            /android.+version\/([\w\.]+)\s+(?:mobile\s?safari|safari)*/i        // Android Browser
            ], [VERSION, [NAME, 'Android Browser']], [

            /(sailfishbrowser)\/([\w\.]+)/i                                     // Sailfish Browser
            ], [[NAME, 'Sailfish Browser'], VERSION], [

            /(chrome|omniweb|arora|[tizenoka]{5}\s?browser)\/v?([\w\.]+)/i
                                                                                // Chrome/OmniWeb/Arora/Tizen/Nokia
            ], [NAME, VERSION], [

            /(dolfin)\/([\w\.]+)/i                                              // Dolphin
            ], [[NAME, 'Dolphin'], VERSION], [

            /(qihu|qhbrowser|qihoobrowser|360browser)/i                         // 360
            ], [[NAME, '360 Browser']], [

            /((?:android.+)crmo|crios)\/([\w\.]+)/i                             // Chrome for Android/iOS
            ], [[NAME, 'Chrome'], VERSION], [

            /(coast)\/([\w\.]+)/i                                               // Opera Coast
            ], [[NAME, 'Opera Coast'], VERSION], [

            /fxios\/([\w\.-]+)/i                                                // Firefox for iOS
            ], [VERSION, [NAME, 'Firefox']], [

            /version\/([\w\.]+).+?mobile\/\w+\s(safari)/i                       // Mobile Safari
            ], [VERSION, [NAME, 'Mobile Safari']], [

            /version\/([\w\.]+).+?(mobile\s?safari|safari)/i                    // Safari & Safari Mobile
            ], [VERSION, NAME], [

            /webkit.+?(gsa)\/([\w\.]+).+?(mobile\s?safari|safari)(\/[\w\.]+)/i  // Google Search Appliance on iOS
            ], [[NAME, 'GSA'], VERSION], [

            /webkit.+?(mobile\s?safari|safari)(\/[\w\.]+)/i                     // Safari < 3.0
            ], [NAME, [VERSION, mapper.str, maps.browser.oldsafari.version]], [

            /(webkit|khtml)\/([\w\.]+)/i
            ], [NAME, VERSION], [

            // Gecko based
            /(navigator|netscape)\/([\w\.-]+)/i                                 // Netscape
            ], [[NAME, 'Netscape'], VERSION], [
            /(swiftfox)/i,                                                      // Swiftfox
            /(icedragon|iceweasel|camino|chimera|fennec|maemo\sbrowser|minimo|conkeror)[\/\s]?([\w\.\+]+)/i,
                                                                                // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror
            /(firefox|seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([\w\.-]+)$/i,

                                                                                // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
            /(mozilla)\/([\w\.]+).+rv\:.+gecko\/\d+/i,                          // Mozilla

            // Other
            /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir)[\/\s]?([\w\.]+)/i,
                                                                                // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir
            /(links)\s\(([\w\.]+)/i,                                            // Links
            /(gobrowser)\/?([\w\.]*)/i,                                         // GoBrowser
            /(ice\s?browser)\/v?([\w\._]+)/i,                                   // ICE Browser
            /(mosaic)[\/\s]([\w\.]+)/i                                          // Mosaic
            ], [NAME, VERSION]
        ],

        cpu : [[

            /(?:(amd|x(?:(?:86|64)[_-])?|wow|win)64)[;\)]/i                     // AMD64
            ], [[ARCHITECTURE, 'amd64']], [

            /(ia32(?=;))/i                                                      // IA32 (quicktime)
            ], [[ARCHITECTURE, util.lowerize]], [

            /((?:i[346]|x)86)[;\)]/i                                            // IA32
            ], [[ARCHITECTURE, 'ia32']], [

            // PocketPC mistakenly identified as PowerPC
            /windows\s(ce|mobile);\sppc;/i
            ], [[ARCHITECTURE, 'arm']], [

            /((?:ppc|powerpc)(?:64)?)(?:\smac|;|\))/i                           // PowerPC
            ], [[ARCHITECTURE, /ower/, '', util.lowerize]], [

            /(sun4\w)[;\)]/i                                                    // SPARC
            ], [[ARCHITECTURE, 'sparc']], [

            /((?:avr32|ia64(?=;))|68k(?=\))|arm(?:64|(?=v\d+[;l]))|(?=atmel\s)avr|(?:irix|mips|sparc)(?:64)?(?=;)|pa-risc)/i
                                                                                // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
            ], [[ARCHITECTURE, util.lowerize]]
        ],

        device : [[

            /\((ipad|playbook);[\w\s\),;-]+(rim|apple)/i                        // iPad/PlayBook
            ], [MODEL, VENDOR, [TYPE, TABLET]], [

            /applecoremedia\/[\w\.]+ \((ipad)/                                  // iPad
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, TABLET]], [

            /(apple\s{0,1}tv)/i                                                 // Apple TV
            ], [[MODEL, 'Apple TV'], [VENDOR, 'Apple'], [TYPE, SMARTTV]], [

            /(archos)\s(gamepad2?)/i,                                           // Archos
            /(hp).+(touchpad)/i,                                                // HP TouchPad
            /(hp).+(tablet)/i,                                                  // HP Tablet
            /(kindle)\/([\w\.]+)/i,                                             // Kindle
            /\s(nook)[\w\s]+build\/(\w+)/i,                                     // Nook
            /(dell)\s(strea[kpr\s\d]*[\dko])/i                                  // Dell Streak
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /(kf[A-z]+)\sbuild\/.+silk\//i                                      // Kindle Fire HD
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [
            /(sd|kf)[0349hijorstuw]+\sbuild\/.+silk\//i                         // Fire Phone
            ], [[MODEL, mapper.str, maps.device.amazon.model], [VENDOR, 'Amazon'], [TYPE, MOBILE]], [
            /android.+aft([bms])\sbuild/i                                       // Fire TV
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, SMARTTV]], [

            /\((ip[honed|\s\w*]+);.+(apple)/i                                   // iPod/iPhone
            ], [MODEL, VENDOR, [TYPE, MOBILE]], [
            /\((ip[honed|\s\w*]+);/i                                            // iPod/iPhone
            ], [MODEL, [VENDOR, 'Apple'], [TYPE, MOBILE]], [

            /(blackberry)[\s-]?(\w+)/i,                                         // BlackBerry
            /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[\s_-]?([\w-]*)/i,
                                                                                // BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
            /(hp)\s([\w\s]+\w)/i,                                               // HP iPAQ
            /(asus)-?(\w+)/i                                                    // Asus
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [
            /\(bb10;\s(\w+)/i                                                   // BlackBerry 10
            ], [MODEL, [VENDOR, 'BlackBerry'], [TYPE, MOBILE]], [
                                                                                // Asus Tablets
            /android.+(transfo[prime\s]{4,10}\s\w+|eeepc|slider\s\w+|nexus 7|padfone|p00c)/i
            ], [MODEL, [VENDOR, 'Asus'], [TYPE, TABLET]], [

            /(sony)\s(tablet\s[ps])\sbuild\//i,                                  // Sony
            /(sony)?(?:sgp.+)\sbuild\//i
            ], [[VENDOR, 'Sony'], [MODEL, 'Xperia Tablet'], [TYPE, TABLET]], [
            /android.+\s([c-g]\d{4}|so[-l]\w+)(?=\sbuild\/|\).+chrome\/(?![1-6]{0,1}\d\.))/i
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, MOBILE]], [

            /\s(ouya)\s/i,                                                      // Ouya
            /(nintendo)\s([wids3u]+)/i                                          // Nintendo
            ], [VENDOR, MODEL, [TYPE, CONSOLE]], [

            /android.+;\s(shield)\sbuild/i                                      // Nvidia
            ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [

            /(playstation\s[34portablevi]+)/i                                   // Playstation
            ], [MODEL, [VENDOR, 'Sony'], [TYPE, CONSOLE]], [

            /(sprint\s(\w+))/i                                                  // Sprint Phones
            ], [[VENDOR, mapper.str, maps.device.sprint.vendor], [MODEL, mapper.str, maps.device.sprint.model], [TYPE, MOBILE]], [

            /(htc)[;_\s-]+([\w\s]+(?=\)|\sbuild)|\w+)/i,                        // HTC
            /(zte)-(\w*)/i,                                                     // ZTE
            /(alcatel|geeksphone|nexian|panasonic|(?=;\s)sony)[_\s-]?([\w-]*)/i
                                                                                // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
            ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

            /(nexus\s9)/i                                                       // HTC Nexus 9
            ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [

            /d\/huawei([\w\s-]+)[;\)]/i,
            /(nexus\s6p|vog-l29|ane-lx1|eml-l29|ele-l29)/i                              // Huawei
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, MOBILE]], [

            /android.+(bah2?-a?[lw]\d{2})/i                                     // Huawei MediaPad
            ], [MODEL, [VENDOR, 'Huawei'], [TYPE, TABLET]], [

            /(microsoft);\s(lumia[\s\w]+)/i                                     // Microsoft Lumia
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /[\s\(;](xbox(?:\sone)?)[\s\);]/i                                   // Microsoft Xbox
            ], [MODEL, [VENDOR, 'Microsoft'], [TYPE, CONSOLE]], [
            /(kin\.[onetw]{3})/i                                                // Microsoft Kin
            ], [[MODEL, /\./g, ' '], [VENDOR, 'Microsoft'], [TYPE, MOBILE]], [

                                                                                // Motorola
            /\s(milestone|droid(?:[2-4x]|\s(?:bionic|x2|pro|razr))?:?(\s4g)?)[\w\s]+build\//i,
            /mot[\s-]?(\w*)/i,
            /(XT\d{3,4}) build\//i,
            /(nexus\s6)/i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, MOBILE]], [
            /android.+\s(mz60\d|xoom[\s2]{0,2})\sbuild\//i
            ], [MODEL, [VENDOR, 'Motorola'], [TYPE, TABLET]], [

            /hbbtv\/\d+\.\d+\.\d+\s+\([\w\s]*;\s*(\w[^;]*);([^;]*)/i            // HbbTV devices
            ], [[VENDOR, util.trim], [MODEL, util.trim], [TYPE, SMARTTV]], [

            /hbbtv.+maple;(\d+)/i
            ], [[MODEL, /^/, 'SmartTV'], [VENDOR, 'Samsung'], [TYPE, SMARTTV]], [

            /\(dtv[\);].+(aquos)/i                                              // Sharp
            ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [

            /android.+((sch-i[89]0\d|shw-m380s|gt-p\d{4}|gt-n\d+|sgh-t8[56]9|nexus 10))/i,
            /((SM-T\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, TABLET]], [                  // Samsung
            /smart-tv.+(samsung)/i
            ], [VENDOR, [TYPE, SMARTTV], MODEL], [
            /((s[cgp]h-\w+|gt-\w+|galaxy\snexus|sm-\w[\w\d]+))/i,
            /(sam[sung]*)[\s-]*(\w+-?[\w-]*)/i,
            /sec-((sgh\w+))/i
            ], [[VENDOR, 'Samsung'], MODEL, [TYPE, MOBILE]], [

            /sie-(\w*)/i                                                        // Siemens
            ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [

            /(maemo|nokia).*(n900|lumia\s\d+)/i,                                // Nokia
            /(nokia)[\s_-]?([\w-]*)/i
            ], [[VENDOR, 'Nokia'], MODEL, [TYPE, MOBILE]], [

            /android[x\d\.\s;]+\s([ab][1-7]\-?[0178a]\d\d?)/i                   // Acer
            ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

            /android.+([vl]k\-?\d{3})\s+build/i                                 // LG Tablet
            ], [MODEL, [VENDOR, 'LG'], [TYPE, TABLET]], [
            /android\s3\.[\s\w;-]{10}(lg?)-([06cv9]{3,4})/i                     // LG Tablet
            ], [[VENDOR, 'LG'], MODEL, [TYPE, TABLET]], [
            /(lg) netcast\.tv/i                                                 // LG SmartTV
            ], [VENDOR, MODEL, [TYPE, SMARTTV]], [
            /(nexus\s[45])/i,                                                   // LG
            /lg[e;\s\/-]+(\w*)/i,
            /android.+lg(\-?[\d\w]+)\s+build/i
            ], [MODEL, [VENDOR, 'LG'], [TYPE, MOBILE]], [

            /(lenovo)\s?(s(?:5000|6000)(?:[\w-]+)|tab(?:[\s\w]+))/i             // Lenovo tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [
            /android.+(ideatab[a-z0-9\-\s]+)/i                                  // Lenovo
            ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [
            /(lenovo)[_\s-]?([\w-]+)/i
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /linux;.+((jolla));/i                                               // Jolla
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /((pebble))app\/[\d\.]+\s/i                                         // Pebble
            ], [VENDOR, MODEL, [TYPE, WEARABLE]], [

            /android.+;\s(oppo)\s?([\w\s]+)\sbuild/i                            // OPPO
            ], [VENDOR, MODEL, [TYPE, MOBILE]], [

            /crkey/i                                                            // Google Chromecast
            ], [[MODEL, 'Chromecast'], [VENDOR, 'Google'], [TYPE, SMARTTV]], [

            /android.+;\s(glass)\s\d/i                                          // Google Glass
            ], [MODEL, [VENDOR, 'Google'], [TYPE, WEARABLE]], [

            /android.+;\s(pixel c)[\s)]/i                                       // Google Pixel C
            ], [MODEL, [VENDOR, 'Google'], [TYPE, TABLET]], [

            /android.+;\s(pixel( [23])?( xl)?)[\s)]/i                              // Google Pixel
            ], [MODEL, [VENDOR, 'Google'], [TYPE, MOBILE]], [

            /android.+;\s(\w+)\s+build\/hm\1/i,                                 // Xiaomi Hongmi 'numeric' models
            /android.+(hm[\s\-_]*note?[\s_]*(?:\d\w)?)\s+build/i,               // Xiaomi Hongmi
            /android.+(mi[\s\-_]*(?:a\d|one|one[\s_]plus|note lte)?[\s_]*(?:\d?\w?)[\s_]*(?:plus)?)\s+build/i,    
                                                                                // Xiaomi Mi
            /android.+(redmi[\s\-_]*(?:note)?(?:[\s_]?[\w\s]+))\s+build/i       // Redmi Phones
            ], [[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, MOBILE]], [
            /android.+(mi[\s\-_]*(?:pad)(?:[\s_]?[\w\s]+))\s+build/i            // Mi Pad tablets
            ],[[MODEL, /_/g, ' '], [VENDOR, 'Xiaomi'], [TYPE, TABLET]], [
            /android.+;\s(m[1-5]\snote)\sbuild/i                                // Meizu
            ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [
            /(mz)-([\w-]{2,})/i
            ], [[VENDOR, 'Meizu'], MODEL, [TYPE, MOBILE]], [

            /android.+a000(1)\s+build/i,                                        // OnePlus
            /android.+oneplus\s(a\d{4})[\s)]/i
            ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(RCT[\d\w]+)\s+build/i                            // RCA Tablets
            ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [

            /android.+[;\/\s]+(Venue[\d\s]{2,7})\s+build/i                      // Dell Venue Tablets
            ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Q[T|M][\d\w]+)\s+build/i                         // Verizon Tablet
            ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [

            /android.+[;\/]\s+(Barnes[&\s]+Noble\s+|BN[RT])(V?.*)\s+build/i     // Barnes & Noble Tablet
            ], [[VENDOR, 'Barnes & Noble'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s+(TM\d{3}.*\b)\s+build/i                           // Barnes & Noble Tablet
            ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [

            /android.+;\s(k88)\sbuild/i                                         // ZTE K Series Tablet
            ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(gen\d{3})\s+build.*49h/i                         // Swiss GEN Mobile
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [

            /android.+[;\/]\s*(zur\d{3})\s+build/i                              // Swiss ZUR Tablet
            ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((Zeki)?TB.*\b)\s+build/i                         // Zeki Tablets
            ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [

            /(android).+[;\/]\s+([YR]\d{2})\s+build/i,
            /android.+[;\/]\s+(Dragon[\-\s]+Touch\s+|DT)(\w{5})\sbuild/i        // Dragon Touch Tablet
            ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(NS-?\w{0,9})\sbuild/i                            // Insignia Tablets
            ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [

            /android.+[;\/]\s*((NX|Next)-?\w{0,9})\s+build/i                    // NextBook Tablets
            ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Xtreme\_)?(V(1[045]|2[015]|30|40|60|7[05]|90))\s+build/i
            ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [                    // Voice Xtreme Phones

            /android.+[;\/]\s*(LVTEL\-)?(V1[12])\s+build/i                     // LvTel Phones
            ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [

            /android.+;\s(PH-1)\s/i
            ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [                // Essential PH-1

            /android.+[;\/]\s*(V(100MD|700NA|7011|917G).*\b)\s+build/i          // Envizen Tablets
            ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Le[\s\-]+Pan)[\s\-]+(\w{1,9})\s+build/i          // Le Pan Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trio[\s\-]*.*)\s+build/i                         // MachSpeed Tablets
            ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [

            /android.+[;\/]\s*(Trinity)[\-\s]*(T\d{3})\s+build/i                // Trinity Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /android.+[;\/]\s*TU_(1491)\s+build/i                               // Rotor Tablets
            ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [

            /android.+(KS(.+))\s+build/i                                        // Amazon Kindle Tablets
            ], [MODEL, [VENDOR, 'Amazon'], [TYPE, TABLET]], [

            /android.+(Gigaset)[\s\-]+(Q\w{1,9})\s+build/i                      // Gigaset Tablets
            ], [VENDOR, MODEL, [TYPE, TABLET]], [

            /\s(tablet|tab)[;\/]/i,                                             // Unidentifiable Tablet
            /\s(mobile)(?:[;\/]|\ssafari)/i                                     // Unidentifiable Mobile
            ], [[TYPE, util.lowerize], VENDOR, MODEL], [

            /[\s\/\(](smart-?tv)[;\)]/i                                         // SmartTV
            ], [[TYPE, SMARTTV]], [

            /(android[\w\.\s\-]{0,9});.+build/i                                 // Generic Android Device
            ], [MODEL, [VENDOR, 'Generic']]
        ],

        engine : [[

            /windows.+\sedge\/([\w\.]+)/i                                       // EdgeHTML
            ], [VERSION, [NAME, 'EdgeHTML']], [

            /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i                         // Blink
            ], [VERSION, [NAME, 'Blink']], [

            /(presto)\/([\w\.]+)/i,                                             // Presto
            /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,     
                                                                                // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
            /(khtml|tasman|links)[\/\s]\(?([\w\.]+)/i,                          // KHTML/Tasman/Links
            /(icab)[\/\s]([23]\.[\d\.]+)/i                                      // iCab
            ], [NAME, VERSION], [

            /rv\:([\w\.]{1,9}).+(gecko)/i                                       // Gecko
            ], [VERSION, NAME]
        ],

        os : [[

            // Windows based
            /microsoft\s(windows)\s(vista|xp)/i                                 // Windows (iTunes)
            ], [NAME, VERSION], [
            /(windows)\snt\s6\.2;\s(arm)/i,                                     // Windows RT
            /(windows\sphone(?:\sos)*)[\s\/]?([\d\.\s\w]*)/i,                   // Windows Phone
            /(windows\smobile|windows)[\s\/]?([ntce\d\.\s]+\w)/i
            ], [NAME, [VERSION, mapper.str, maps.os.windows.version]], [
            /(win(?=3|9|n)|win\s9x\s)([nt\d\.]+)/i
            ], [[NAME, 'Windows'], [VERSION, mapper.str, maps.os.windows.version]], [

            // Mobile/Embedded OS
            /\((bb)(10);/i                                                      // BlackBerry 10
            ], [[NAME, 'BlackBerry'], VERSION], [
            /(blackberry)\w*\/?([\w\.]*)/i,                                     // Blackberry
            /(tizen|kaios)[\/\s]([\w\.]+)/i,                                    // Tizen/KaiOS
            /(android|webos|palm\sos|qnx|bada|rim\stablet\sos|meego|sailfish|contiki)[\/\s-]?([\w\.]*)/i
                                                                                // Android/WebOS/Palm/QNX/Bada/RIM/MeeGo/Contiki/Sailfish OS
            ], [NAME, VERSION], [
            /(symbian\s?os|symbos|s60(?=;))[\/\s-]?([\w\.]*)/i                  // Symbian
            ], [[NAME, 'Symbian'], VERSION], [
            /\((series40);/i                                                    // Series 40
            ], [NAME], [
            /mozilla.+\(mobile;.+gecko.+firefox/i                               // Firefox OS
            ], [[NAME, 'Firefox OS'], VERSION], [

            // Console
            /(nintendo|playstation)\s([wids34portablevu]+)/i,                   // Nintendo/Playstation

            // GNU/Linux based
            /(mint)[\/\s\(]?(\w*)/i,                                            // Mint
            /(mageia|vectorlinux)[;\s]/i,                                       // Mageia/VectorLinux
            /(joli|[kxln]?ubuntu|debian|suse|opensuse|gentoo|(?=\s)arch|slackware|fedora|mandriva|centos|pclinuxos|redhat|zenwalk|linpus)[\/\s-]?(?!chrom)([\w\.-]*)/i,
                                                                                // Joli/Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware
                                                                                // Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus
            /(hurd|linux)\s?([\w\.]*)/i,                                        // Hurd/Linux
            /(gnu)\s?([\w\.]*)/i                                                // GNU
            ], [NAME, VERSION], [

            /(cros)\s[\w]+\s([\w\.]+\w)/i                                       // Chromium OS
            ], [[NAME, 'Chromium OS'], VERSION],[

            // Solaris
            /(sunos)\s?([\w\.\d]*)/i                                            // Solaris
            ], [[NAME, 'Solaris'], VERSION], [

            // BSD based
            /\s([frentopc-]{0,4}bsd|dragonfly)\s?([\w\.]*)/i                    // FreeBSD/NetBSD/OpenBSD/PC-BSD/DragonFly
            ], [NAME, VERSION],[

            /(haiku)\s(\w+)/i                                                   // Haiku
            ], [NAME, VERSION],[

            /cfnetwork\/.+darwin/i,
            /ip[honead]{2,4}(?:.*os\s([\w]+)\slike\smac|;\sopera)/i             // iOS
            ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [

            /(mac\sos\sx)\s?([\w\s\.]*)/i,
            /(macintosh|mac(?=_powerpc)\s)/i                                    // Mac OS
            ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

            // Other
            /((?:open)?solaris)[\/\s-]?([\w\.]*)/i,                             // Solaris
            /(aix)\s((\d)(?=\.|\)|\s)[\w\.])*/i,                                // AIX
            /(plan\s9|minix|beos|os\/2|amigaos|morphos|risc\sos|openvms|fuchsia)/i,
                                                                                // Plan9/Minix/BeOS/OS2/AmigaOS/MorphOS/RISCOS/OpenVMS/Fuchsia
            /(unix)\s?([\w\.]*)/i                                               // UNIX
            ], [NAME, VERSION]
        ]
    };


    /////////////////
    // Constructor
    ////////////////
    var UAParser = function (uastring, extensions) {

        if (typeof uastring === 'object') {
            extensions = uastring;
            uastring = undefined;
        }

        if (!(this instanceof UAParser)) {
            return new UAParser(uastring, extensions).getResult();
        }

        var ua = uastring || ((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
        var rgxmap = extensions ? util.extend(regexes, extensions) : regexes;

        this.getBrowser = function () {
            var browser = { name: undefined, version: undefined };
            mapper.rgx.call(browser, ua, rgxmap.browser);
            browser.major = util.major(browser.version); // deprecated
            return browser;
        };
        this.getCPU = function () {
            var cpu = { architecture: undefined };
            mapper.rgx.call(cpu, ua, rgxmap.cpu);
            return cpu;
        };
        this.getDevice = function () {
            var device = { vendor: undefined, model: undefined, type: undefined };
            mapper.rgx.call(device, ua, rgxmap.device);
            return device;
        };
        this.getEngine = function () {
            var engine = { name: undefined, version: undefined };
            mapper.rgx.call(engine, ua, rgxmap.engine);
            return engine;
        };
        this.getOS = function () {
            var os = { name: undefined, version: undefined };
            mapper.rgx.call(os, ua, rgxmap.os);
            return os;
        };
        this.getResult = function () {
            return {
                ua      : this.getUA(),
                browser : this.getBrowser(),
                engine  : this.getEngine(),
                os      : this.getOS(),
                device  : this.getDevice(),
                cpu     : this.getCPU()
            };
        };
        this.getUA = function () {
            return ua;
        };
        this.setUA = function (uastring) {
            ua = uastring;
            return this;
        };
        return this;
    };

    UAParser.VERSION = LIBVERSION;
    UAParser.BROWSER = {
        NAME    : NAME,
        MAJOR   : MAJOR, // deprecated
        VERSION : VERSION
    };
    UAParser.CPU = {
        ARCHITECTURE : ARCHITECTURE
    };
    UAParser.DEVICE = {
        MODEL   : MODEL,
        VENDOR  : VENDOR,
        TYPE    : TYPE,
        CONSOLE : CONSOLE,
        MOBILE  : MOBILE,
        SMARTTV : SMARTTV,
        TABLET  : TABLET,
        WEARABLE: WEARABLE,
        EMBEDDED: EMBEDDED
    };
    UAParser.ENGINE = {
        NAME    : NAME,
        VERSION : VERSION
    };
    UAParser.OS = {
        NAME    : NAME,
        VERSION : VERSION
    };

    ///////////
    // Export
    //////////


    // check js environment
    if (typeof(exports) !== UNDEF_TYPE) {
        // nodejs env
        if (typeof module !== UNDEF_TYPE && module.exports) {
            exports = module.exports = UAParser;
        }
        exports.UAParser = UAParser;
    } else {
        // requirejs env (optional)
        if (typeof(define) === 'function' && define.amd) {
            define(function () {
                return UAParser;
            });
        } else if (window) {
            // browser env
            window.UAParser = UAParser;
        }
    }

    // jQuery/Zepto specific (optional)
    // Note:
    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
    //   and we should catch that.
    var $ = window && (window.jQuery || window.Zepto);
    if ($ && !$.ua) {
        var parser = new UAParser();
        $.ua = parser.getResult();
        $.ua.get = function () {
            return parser.getUA();
        };
        $.ua.set = function (uastring) {
            parser.setUA(uastring);
            var result = parser.getResult();
            for (var prop in result) {
                $.ua[prop] = result[prop];
            }
        };
    }

})(typeof window === 'object' ? window : this);

},{}]},{},[3])(3)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJldmFsdWF0ZUJyb3dzZXIuanMiLCJleHRlbmQuanMiLCJpbmRleC5qcyIsImxhbmd1YWdlcy5qc29uIiwibm9kZV9tb2R1bGVzL3VhLXBhcnNlci1qcy9zcmMvdWEtcGFyc2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJ2YXIgREVGQVVMVFMgPSB7XG5cdENocm9tZTogNTcsIC8vIEluY2x1ZGVzIENocm9tZSBmb3IgbW9iaWxlIGRldmljZXNcblx0RWRnZTogMzksXG5cdFNhZmFyaTogMTAsXG5cdFwiTW9iaWxlIFNhZmFyaVwiOiAxMCxcblx0T3BlcmE6IDUwLFxuXHRGaXJlZm94OiA1MCxcblx0Vml2YWxkaTogMSxcblx0SUU6IGZhbHNlXG59XG5cbnZhciBFREdFSFRNTF9WU19FREdFX1ZFUlNJT05TID0ge1xuXHQxMjogMC4xLFxuXHQxMzogMjEsXG5cdDE0OiAzMSxcblx0MTU6IDM5LFxuXHQxNjogNDEsXG5cdDE3OiA0Mixcblx0MTg6IDQ0XG59XG5cbnZhciB1cGRhdGVEZWZhdWx0cyA9IGZ1bmN0aW9uIChkZWZhdWx0cywgdXBkYXRlZFZhbHVlcykge1xuXHRmb3IgKHZhciBrZXkgaW4gdXBkYXRlZFZhbHVlcykge1xuXHRcdGRlZmF1bHRzW2tleV0gPSB1cGRhdGVkVmFsdWVzW2tleV1cblx0fVxuXG5cdHJldHVybiBkZWZhdWx0c1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwYXJzZWRVc2VyQWdlbnQsIG9wdGlvbnMpIHtcblx0Ly8gU2V0IGRlZmF1bHQgb3B0aW9uc1xuXHR2YXIgYnJvd3NlclN1cHBvcnQgPSBvcHRpb25zLmJyb3dzZXJTdXBwb3J0ID8gdXBkYXRlRGVmYXVsdHMoREVGQVVMVFMsIG9wdGlvbnMuYnJvd3NlclN1cHBvcnQpIDogREVGQVVMVFNcblx0dmFyIHJlcXVpcmVkQ3NzUHJvcGVydHkgPSBvcHRpb25zLnJlcXVpcmVkQ3NzUHJvcGVydHkgfHwgZmFsc2VcblxuXHR2YXIgYnJvd3Nlck5hbWUgPSBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5uYW1lO1xuXG5cdHZhciBpc0FuZHJvaWRCdXROb3RDaHJvbWVcblx0aWYgKG9wdGlvbnMucmVxdWlyZUNocm9tZU9uQW5kcm9pZCkge1xuXHRcdGlzQW5kcm9pZEJ1dE5vdENocm9tZSA9IHBhcnNlZFVzZXJBZ2VudC5vcy5uYW1lID09PSBcIkFuZHJvaWRcIiAmJiBwYXJzZWRVc2VyQWdlbnQuYnJvd3Nlci5uYW1lICE9PSBcIkNocm9tZVwiXG5cdH1cdFxuXHRcblx0dmFyIHBhcnNlTWlub3JWZXJzaW9uID0gZnVuY3Rpb24gKHZlcnNpb24pIHtcblx0XHRyZXR1cm4gdmVyc2lvbi5yZXBsYWNlKC9bXlxcZC5dL2csICcnKS5zcGxpdChcIi5cIilbMV07XG5cdH1cblxuXHR2YXIgaXNCcm93c2VyVW5zdXBwb3J0ZWQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGlzVW5zdXBwb3J0ZWQgPSBmYWxzZVxuXHRcdGlmICghKGJyb3dzZXJOYW1lIGluIGJyb3dzZXJTdXBwb3J0KSkge1xuXHRcdFx0aWYgKCFvcHRpb25zLmlzVW5rbm93bkJyb3dzZXJPSykge1xuXHRcdFx0XHRpc1Vuc3VwcG9ydGVkID0gdHJ1ZVxuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAoIWJyb3dzZXJTdXBwb3J0W2Jyb3dzZXJOYW1lXSkge1xuXHRcdFx0aXNVbnN1cHBvcnRlZCA9IHRydWVcblx0XHR9XG5cdFx0cmV0dXJuIGlzVW5zdXBwb3J0ZWQ7XG5cdH1cblxuXHR2YXIgaXNCcm93c2VyVW5zdXBwb3J0ZWRSZXN1bHQgPSBpc0Jyb3dzZXJVbnN1cHBvcnRlZCgpO1xuXG5cdHZhciBpc0Jyb3dzZXJPdXRPZkRhdGUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGJyb3dzZXJWZXJzaW9uID0gcGFyc2VkVXNlckFnZW50LmJyb3dzZXIudmVyc2lvbjtcblx0XHR2YXIgYnJvd3Nlck1ham9yVmVyc2lvbiA9IHBhcnNlZFVzZXJBZ2VudC5icm93c2VyLm1ham9yO1xuXHRcdHZhciBvc05hbWUgPSBwYXJzZWRVc2VyQWdlbnQub3MubmFtZTtcblx0XHR2YXIgb3NWZXJzaW9uID0gcGFyc2VkVXNlckFnZW50Lm9zLnZlcnNpb247XG5cblx0XHQvLyBFZGdlIGxlZ2FjeSBuZWVkZWQgYSB2ZXJzaW9uIG1hcHBpbmcsIEVkZ2Ugb24gQ2hyb21pdW0gZG9lc24ndFxuXHRcdGlmIChicm93c2VyTmFtZSA9PT0gXCJFZGdlXCIgJiYgYnJvd3Nlck1ham9yVmVyc2lvbiA8PSAxOCkge1xuXHRcdFx0YnJvd3Nlck1ham9yVmVyc2lvbiA9IEVER0VIVE1MX1ZTX0VER0VfVkVSU0lPTlNbYnJvd3Nlck1ham9yVmVyc2lvbl07XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZWZveCBNb2JpbGUgb24gaU9TIGlzIGVzc2VudGlhbGx5IE1vYmlsZSBTYWZhcmkgc28gbmVlZHMgdG8gYmUgaGFuZGxlZCB0aGF0IHdheVxuXHRcdC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL21pa2VtYWNjYW5hL291dGRhdGVkLWJyb3dzZXItcmV3b3JrL2lzc3Vlcy85OCNpc3N1ZWNvbW1lbnQtNTk3NzIxMTczXG5cdFx0aWYgKGJyb3dzZXJOYW1lID09PSAnRmlyZWZveCcgJiYgb3NOYW1lID09PSAnaU9TJykge1xuXHRcdFx0YnJvd3Nlck5hbWUgPSAnTW9iaWxlIFNhZmFyaSc7XG5cdFx0XHRicm93c2VyVmVyc2lvbiA9IG9zVmVyc2lvbjtcblx0XHRcdGJyb3dzZXJNYWpvclZlcnNpb24gPSBvc1ZlcnNpb24uc3Vic3RyaW5nKDAsIG9zVmVyc2lvbi5pbmRleE9mKCcuJykpO1xuXHRcdH1cblxuXHRcdHZhciBpc091dE9mRGF0ZSA9IGZhbHNlXG5cdFx0aWYgKGlzQnJvd3NlclVuc3VwcG9ydGVkUmVzdWx0KSB7XG5cdFx0XHRpc091dE9mRGF0ZSA9IHRydWU7XG5cdFx0fSBlbHNlIGlmIChicm93c2VyTmFtZSBpbiBicm93c2VyU3VwcG9ydCkge1xuXHRcdFx0dmFyIG1pblZlcnNpb24gPSBicm93c2VyU3VwcG9ydFticm93c2VyTmFtZV1cblx0XHRcdGlmICh0eXBlb2YgbWluVmVyc2lvbiA9PSAnb2JqZWN0Jykge1xuXHRcdFx0XHR2YXIgbWluTWFqb3JWZXJzaW9uID0gbWluVmVyc2lvbi5tYWpvclxuXHRcdFx0XHR2YXIgbWluTWlub3JWZXJzaW9uID0gbWluVmVyc2lvbi5taW5vclxuXG5cdFx0XHRcdGlmIChicm93c2VyTWFqb3JWZXJzaW9uIDwgbWluTWFqb3JWZXJzaW9uKSB7XG5cdFx0XHRcdFx0aXNPdXRPZkRhdGUgPSB0cnVlXG5cdFx0XHRcdH0gZWxzZSBpZiAoYnJvd3Nlck1ham9yVmVyc2lvbiA9PSBtaW5NYWpvclZlcnNpb24pIHtcblx0XHRcdFx0XHR2YXIgYnJvd3Nlck1pbm9yVmVyc2lvbiA9IHBhcnNlTWlub3JWZXJzaW9uKGJyb3dzZXJWZXJzaW9uKVxuXG5cdFx0XHRcdFx0aWYgKGJyb3dzZXJNaW5vclZlcnNpb24gPCBtaW5NaW5vclZlcnNpb24pIHtcblx0XHRcdFx0XHRcdGlzT3V0T2ZEYXRlID0gdHJ1ZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmIChicm93c2VyTWFqb3JWZXJzaW9uIDwgbWluVmVyc2lvbikge1xuXHRcdFx0XHRpc091dE9mRGF0ZSA9IHRydWVcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGlzT3V0T2ZEYXRlXG5cdH1cblxuXHQvLyBSZXR1cm5zIHRydWUgaWYgYSBicm93c2VyIHN1cHBvcnRzIGEgY3NzMyBwcm9wZXJ0eVxuXHR2YXIgaXNQcm9wZXJ0eVN1cHBvcnRlZCA9IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuXHRcdGlmICghcHJvcGVydHkpIHtcblx0XHRcdHJldHVybiB0cnVlXG5cdFx0fVxuXHRcdHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0dmFyIHZlbmRvclByZWZpeGVzID0gW1wia2h0bWxcIiwgXCJtc1wiLCBcIm9cIiwgXCJtb3pcIiwgXCJ3ZWJraXRcIl1cblx0XHR2YXIgY291bnQgPSB2ZW5kb3JQcmVmaXhlcy5sZW5ndGhcblxuXHRcdC8vIE5vdGU6IEhUTUxFbGVtZW50LnN0eWxlLmhhc093blByb3BlcnR5IHNlZW1zIGJyb2tlbiBpbiBFZGdlXG5cdFx0aWYgKHByb3BlcnR5IGluIGRpdi5zdHlsZSkge1xuXHRcdFx0cmV0dXJuIHRydWVcblx0XHR9XG5cblx0XHRwcm9wZXJ0eSA9IHByb3BlcnR5LnJlcGxhY2UoL15bYS16XS8sIGZ1bmN0aW9uICh2YWwpIHtcblx0XHRcdHJldHVybiB2YWwudG9VcHBlckNhc2UoKVxuXHRcdH0pXG5cblx0XHR3aGlsZSAoY291bnQtLSkge1xuXHRcdFx0dmFyIHByZWZpeGVkUHJvcGVydHkgPSB2ZW5kb3JQcmVmaXhlc1tjb3VudF0gKyBwcm9wZXJ0eVxuXHRcdFx0Ly8gU2VlIGNvbW1lbnQgcmU6IEhUTUxFbGVtZW50LnN0eWxlLmhhc093blByb3BlcnR5IGFib3ZlXG5cdFx0XHRpZiAocHJlZml4ZWRQcm9wZXJ0eSBpbiBkaXYuc3R5bGUpIHtcblx0XHRcdFx0cmV0dXJuIHRydWVcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlXG5cdH1cblxuXHQvLyBSZXR1cm4gcmVzdWx0c1xuXHRyZXR1cm4ge1xuXHRcdGlzQW5kcm9pZEJ1dE5vdENocm9tZTogaXNBbmRyb2lkQnV0Tm90Q2hyb21lLFxuXHRcdGlzQnJvd3Nlck91dE9mRGF0ZTogaXNCcm93c2VyT3V0T2ZEYXRlKCksXG5cdFx0aXNCcm93c2VyVW5zdXBwb3J0ZWQ6IGlzQnJvd3NlclVuc3VwcG9ydGVkUmVzdWx0LFxuXHRcdGlzUHJvcGVydHlTdXBwb3J0ZWQ6IGlzUHJvcGVydHlTdXBwb3J0ZWQocmVxdWlyZWRDc3NQcm9wZXJ0eSlcblx0fTtcbn1cbiIsIi8qIEhpZ2hseSBkdW1iZWQgZG93biB2ZXJzaW9uIG9mIGh0dHBzOi8vZ2l0aHViLmNvbS91bmNsZWNodS9ub2RlLWRlZXAtZXh0ZW5kICovXG5cbi8qKlxuICogRXh0ZW5pbmcgb2JqZWN0IHRoYXQgZW50ZXJlZCBpbiBmaXJzdCBhcmd1bWVudC5cbiAqXG4gKiBSZXR1cm5zIGV4dGVuZGVkIG9iamVjdCBvciBmYWxzZSBpZiBoYXZlIG5vIHRhcmdldCBvYmplY3Qgb3IgaW5jb3JyZWN0IHR5cGUuXG4gKlxuICogSWYgeW91IHdpc2ggdG8gY2xvbmUgc291cmNlIG9iamVjdCAod2l0aG91dCBtb2RpZnkgaXQpLCBqdXN0IHVzZSBlbXB0eSBuZXdcbiAqIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudCwgbGlrZSB0aGlzOlxuICogICBkZWVwRXh0ZW5kKHt9LCB5b3VyT2JqXzEsIFt5b3VyT2JqX05dKTtcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBkZWVwRXh0ZW5kKC8qb2JqXzEsIFtvYmpfMl0sIFtvYmpfTl0qLykge1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEgfHwgdHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gXCJvYmplY3RcIikge1xuXHRcdHJldHVybiBmYWxzZVxuXHR9XG5cblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG5cdFx0cmV0dXJuIGFyZ3VtZW50c1swXVxuXHR9XG5cblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXVxuXG5cdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0dmFyIG9iaiA9IGFyZ3VtZW50c1tpXVxuXG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0dmFyIHNyYyA9IHRhcmdldFtrZXldXG5cdFx0XHR2YXIgdmFsID0gb2JqW2tleV1cblxuXHRcdFx0aWYgKHR5cGVvZiB2YWwgIT09IFwib2JqZWN0XCIgfHwgdmFsID09PSBudWxsKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gdmFsXG5cblx0XHRcdFx0Ly8ganVzdCBjbG9uZSBhcnJheXMgKGFuZCByZWN1cnNpdmUgY2xvbmUgb2JqZWN0cyBpbnNpZGUpXG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBzcmMgIT09IFwib2JqZWN0XCIgfHwgc3JjID09PSBudWxsKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZCh7fSwgdmFsKVxuXG5cdFx0XHRcdC8vIHNvdXJjZSB2YWx1ZSBhbmQgbmV3IHZhbHVlIGlzIG9iamVjdHMgYm90aCwgZXh0ZW5kaW5nLi4uXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoc3JjLCB2YWwpXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRhcmdldFxufVxuIiwidmFyIGV2YWx1YXRlQnJvd3NlciA9IHJlcXVpcmUoXCIuL2V2YWx1YXRlQnJvd3NlclwiKVxudmFyIGxhbmd1YWdlTWVzc2FnZXMgPSByZXF1aXJlKFwiLi9sYW5ndWFnZXMuanNvblwiKVxudmFyIGRlZXBFeHRlbmQgPSByZXF1aXJlKFwiLi9leHRlbmRcIilcbnZhciBVc2VyQWdlbnRQYXJzZXIgPSByZXF1aXJlKFwidWEtcGFyc2VyLWpzXCIpXG5cbnZhciBDT0xPUlMgPSB7XG5cdHNhbG1vbjogXCIjZjI1NjQ4XCIsXG5cdHdoaXRlOiBcIndoaXRlXCJcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG5cdHZhciBtYWluID0gZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRGVzcGl0ZSB0aGUgZG9jcywgVUEgbmVlZHMgdG8gYmUgcHJvdmlkZWQgdG8gY29uc3RydWN0b3IgZXhwbGljaXRseTpcblx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZmFpc2FsbWFuL3VhLXBhcnNlci1qcy9pc3N1ZXMvOTBcblx0XHR2YXIgcGFyc2VkVXNlckFnZW50ID0gbmV3IFVzZXJBZ2VudFBhcnNlcihuYXZpZ2F0b3IudXNlckFnZW50KS5nZXRSZXN1bHQoKVxuXG5cdFx0Ly8gVmFyaWFibGUgZGVmaW5pdGlvbiAoYmVmb3JlIGFqYXgpXG5cdFx0dmFyIG91dGRhdGVkVUkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm91dGRhdGVkXCIpXG5cblx0XHQvLyBTZXQgZGVmYXVsdCBvcHRpb25zXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuXHRcdHZhciBicm93c2VyTG9jYWxlID0gd2luZG93Lm5hdmlnYXRvci5sYW5ndWFnZSB8fCB3aW5kb3cubmF2aWdhdG9yLnVzZXJMYW5ndWFnZSAvLyBFdmVyeW9uZSBlbHNlLCBJRVxuXHRcdC8vIENTUyBwcm9wZXJ0eSB0byBjaGVjayBmb3IuIFlvdSBtYXkgYWxzbyBsaWtlICdib3JkZXJTcGFjaW5nJywgJ2JveFNoYWRvdycsICd0cmFuc2Zvcm0nLCAnYm9yZGVySW1hZ2UnO1xuXHRcdHZhciBiYWNrZ3JvdW5kQ29sb3IgPSBvcHRpb25zLmJhY2tncm91bmRDb2xvciB8fCBDT0xPUlMuc2FsbW9uXG5cdFx0dmFyIHRleHRDb2xvciA9IG9wdGlvbnMudGV4dENvbG9yIHx8IENPTE9SUy53aGl0ZVxuXHRcdHZhciBmdWxsc2NyZWVuID0gb3B0aW9ucy5mdWxsc2NyZWVuIHx8IGZhbHNlXG5cdFx0dmFyIGxhbmd1YWdlID0gb3B0aW9ucy5sYW5ndWFnZSB8fCBicm93c2VyTG9jYWxlLnNsaWNlKDAsIDIpIC8vIExhbmd1YWdlIGNvZGVcblxuXHRcdHZhciB1cGRhdGVTb3VyY2UgPSBcIndlYlwiIC8vIE90aGVyIHBvc3NpYmxlIHZhbHVlcyBhcmUgJ2dvb2dsZVBsYXknIG9yICdhcHBTdG9yZScuIERldGVybWluZXMgd2hlcmUgd2UgdGVsbCB1c2VycyB0byBnbyBmb3IgdXBncmFkZXMuXG5cblx0XHQvLyBDaHJvbWUgbW9iaWxlIGlzIHN0aWxsIENocm9tZSAodW5saWtlIFNhZmFyaSB3aGljaCBpcyAnTW9iaWxlIFNhZmFyaScpXG5cdFx0dmFyIGlzQW5kcm9pZCA9IHBhcnNlZFVzZXJBZ2VudC5vcy5uYW1lID09PSBcIkFuZHJvaWRcIlxuXHRcdGlmIChpc0FuZHJvaWQpIHtcblx0XHRcdHVwZGF0ZVNvdXJjZSA9IFwiZ29vZ2xlUGxheVwiXG5cdFx0fSBlbHNlIGlmICAocGFyc2VkVXNlckFnZW50Lm9zLm5hbWUgPT09IFwiaU9TXCIpIHtcblx0XHRcdHVwZGF0ZVNvdXJjZSA9IFwiYXBwU3RvcmVcIlxuXHRcdH1cblxuXHRcdHZhciBpc0Jyb3dzZXJVbnN1cHBvcnRlZCA9IGZhbHNlIC8vIHNldCBsYXRlciBhZnRlciBicm93c2VyIGV2YWx1YXRpb25cblxuXHRcdHZhciBkb25lID0gdHJ1ZVxuXG5cdFx0dmFyIGNoYW5nZU9wYWNpdHkgPSBmdW5jdGlvbiAob3BhY2l0eVZhbHVlKSB7XG5cdFx0XHRvdXRkYXRlZFVJLnN0eWxlLm9wYWNpdHkgPSBvcGFjaXR5VmFsdWUgLyAxMDBcblx0XHRcdG91dGRhdGVkVUkuc3R5bGUuZmlsdGVyID0gXCJhbHBoYShvcGFjaXR5PVwiICsgb3BhY2l0eVZhbHVlICsgXCIpXCJcblx0XHR9XG5cdFxuXHRcdHZhciBmYWRlSW4gPSBmdW5jdGlvbiAob3BhY2l0eVZhbHVlKSB7XG5cdFx0XHRjaGFuZ2VPcGFjaXR5KG9wYWNpdHlWYWx1ZSlcblx0XHRcdGlmIChvcGFjaXR5VmFsdWUgPT09IDEpIHtcblx0XHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5kaXNwbGF5ID0gXCJ0YWJsZVwiXG5cdFx0XHR9XG5cdFx0XHRpZiAob3BhY2l0eVZhbHVlID09PSAxMDApIHtcblx0XHRcdFx0ZG9uZSA9IHRydWVcblx0XHRcdH1cblx0XHR9XG5cdFxuXHRcdHZhciBtYWtlRmFkZUluRnVuY3Rpb24gPSBmdW5jdGlvbiAob3BhY2l0eVZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRmYWRlSW4ob3BhY2l0eVZhbHVlKVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFN0eWxlIGVsZW1lbnQgZXhwbGljaXRseSAtIFRPRE86IGludmVzdGlnYXRlIGFuZCBkZWxldGUgaWYgbm90IG5lZWRlZFxuXHRcdHZhciBzdGFydFN0eWxlc0FuZEV2ZW50cyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHZhciBidXR0b25DbG9zZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYnV0dG9uQ2xvc2VVcGRhdGVCcm93c2VyXCIpXG5cblx0XHRcdC8vIENvbW1lbnRlZCBvdXQgY29kZSBiZWxvdyBiZWNhdXNlIHRoZSBicm93c2VyIGlzIHByb2JhYmx5IG5vdCBzbyBvbGQgaXQgZG9lc250IHN1cHBvcnQgbG9hZGluZyBhIENTUyBmaWxlXG5cdFx0XHQvLyB2YXIgYnV0dG9uVXBkYXRlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJidXR0b25VcGRhdGVCcm93c2VyXCIpXG5cblx0XHRcdC8vIC8vY2hlY2sgc2V0dGluZ3MgYXR0cmlidXRlc1xuXHRcdFx0Ly8gb3V0ZGF0ZWRVSS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBiYWNrZ3JvdW5kQ29sb3Jcblx0XHRcdC8vIC8vd2F5IHRvbyBoYXJkIHRvIHB1dCAhaW1wb3J0YW50IG9uIElFNlxuXHRcdFx0Ly8gb3V0ZGF0ZWRVSS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0Ly8gb3V0ZGF0ZWRVSS5jaGlsZHJlblswXS5jaGlsZHJlblswXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0Ly8gb3V0ZGF0ZWRVSS5jaGlsZHJlblswXS5jaGlsZHJlblsxXS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0Ly9cblx0XHRcdC8vIC8vIFVwZGF0ZSBidXR0b24gaXMgZGVza3RvcCBvbmx5XG5cdFx0XHQvLyBpZiAoYnV0dG9uVXBkYXRlKSB7XG5cdFx0XHQvLyBcdGJ1dHRvblVwZGF0ZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0Ly8gXHRpZiAoYnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yKSB7XG5cdFx0XHQvLyBcdFx0YnV0dG9uVXBkYXRlLnN0eWxlLmJvcmRlckNvbG9yID0gdGV4dENvbG9yXG5cdFx0XHQvLyBcdH1cblx0XHRcdC8vXG5cdFx0XHQvLyBcdC8vIE92ZXJyaWRlIHRoZSB1cGRhdGUgYnV0dG9uIGNvbG9yIHRvIG1hdGNoIHRoZSBiYWNrZ3JvdW5kIGNvbG9yXG5cdFx0XHQvLyBcdGJ1dHRvblVwZGF0ZS5vbm1vdXNlb3ZlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdC8vIFx0XHR0aGlzLnN0eWxlLmNvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHQvLyBcdFx0dGhpcy5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSB0ZXh0Q29sb3Jcblx0XHRcdC8vIFx0fVxuXHRcdFx0Ly9cblx0XHRcdC8vIFx0YnV0dG9uVXBkYXRlLm9ubW91c2VvdXQgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHQvLyBcdFx0dGhpcy5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXHRcdFx0Ly8gXHRcdHRoaXMuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gYmFja2dyb3VuZENvbG9yXG5cdFx0XHQvLyBcdH1cblx0XHRcdC8vIH1cblx0XHRcdC8vXG5cdFx0XHQvLyBidXR0b25DbG9zZS5zdHlsZS5jb2xvciA9IHRleHRDb2xvclxuXG5cdFx0XHRidXR0b25DbG9zZS5vbm1vdXNlZG93biA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0b3V0ZGF0ZWRVSS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCJcblx0XHRcdFx0cmV0dXJuIGZhbHNlXG5cdFx0XHR9XG5cdFx0fVxuXHRcblx0XHR2YXIgZ2V0TWVzc2FnZSA9IGZ1bmN0aW9uIChsYW5nKSB7XG5cdFx0XHR2YXIgZGVmYXVsdE1lc3NhZ2VzID0gbGFuZ3VhZ2VNZXNzYWdlc1tsYW5nXSB8fCBsYW5ndWFnZU1lc3NhZ2VzLmVuXG5cdFx0XHR2YXIgY3VzdG9tTWVzc2FnZXMgPSBvcHRpb25zLm1lc3NhZ2VzICYmIG9wdGlvbnMubWVzc2FnZXNbbGFuZ11cblx0XHRcdHZhciBtZXNzYWdlcyA9IGRlZXBFeHRlbmQoe30sIGRlZmF1bHRNZXNzYWdlcywgY3VzdG9tTWVzc2FnZXMpXG5cdFxuXHRcdFx0dmFyIHVwZGF0ZU1lc3NhZ2VzID0ge1xuXHRcdFx0XHR3ZWI6XG5cdFx0XHRcdFx0XCI8cD5cIiArXG5cdFx0XHRcdFx0bWVzc2FnZXMudXBkYXRlLndlYiArXG5cdFx0XHRcdFx0KG1lc3NhZ2VzLnVybCA/IChcblx0XHRcdFx0XHRcdCc8YSBpZD1cImJ1dHRvblVwZGF0ZUJyb3dzZXJcIiByZWw9XCJub2ZvbGxvd1wiIGhyZWY9XCInICtcblx0XHRcdFx0XHRcdG1lc3NhZ2VzLnVybCArXG5cdFx0XHRcdFx0XHQnXCI+JyArXG5cdFx0XHRcdFx0XHRtZXNzYWdlcy5jYWxsVG9BY3Rpb24gK1xuXHRcdFx0XHRcdFx0XCI8L2E+XCJcblx0XHRcdFx0XHQpIDogJycpICtcblx0XHRcdFx0XHRcIjwvcD5cIixcblx0XHRcdFx0Z29vZ2xlUGxheTpcblx0XHRcdFx0XHRcIjxwPlwiICtcblx0XHRcdFx0XHRtZXNzYWdlcy51cGRhdGUuZ29vZ2xlUGxheSArXG5cdFx0XHRcdFx0JzxhIGlkPVwiYnV0dG9uVXBkYXRlQnJvd3NlclwiIHJlbD1cIm5vZm9sbG93XCIgaHJlZj1cImh0dHBzOi8vcGxheS5nb29nbGUuY29tL3N0b3JlL2FwcHMvZGV0YWlscz9pZD1jb20uYW5kcm9pZC5jaHJvbWVcIj4nICtcblx0XHRcdFx0XHRtZXNzYWdlcy5jYWxsVG9BY3Rpb24gK1xuXHRcdFx0XHRcdFwiPC9hPjwvcD5cIixcblx0XHRcdFx0YXBwU3RvcmU6IFwiPHA+XCIgKyBtZXNzYWdlcy51cGRhdGVbdXBkYXRlU291cmNlXSArIFwiPC9wPlwiXG5cdFx0XHR9XG5cdFxuXHRcdFx0dmFyIHVwZGF0ZU1lc3NhZ2UgPSB1cGRhdGVNZXNzYWdlc1t1cGRhdGVTb3VyY2VdXG5cdFxuXHRcdFx0dmFyIGJyb3dzZXJTdXBwb3J0TWVzc2FnZSA9IG1lc3NhZ2VzLm91dE9mRGF0ZTtcblx0XHRcdGlmIChpc0Jyb3dzZXJVbnN1cHBvcnRlZCAmJiBtZXNzYWdlcy51bnN1cHBvcnRlZCkge1xuXHRcdFx0XHRicm93c2VyU3VwcG9ydE1lc3NhZ2UgPSBtZXNzYWdlcy51bnN1cHBvcnRlZDtcblx0XHRcdH1cblx0XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQnPGRpdiBjbGFzcz1cInZlcnRpY2FsLWNlbnRlclwiPjxoNj4nICtcblx0XHRcdFx0YnJvd3NlclN1cHBvcnRNZXNzYWdlICtcblx0XHRcdFx0XCI8L2g2PlwiICtcblx0XHRcdFx0dXBkYXRlTWVzc2FnZSArXG5cdFx0XHRcdCc8cCBjbGFzcz1cImxhc3RcIj48YSBocmVmPVwiI1wiIGlkPVwiYnV0dG9uQ2xvc2VVcGRhdGVCcm93c2VyXCIgdGl0bGU9XCInICtcblx0XHRcdFx0bWVzc2FnZXMuY2xvc2UgK1xuXHRcdFx0XHQnXCI+JnRpbWVzOzwvYT48L3A+PC9kaXY+J1xuXHRcdFx0KVxuXHRcdH1cblxuXHRcdHZhciByZXN1bHQgPSBldmFsdWF0ZUJyb3dzZXIocGFyc2VkVXNlckFnZW50LCBvcHRpb25zKTtcblx0XHRpZiAocmVzdWx0LmlzQW5kcm9pZEJ1dE5vdENocm9tZSB8fCByZXN1bHQuaXNCcm93c2VyT3V0T2ZEYXRlIHx8ICFyZXN1bHQuaXNQcm9wZXJ0eVN1cHBvcnRlZCkge1xuXHRcdFx0Ly8gVGhpcyBpcyBhbiBvdXRkYXRlZCBicm93c2VyIGFuZCB0aGUgYmFubmVyIG5lZWRzIHRvIHNob3dcblxuXHRcdFx0Ly8gU2V0IHRoaXMgZmxhZyB3aXRoIHRoZSByZXN1bHQgZm9yIGBnZXRNZXNzYWdlYFxuXHRcdFx0aXNCcm93c2VyVW5zdXBwb3J0ZWQgPSByZXN1bHQuaXNCcm93c2VyVW5zdXBwb3J0ZWRcblxuXHRcdFx0aWYgKGRvbmUgJiYgb3V0ZGF0ZWRVSS5zdHlsZS5vcGFjaXR5ICE9PSBcIjFcIikge1xuXHRcdFx0XHRkb25lID0gZmFsc2Vcblx0XG5cdFx0XHRcdGZvciAodmFyIG9wYWNpdHkgPSAxOyBvcGFjaXR5IDw9IDEwMDsgb3BhY2l0eSsrKSB7XG5cdFx0XHRcdFx0c2V0VGltZW91dChtYWtlRmFkZUluRnVuY3Rpb24ob3BhY2l0eSksIG9wYWNpdHkgKiA4KVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFxuXHRcdFx0dmFyIGluc2VydENvbnRlbnRIZXJlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRkYXRlZFwiKVxuXHRcdFx0aWYgKGZ1bGxzY3JlZW4pIHtcblx0XHRcdFx0aW5zZXJ0Q29udGVudEhlcmUuY2xhc3NMaXN0LmFkZChcImZ1bGxzY3JlZW5cIilcblx0XHRcdH1cblx0XHRcdGluc2VydENvbnRlbnRIZXJlLmlubmVySFRNTCA9IGdldE1lc3NhZ2UobGFuZ3VhZ2UpXG5cdFx0XHRzdGFydFN0eWxlc0FuZEV2ZW50cygpXG5cdFx0fVxuXHR9XG5cblx0Ly8gTG9hZCBtYWluIHdoZW4gRE9NIHJlYWR5LlxuXHR2YXIgb2xkT25sb2FkID0gd2luZG93Lm9ubG9hZFxuXHRpZiAodHlwZW9mIHdpbmRvdy5vbmxvYWQgIT09IFwiZnVuY3Rpb25cIikge1xuXHRcdHdpbmRvdy5vbmxvYWQgPSBtYWluXG5cdH0gZWxzZSB7XG5cdFx0d2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKG9sZE9ubG9hZCkge1xuXHRcdFx0XHRvbGRPbmxvYWQoKVxuXHRcdFx0fVxuXHRcdFx0bWFpbigpXG5cdFx0fVxuXHR9XG59XG4iLCJtb2R1bGUuZXhwb3J0cz17XG5cdFwia29cIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwi7LWc7IugIOu4jOudvOyasOyggOqwgCDslYTri5nri4jri6QhXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCLsm7nsgqzsnbTtirjrpbwg7KCc64yA66GcIOuztOugpOuptCDruIzrnbzsmrDsoIDrpbwg7JeF642w7J207Yq47ZWY7IS47JqULlwiLFxuICAgICAgXCJnb29nbGVQbGF5XCI6IFwiR29vZ2xlIFBsYXnsl5DshJwgQ2hyb21l7J2EIOyEpOy5mO2VmOyEuOyalFwiLFxuICAgICAgXCJhcHBTdG9yZVwiOiBcIuyEpOyglSDslbHsl5DshJwgaU9T66W8IOyXheuNsOydtO2KuO2VmOyEuOyalFwiXG4gICAgfSxcbiAgICBcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcbiAgICBcImNhbGxUb0FjdGlvblwiOiBcIuyngOq4iCDruIzrnbzsmrDsoIAg7JeF642w7J207Yq47ZWY6riwXCIsXG4gICAgXCJjbG9zZVwiOiBcIuuLq+q4sFwiXG4gIH0sXG4gIFwiamFcIjoge1xuICAgIFwib3V0T2ZEYXRlXCI6IFwi5Y+k44GE44OW44Op44Km44K244KS44GK5L2/44GE44Gu44KI44GG44Gn44GZ44CCXCIsXG4gICAgXCJ1cGRhdGVcIjoge1xuICAgICAgXCJ3ZWJcIjogXCLjgqbjgqfjg5bjgrXjgqTjg4jjgpLmraPjgZfjgY/ooajnpLrjgafjgY3jgovjgojjgYbjgavjgIHjg5bjg6njgqbjgrbjgpLjgqLjg4Pjg5fjg4fjg7zjg4jjgZfjgabjgY/jgaDjgZXjgYTjgIJcIixcbiAgICAgIFwiZ29vZ2xlUGxheVwiOiBcIkdvb2dsZSBQbGF544GL44KJQ2hyb21l44KS44Kk44Oz44K544OI44O844Or44GX44Gm44GP44Gg44GV44GEXCIsXG4gICAgICBcImFwcFN0b3JlXCI6IFwi6Kit5a6a44GL44KJaU9T44KS44Ki44OD44OX44OH44O844OI44GX44Gm44GP44Gg44GV44GEXCJcbiAgICB9LFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuICAgIFwiY2FsbFRvQWN0aW9uXCI6IFwi5LuK44GZ44GQ44OW44Op44Km44K244KS44Ki44OD44OX44OH44O844OI44GZ44KLXCIsXG4gICAgXCJjbG9zZVwiOiBcIumWieOBmOOCi1wiXG4gIH0sIFxuXHRcImJyXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIk8gc2V1IG5hdmVnYWRvciBlc3QmYWFjdXRlOyBkZXNhdHVhbGl6YWRvIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiQXR1YWxpemUgbyBzZXUgbmF2ZWdhZG9yIHBhcmEgdGVyIHVtYSBtZWxob3IgZXhwZXJpJmVjaXJjO25jaWEgZSB2aXN1YWxpemEmY2NlZGlsOyZhdGlsZGU7byBkZXN0ZSBzaXRlLiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcblx0XHR9LFxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQXR1YWxpemUgbyBzZXUgbmF2ZWdhZG9yIGFnb3JhXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkZlY2hhclwiXG5cdH0sXG5cdFwiY2FcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiRWwgdm9zdHJlIG5hdmVnYWRvciBubyBlc3TDoCBhY3R1YWxpdHphdCFcIixcblx0XHRcInVwZGF0ZVwiOiB7XG5cdFx0XHRcIndlYlwiOiBcIkFjdHVhbGl0emV1IGVsIHZvc3RyZSBuYXZlZ2Fkb3IgcGVyIHZldXJlIGNvcnJlY3RhbWVudCBhcXVlc3QgbGxvYyB3ZWIuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiSW5zdGFswrdsZXUgQ2hyb21lIGRlcyBkZSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIkFjdHVhbGl0emV1IGlPUyBkZXMgZGUgbCdhcGxpY2FjacOzIENvbmZpZ3VyYWNpw7NcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBY3R1YWxpdHphciBlbCBtZXUgbmF2ZWdhZG9yIGFyYVwiLFxuXHRcdFwiY2xvc2VcIjogXCJUYW5jYXJcIlxuXHR9LFxuXHRcInpoXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIuaCqOeahOa1j+iniOWZqOW3sui/h+aXtlwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwi6KaB5q2j5bi45rWP6KeI5pys572R56uZ6K+35Y2H57qn5oKo55qE5rWP6KeI5Zmo44CCXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIueOsOWcqOWNh+e6p1wiLFxuXHRcdFwiY2xvc2VcIjogXCLlhbPpl61cIlxuXHR9LFxuXHRcImN6XCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlbDocWhIHByb2hsw63FvmXEjSBqZSB6YXN0YXJhbMO9IVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiUHJvIHNwcsOhdm7DqSB6b2JyYXplbsOtIHTEm2NodG8gc3Ryw6FuZWsgYWt0dWFsaXp1anRlIHN2xa9qIHByb2hsw63FvmXEjS4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJOYWluc3RhbHVqdGUgc2kgQ2hyb21lIHogR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJBa3R1YWxpenVqdGUgc2kgc3lzdMOpbSBpT1NcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBa3R1YWxpem92YXQgbnluw60gc3bFr2ogcHJvaGzDrcW+ZcSNXCIsXG5cdFx0XCJjbG9zZVwiOiBcIlphdsWZw610XCJcblx0fSxcblx0XCJkYVwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJEaW4gYnJvd3NlciBlciBmb3LDpmxkZXQhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJPcGRhdMOpciBkaW4gYnJvd3NlciBmb3IgYXQgZsOlIHZpc3QgZGVubmUgaGplbW1lc2lkZSBrb3JyZWt0LiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIkluc3RhbGzDqXIgdmVubGlnc3QgQ2hyb21lIGZyYSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIk9wZGF0w6lyIHZlbmxpZ3N0IGlPU1wiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIk9wZGF0w6lyIGRpbiBicm93c2VyIG51XCIsXG5cdFx0XCJjbG9zZVwiOiBcIkx1a1wiXG5cdH0sXG5cdFwiZGVcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiSWhyIEJyb3dzZXIgaXN0IHZlcmFsdGV0IVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiQml0dGUgYWt0dWFsaXNpZXJlbiBTaWUgSWhyZW4gQnJvd3NlciwgdW0gZGllc2UgV2Vic2l0ZSBrb3JyZWt0IGRhcnp1c3RlbGxlbi4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkRlbiBCcm93c2VyIGpldHp0IGFrdHVhbGlzaWVyZW4gXCIsXG5cdFx0XCJjbG9zZVwiOiBcIlNjaGxpZcOfZW5cIlxuXHR9LFxuXHRcImVlXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlNpbnUgdmVlYmlsZWhpdHNlamEgb24gdmFuYW5lbnVkIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiUGFsdW4gdXVlbmRhIG9tYSB2ZWViaWxlaGl0c2VqYXQsIGV0IG7DpGhhIGxlaGVrw7xsZ2Uga29ycmVrdHNlbHQuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJVdWVuZGEgb21hIHZlZWJpbGVoaXRzZWphdCBrb2hlXCIsXG5cdFx0XCJjbG9zZVwiOiBcIlN1bGdlXCJcblx0fSxcblx0XCJlblwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJZb3VyIGJyb3dzZXIgaXMgb3V0LW9mLWRhdGUhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJVcGRhdGUgeW91ciBicm93c2VyIHRvIHZpZXcgdGhpcyB3ZWJzaXRlIGNvcnJlY3RseS4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlVwZGF0ZSBteSBicm93c2VyIG5vd1wiLFxuXHRcdFwiY2xvc2VcIjogXCJDbG9zZVwiXG5cdH0sXG5cdFwiZXNcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiwqFUdSBuYXZlZ2Fkb3IgZXN0w6EgYW50aWN1YWRvIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiQWN0dWFsaXphIHR1IG5hdmVnYWRvciBwYXJhIHZlciBlc3RhIHDDoWdpbmEgY29ycmVjdGFtZW50ZS4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkFjdHVhbGl6YXIgbWkgbmF2ZWdhZG9yIGFob3JhXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkNlcnJhclwiXG5cdH0sXG5cdFwiZmFcIjoge1xuXHRcdFwicmlnaHRUb0xlZnRcIjogdHJ1ZSxcblx0XHRcIm91dE9mRGF0ZVwiOiBcItmF2LHZiNix2q/YsSDYtNmF2Kcg2YXZhtiz2YjYriDYtNiv2Ycg2KfYs9iqIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwi2KzZh9iqINmF2LTYp9mH2K/ZhyDYtdit24zYrSDYp9uM2YYg2YjYqNiz2KfbjNiq2Iwg2YXYsdmI2LHar9ix2KrYp9mGINix2Kcg2KjYsdmI2LIg2LHYs9in2YbbjCDZhtmF2KfbjNuM2K8uIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCLZh9mF24zZhiDYrdin2YTYpyDZhdix2YjYsdqv2LHZhSDYsdinINio2LHZiNiyINqp2YZcIixcblx0XHRcImNsb3NlXCI6IFwiQ2xvc2VcIlxuXHR9LFxuXHRcImZpXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIlNlbGFpbWVzaSBvbiB2YW5oZW50dW51dCFcIixcblx0XHRcInVwZGF0ZVwiOiB7XG5cdFx0XHRcIndlYlwiOiBcIkxhdGFhIGFqYW50YXNhaW5lbiBzZWxhaW4gbiZhdW1sO2hkJmF1bWw7a3Nlc2kgdCZhdW1sO20mYXVtbDtuIHNpdnVuIG9pa2Vpbi4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJBc2VubmEgdXVzaW4gQ2hyb21lIEdvb2dsZSBQbGF5IC1rYXVwYXN0YVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlDDpGl2aXTDpCBpT1MgcHVoZWxpbWVzaSBhc2V0dWtzaXN0YVwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlAmYXVtbDtpdml0JmF1bWw7IHNlbGFpbWVuaSBueXQgXCIsXG5cdFx0XCJjbG9zZVwiOiBcIlN1bGplXCJcblx0fSxcblx0XCJmclwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJWb3RyZSBuYXZpZ2F0ZXVyIG4nZXN0IHBsdXMgY29tcGF0aWJsZSAhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJNZXR0ZXogw6Agam91ciB2b3RyZSBuYXZpZ2F0ZXVyIHBvdXIgYWZmaWNoZXIgY29ycmVjdGVtZW50IGNlIHNpdGUgV2ViLiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIk1lcmNpIGQnaW5zdGFsbGVyIENocm9tZSBkZXB1aXMgbGUgR29vZ2xlIFBsYXkgU3RvcmVcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJNZXJjaSBkZSBtZXR0cmUgw6Agam91ciBpT1MgZGVwdWlzIGwnYXBwbGljYXRpb24gUsOpZ2xhZ2VzXCJcblx0XHR9LFxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiTWV0dHJlIMOgIGpvdXIgbWFpbnRlbmFudCBcIixcblx0XHRcImNsb3NlXCI6IFwiRmVybWVyXCJcblx0fSxcblx0XCJodVwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJBIGLDtm5nw6lzesWRamUgZWxhdnVsdCFcIixcblx0XHRcInVwZGF0ZVwiOiB7XG5cdFx0XHRcIndlYlwiOiBcIkZpcnNzw610c2UgdmFneSBjc2Vyw6lsamUgbGUgYSBiw7ZuZ8Opc3rFkWrDqXQuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBIGLDtm5nw6lzesWRbSBmcmlzc8OtdMOpc2UgXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcblx0fSxcblx0XCJpZFwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJCcm93c2VyIHlhbmcgQW5kYSBndW5ha2FuIHN1ZGFoIGtldGluZ2dhbGFuIHphbWFuIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiUGVyYmFoYXJ1aWxhaCBicm93c2VyIEFuZGEgYWdhciBiaXNhIG1lbmplbGFqYWhpIHdlYnNpdGUgaW5pIGRlbmdhbiBueWFtYW4uIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJQZXJiYWhhcnVpIGJyb3dzZXIgc2VrYXJhbmcgXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcblx0fSxcblx0XCJpdFwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCJJbCB0dW8gYnJvd3NlciBub24gJmVncmF2ZTsgYWdnaW9ybmF0byFcIixcblx0XHRcInVwZGF0ZVwiOiB7XG5cdFx0XHRcIndlYlwiOiBcIkFnZ2lvcm5hbG8gcGVyIHZlZGVyZSBxdWVzdG8gc2l0byBjb3JyZXR0YW1lbnRlLiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcblx0XHR9LFxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiQWdnaW9ybmEgb3JhXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkNoaXVkaVwiXG5cdH0sXG5cdFwibHRcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiSsWrc8WzIG5hcsWheWtsxJdzIHZlcnNpamEgeXJhIHBhc2VudXNpIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiQXRuYXVqaW5raXRlIHNhdm8gbmFyxaF5a2zEmSwga2FkIGdhbMSXdHVtxJd0ZSBwZXLFvmnFq3LEl3RpIMWhacSFIHN2ZXRhaW7EmSB0aW5rYW1haS4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIkF0bmF1amludGkgbmFyxaF5a2zEmSBcIixcblx0XHRcImNsb3NlXCI6IFwiQ2xvc2VcIlxuXHR9LFxuXHRcIm5sXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkplIGdlYnJ1aWt0IGVlbiBvdWRlIGJyb3dzZXIhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJVcGRhdGUgamUgYnJvd3NlciBvbSBwcm9ibGVtZW4gdGUgdm9vcmtvbWVuLiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcblx0XHR9LFxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBkYXRlIG1pam4gYnJvd3NlciBudSBcIixcblx0XHRcImNsb3NlXCI6IFwiU2x1aXRlblwiXG5cdH0sXG5cdFwicGxcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBqZXN0IHByemVzdGFyemHFgmEhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJaYWt0dWFsaXp1aiBzd29qxIUgcHJ6ZWdsxIVkYXJrxJksIGFieSBwb3ByYXduaWUgd3nFm3dpZXRsacSHIHTEmSBzdHJvbsSZLiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlByb3N6xJkgemFpbnN0YWxvd2HEhyBwcnplZ2zEhWRhcmvEmSBDaHJvbWUgemUgc2tsZXB1IEdvb2dsZSBQbGF5XCIsXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUHJvc3rEmSB6YWt0dWFsaXpvd2HEhyBpT1MgeiBVc3Rhd2llxYRcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJaYWt0dWFsaXp1aiBwcnplZ2zEhWRhcmvEmSBqdcW8IHRlcmF6XCIsXG5cdFx0XCJjbG9zZVwiOiBcIlphbWtuaWpcIlxuXHR9LFxuXHRcInB0XCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIk8gc2V1IGJyb3dzZXIgZXN0JmFhY3V0ZTsgZGVzYXR1YWxpemFkbyFcIixcblx0XHRcInVwZGF0ZVwiOiB7XG5cdFx0XHRcIndlYlwiOiBcIkF0dWFsaXplIG8gc2V1IGJyb3dzZXIgcGFyYSB0ZXIgdW1hIG1lbGhvciBleHBlcmkmZWNpcmM7bmNpYSBlIHZpc3VhbGl6YSZjY2VkaWw7JmF0aWxkZTtvIGRlc3RlIHNpdGUuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBdHVhbGl6ZSBvIHNldSBicm93c2VyIGFnb3JhXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkZlY2hhclwiXG5cdH0sXG5cdFwicm9cIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiQnJvd3NlcnVsIGVzdGUgw65udmVjaGl0IVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwiQWN0dWFsaXphyJtpIGJyb3dzZXJ1bCBwZW50cnUgYSB2aXp1YWxpemEgY29yZWN0IGFjZXN0IHNpdGUuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCJBY3R1YWxpemHIm2kgYnJvd3NlcnVsIGFjdW0hXCIsXG5cdFx0XCJjbG9zZVwiOiBcIkNsb3NlXCJcblx0fSxcblx0XCJydVwiOiB7XG5cdFx0XCJvdXRPZkRhdGVcIjogXCLQktCw0Ygg0LHRgNCw0YPQt9C10YAg0YPRgdGC0LDRgNC10LshXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCLQntCx0L3QvtCy0LjRgtC1INCy0LDRiCDQsdGA0LDRg9C30LXRgCDQtNC70Y8g0L/RgNCw0LLQuNC70YzQvdC+0LPQviDQvtGC0L7QsdGA0LDQttC10L3QuNGPINGN0YLQvtCz0L4g0YHQsNC50YLQsC4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcItCe0LHQvdC+0LLQuNGC0Ywg0LzQvtC5INCx0YDQsNGD0LfQtdGAIFwiLFxuXHRcdFwiY2xvc2VcIjogXCLQl9Cw0LrRgNGL0YLRjFwiXG5cdH0sXG5cdFwic2lcIjoge1xuXHRcdFwib3V0T2ZEYXRlXCI6IFwiVmHFoSBicnNrYWxuaWsgamUgemFzdGFyZWwhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJaYSBwcmF2aWxlbiBwcmlrYXogc3BsZXRuZSBzdHJhbmkgcG9zb2RvYml0ZSB2YcWhIGJyc2thbG5pay4gXCIsXG5cdFx0XHRcImdvb2dsZVBsYXlcIjogXCJQbGVhc2UgaW5zdGFsbCBDaHJvbWUgZnJvbSBHb29nbGUgUGxheVwiLFxuXHRcdFx0XCJhcHBTdG9yZVwiOiBcIlBsZWFzZSB1cGRhdGUgaU9TIGZyb20gdGhlIFNldHRpbmdzIEFwcFwiXG5cdFx0fSxcblx0XHRcInVybFwiOiBcImh0dHBzOi8vYnJvd3Nlci11cGRhdGUub3JnL3VwZGF0ZS1icm93c2VyLmh0bWxcIixcblx0XHRcImNhbGxUb0FjdGlvblwiOiBcIlBvc29kb2JpIGJyc2thbG5payBcIixcblx0XHRcImNsb3NlXCI6IFwiWmFwcmlcIlxuXHR9LFxuXHRcInN2XCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcIkRpbiB3ZWJibMOkc2FyZSBzdMO2ZGpzIGVqIGzDpG5ncmUhXCIsXG5cdFx0XCJ1cGRhdGVcIjoge1xuXHRcdFx0XCJ3ZWJcIjogXCJVcHBkYXRlcmEgZGluIHdlYmJsw6RzYXJlIGbDtnIgYXR0IHdlYmJwbGF0c2VuIHNrYSB2aXNhcyBrb3JyZWt0LiBcIixcblx0XHRcdFwiZ29vZ2xlUGxheVwiOiBcIlBsZWFzZSBpbnN0YWxsIENocm9tZSBmcm9tIEdvb2dsZSBQbGF5XCIsXG5cdFx0XHRcImFwcFN0b3JlXCI6IFwiUGxlYXNlIHVwZGF0ZSBpT1MgZnJvbSB0aGUgU2V0dGluZ3MgQXBwXCJcblx0XHR9LFxuXHRcdFwidXJsXCI6IFwiaHR0cHM6Ly9icm93c2VyLXVwZGF0ZS5vcmcvdXBkYXRlLWJyb3dzZXIuaHRtbFwiLFxuXHRcdFwiY2FsbFRvQWN0aW9uXCI6IFwiVXBwZGF0ZXJhIG1pbiB3ZWJibMOkc2FyZSBudVwiLFxuXHRcdFwiY2xvc2VcIjogXCJTdMOkbmdcIlxuXHR9LFxuXHRcInVhXCI6IHtcblx0XHRcIm91dE9mRGF0ZVwiOiBcItCS0LDRiCDQsdGA0LDRg9C30LXRgCDQt9Cw0YHRgtCw0YDRltCyIVwiLFxuXHRcdFwidXBkYXRlXCI6IHtcblx0XHRcdFwid2ViXCI6IFwi0J7QvdC+0LLRltGC0Ywg0LLQsNGIINCx0YDQsNGD0LfQtdGAINC00LvRjyDQv9GA0LDQstC40LvRjNC90L7Qs9C+INCy0ZbQtNC+0LHRgNCw0LbQtdC90L3RjyDRhtGM0L7Qs9C+INGB0LDQudGC0LAuIFwiLFxuXHRcdFx0XCJnb29nbGVQbGF5XCI6IFwiUGxlYXNlIGluc3RhbGwgQ2hyb21lIGZyb20gR29vZ2xlIFBsYXlcIixcblx0XHRcdFwiYXBwU3RvcmVcIjogXCJQbGVhc2UgdXBkYXRlIGlPUyBmcm9tIHRoZSBTZXR0aW5ncyBBcHBcIlxuXHRcdH0sXG5cdFx0XCJ1cmxcIjogXCJodHRwczovL2Jyb3dzZXItdXBkYXRlLm9yZy91cGRhdGUtYnJvd3Nlci5odG1sXCIsXG5cdFx0XCJjYWxsVG9BY3Rpb25cIjogXCLQntC90L7QstC40YLQuCDQvNGW0Lkg0LHRgNCw0YPQt9C10YAgXCIsXG5cdFx0XCJjbG9zZVwiOiBcItCX0LDQutGA0LjRgtC4XCJcblx0fVxufVxuIiwiLyohXG4gKiBVQVBhcnNlci5qcyB2MC43LjIyXG4gKiBMaWdodHdlaWdodCBKYXZhU2NyaXB0LWJhc2VkIFVzZXItQWdlbnQgc3RyaW5nIHBhcnNlclxuICogaHR0cHM6Ly9naXRodWIuY29tL2ZhaXNhbG1hbi91YS1wYXJzZXItanNcbiAqXG4gKiBDb3B5cmlnaHQgwqkgMjAxMi0yMDE5IEZhaXNhbCBTYWxtYW4gPGZAZmFpc2FsbWFuLmNvbT5cbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCBMaWNlbnNlXG4gKi9cblxuKGZ1bmN0aW9uICh3aW5kb3csIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBDb25zdGFudHNcbiAgICAvLy8vLy8vLy8vLy8vXG5cblxuICAgIHZhciBMSUJWRVJTSU9OICA9ICcwLjcuMjInLFxuICAgICAgICBFTVBUWSAgICAgICA9ICcnLFxuICAgICAgICBVTktOT1dOICAgICA9ICc/JyxcbiAgICAgICAgRlVOQ19UWVBFICAgPSAnZnVuY3Rpb24nLFxuICAgICAgICBVTkRFRl9UWVBFICA9ICd1bmRlZmluZWQnLFxuICAgICAgICBPQkpfVFlQRSAgICA9ICdvYmplY3QnLFxuICAgICAgICBTVFJfVFlQRSAgICA9ICdzdHJpbmcnLFxuICAgICAgICBNQUpPUiAgICAgICA9ICdtYWpvcicsIC8vIGRlcHJlY2F0ZWRcbiAgICAgICAgTU9ERUwgICAgICAgPSAnbW9kZWwnLFxuICAgICAgICBOQU1FICAgICAgICA9ICduYW1lJyxcbiAgICAgICAgVFlQRSAgICAgICAgPSAndHlwZScsXG4gICAgICAgIFZFTkRPUiAgICAgID0gJ3ZlbmRvcicsXG4gICAgICAgIFZFUlNJT04gICAgID0gJ3ZlcnNpb24nLFxuICAgICAgICBBUkNISVRFQ1RVUkU9ICdhcmNoaXRlY3R1cmUnLFxuICAgICAgICBDT05TT0xFICAgICA9ICdjb25zb2xlJyxcbiAgICAgICAgTU9CSUxFICAgICAgPSAnbW9iaWxlJyxcbiAgICAgICAgVEFCTEVUICAgICAgPSAndGFibGV0JyxcbiAgICAgICAgU01BUlRUViAgICAgPSAnc21hcnR0dicsXG4gICAgICAgIFdFQVJBQkxFICAgID0gJ3dlYXJhYmxlJyxcbiAgICAgICAgRU1CRURERUQgICAgPSAnZW1iZWRkZWQnO1xuXG5cbiAgICAvLy8vLy8vLy8vL1xuICAgIC8vIEhlbHBlclxuICAgIC8vLy8vLy8vLy9cblxuXG4gICAgdmFyIHV0aWwgPSB7XG4gICAgICAgIGV4dGVuZCA6IGZ1bmN0aW9uIChyZWdleGVzLCBleHRlbnNpb25zKSB7XG4gICAgICAgICAgICB2YXIgbWVyZ2VkUmVnZXhlcyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIgaSBpbiByZWdleGVzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4dGVuc2lvbnNbaV0gJiYgZXh0ZW5zaW9uc1tpXS5sZW5ndGggJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlZFJlZ2V4ZXNbaV0gPSBleHRlbnNpb25zW2ldLmNvbmNhdChyZWdleGVzW2ldKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtZXJnZWRSZWdleGVzW2ldID0gcmVnZXhlc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWVyZ2VkUmVnZXhlcztcbiAgICAgICAgfSxcbiAgICAgICAgaGFzIDogZnVuY3Rpb24gKHN0cjEsIHN0cjIpIHtcbiAgICAgICAgICBpZiAodHlwZW9mIHN0cjEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBzdHIyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzdHIxLnRvTG93ZXJDYXNlKCkpICE9PSAtMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbG93ZXJpemUgOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIG1ham9yIDogZnVuY3Rpb24gKHZlcnNpb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YodmVyc2lvbikgPT09IFNUUl9UWVBFID8gdmVyc2lvbi5yZXBsYWNlKC9bXlxcZFxcLl0vZywnJykuc3BsaXQoXCIuXCIpWzBdIDogdW5kZWZpbmVkO1xuICAgICAgICB9LFxuICAgICAgICB0cmltIDogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICAgIHJldHVybiBzdHIucmVwbGFjZSgvXltcXHNcXHVGRUZGXFx4QTBdK3xbXFxzXFx1RkVGRlxceEEwXSskL2csICcnKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vL1xuICAgIC8vIE1hcCBoZWxwZXJcbiAgICAvLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgbWFwcGVyID0ge1xuXG4gICAgICAgIHJneCA6IGZ1bmN0aW9uICh1YSwgYXJyYXlzKSB7XG5cbiAgICAgICAgICAgIHZhciBpID0gMCwgaiwgaywgcCwgcSwgbWF0Y2hlcywgbWF0Y2g7XG5cbiAgICAgICAgICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcmVnZXhlcyBtYXBzXG4gICAgICAgICAgICB3aGlsZSAoaSA8IGFycmF5cy5sZW5ndGggJiYgIW1hdGNoZXMpIHtcblxuICAgICAgICAgICAgICAgIHZhciByZWdleCA9IGFycmF5c1tpXSwgICAgICAgLy8gZXZlbiBzZXF1ZW5jZSAoMCwyLDQsLi4pXG4gICAgICAgICAgICAgICAgICAgIHByb3BzID0gYXJyYXlzW2kgKyAxXTsgICAvLyBvZGQgc2VxdWVuY2UgKDEsMyw1LC4uKVxuICAgICAgICAgICAgICAgIGogPSBrID0gMDtcblxuICAgICAgICAgICAgICAgIC8vIHRyeSBtYXRjaGluZyB1YXN0cmluZyB3aXRoIHJlZ2V4ZXNcbiAgICAgICAgICAgICAgICB3aGlsZSAoaiA8IHJlZ2V4Lmxlbmd0aCAmJiAhbWF0Y2hlcykge1xuXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoZXMgPSByZWdleFtqKytdLmV4ZWModWEpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghIW1hdGNoZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAocCA9IDA7IHAgPCBwcm9wcy5sZW5ndGg7IHArKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gbWF0Y2hlc1srK2tdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBwcm9wc1twXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVjayBpZiBnaXZlbiBwcm9wZXJ0eSBpcyBhY3R1YWxseSBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgcSA9PT0gT0JKX1RZUEUgJiYgcS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHFbMV0gPT0gRlVOQ19UWVBFKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYXNzaWduIG1vZGlmaWVkIG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IHFbMV0uY2FsbCh0aGlzLCBtYXRjaCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFzc2lnbiBnaXZlbiB2YWx1ZSwgaWdub3JlIHJlZ2V4IG1hdGNoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpc1txWzBdXSA9IHFbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocS5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2hlY2sgd2hldGhlciBmdW5jdGlvbiBvciByZWdleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBxWzFdID09PSBGVU5DX1RZUEUgJiYgIShxWzFdLmV4ZWMgJiYgcVsxXS50ZXN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNhbGwgZnVuY3Rpb24gKHVzdWFsbHkgc3RyaW5nIG1hcHBlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzW3FbMF1dID0gbWF0Y2ggPyBxWzFdLmNhbGwodGhpcywgbWF0Y2gsIHFbMl0pIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW5pdGl6ZSBtYXRjaCB1c2luZyBnaXZlbiByZWdleFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBtYXRjaCA/IG1hdGNoLnJlcGxhY2UocVsxXSwgcVsyXSkgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocS5sZW5ndGggPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcVswXV0gPSBtYXRjaCA/IHFbM10uY2FsbCh0aGlzLCBtYXRjaC5yZXBsYWNlKHFbMV0sIHFbMl0pKSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbcV0gPSBtYXRjaCA/IG1hdGNoIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpICs9IDI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RyIDogZnVuY3Rpb24gKHN0ciwgbWFwKSB7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgaW4gbWFwKSB7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgYXJyYXlcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG1hcFtpXSA9PT0gT0JKX1RZUEUgJiYgbWFwW2ldLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBtYXBbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1dGlsLmhhcyhtYXBbaV1bal0sIHN0cikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKGkgPT09IFVOS05PV04pID8gdW5kZWZpbmVkIDogaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodXRpbC5oYXMobWFwW2ldLCBzdHIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoaSA9PT0gVU5LTk9XTikgPyB1bmRlZmluZWQgOiBpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdHI7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvLy8vLy8vLy8vLy8vLy9cbiAgICAvLyBTdHJpbmcgbWFwXG4gICAgLy8vLy8vLy8vLy8vLy9cblxuXG4gICAgdmFyIG1hcHMgPSB7XG5cbiAgICAgICAgYnJvd3NlciA6IHtcbiAgICAgICAgICAgIG9sZHNhZmFyaSA6IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAnMS4wJyAgIDogJy84JyxcbiAgICAgICAgICAgICAgICAgICAgJzEuMicgICA6ICcvMScsXG4gICAgICAgICAgICAgICAgICAgICcxLjMnICAgOiAnLzMnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wJyAgIDogJy80MTInLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjInIDogJy80MTYnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjMnIDogJy80MTcnLFxuICAgICAgICAgICAgICAgICAgICAnMi4wLjQnIDogJy80MTknLFxuICAgICAgICAgICAgICAgICAgICAnPycgICAgIDogJy8nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGRldmljZSA6IHtcbiAgICAgICAgICAgIGFtYXpvbiA6IHtcbiAgICAgICAgICAgICAgICBtb2RlbCA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0ZpcmUgUGhvbmUnIDogWydTRCcsICdLRiddXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNwcmludCA6IHtcbiAgICAgICAgICAgICAgICBtb2RlbCA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ0V2byBTaGlmdCA0RycgOiAnNzM3M0tUJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmVuZG9yIDoge1xuICAgICAgICAgICAgICAgICAgICAnSFRDJyAgICAgICA6ICdBUEEnLFxuICAgICAgICAgICAgICAgICAgICAnU3ByaW50JyAgICA6ICdTcHJpbnQnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIG9zIDoge1xuICAgICAgICAgICAgd2luZG93cyA6IHtcbiAgICAgICAgICAgICAgICB2ZXJzaW9uIDoge1xuICAgICAgICAgICAgICAgICAgICAnTUUnICAgICAgICA6ICc0LjkwJyxcbiAgICAgICAgICAgICAgICAgICAgJ05UIDMuMTEnICAgOiAnTlQzLjUxJyxcbiAgICAgICAgICAgICAgICAgICAgJ05UIDQuMCcgICAgOiAnTlQ0LjAnLFxuICAgICAgICAgICAgICAgICAgICAnMjAwMCcgICAgICA6ICdOVCA1LjAnLFxuICAgICAgICAgICAgICAgICAgICAnWFAnICAgICAgICA6IFsnTlQgNS4xJywgJ05UIDUuMiddLFxuICAgICAgICAgICAgICAgICAgICAnVmlzdGEnICAgICA6ICdOVCA2LjAnLFxuICAgICAgICAgICAgICAgICAgICAnNycgICAgICAgICA6ICdOVCA2LjEnLFxuICAgICAgICAgICAgICAgICAgICAnOCcgICAgICAgICA6ICdOVCA2LjInLFxuICAgICAgICAgICAgICAgICAgICAnOC4xJyAgICAgICA6ICdOVCA2LjMnLFxuICAgICAgICAgICAgICAgICAgICAnMTAnICAgICAgICA6IFsnTlQgNi40JywgJ05UIDEwLjAnXSxcbiAgICAgICAgICAgICAgICAgICAgJ1JUJyAgICAgICAgOiAnQVJNJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vXG4gICAgLy8gUmVnZXggbWFwXG4gICAgLy8vLy8vLy8vLy8vL1xuXG5cbiAgICB2YXIgcmVnZXhlcyA9IHtcblxuICAgICAgICBicm93c2VyIDogW1tcblxuICAgICAgICAgICAgLy8gUHJlc3RvIGJhc2VkXG4gICAgICAgICAgICAvKG9wZXJhXFxzbWluaSlcXC8oW1xcd1xcLi1dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBNaW5pXG4gICAgICAgICAgICAvKG9wZXJhXFxzW21vYmlsZXRhYl0rKS4rdmVyc2lvblxcLyhbXFx3XFwuLV0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBNb2JpL1RhYmxldFxuICAgICAgICAgICAgLyhvcGVyYSkuK3ZlcnNpb25cXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSA+IDkuODBcbiAgICAgICAgICAgIC8ob3BlcmEpW1xcL1xcc10rKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIDwgOS44MFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8ob3Bpb3MpW1xcL1xcc10rKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIG1pbmkgb24gaXBob25lID49IDguMFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEgTWluaSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvXFxzKG9wcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBXZWJraXRcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ09wZXJhJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIE1peGVkXG4gICAgICAgICAgICAvKGtpbmRsZSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZVxuICAgICAgICAgICAgLyhsdW5hc2NhcGV8bWF4dGhvbnxuZXRmcm9udHxqYXNtaW5lfGJsYXplcilbXFwvXFxzXT8oW1xcd1xcLl0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMdW5hc2NhcGUvTWF4dGhvbi9OZXRmcm9udC9KYXNtaW5lL0JsYXplclxuICAgICAgICAgICAgLy8gVHJpZGVudCBiYXNlZFxuICAgICAgICAgICAgLyhhdmFudFxcc3xpZW1vYmlsZXxzbGltKSg/OmJyb3dzZXIpP1tcXC9cXHNdPyhbXFx3XFwuXSopL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF2YW50L0lFTW9iaWxlL1NsaW1Ccm93c2VyXG4gICAgICAgICAgICAvKGJpZHVicm93c2VyfGJhaWR1YnJvd3NlcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAvLyBCYWlkdSBCcm93c2VyXG4gICAgICAgICAgICAvKD86bXN8XFwoKShpZSlcXHMoW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnRlcm5ldCBFeHBsb3JlclxuXG4gICAgICAgICAgICAvLyBXZWJraXQvS0hUTUwgYmFzZWRcbiAgICAgICAgICAgIC8ocmVrb25xKVxcLyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVrb25xXG4gICAgICAgICAgICAvKGNocm9taXVtfGZsb2NrfHJvY2ttZWx0fG1pZG9yaXxlcGlwaGFueXxzaWxrfHNreWZpcmV8b3ZpYnJvd3Nlcnxib2x0fGlyb258dml2YWxkaXxpcmlkaXVtfHBoYW50b21qc3xib3dzZXJ8cXVhcmt8cXVwemlsbGF8ZmFsa29uKVxcLyhbXFx3XFwuLV0rKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9taXVtL0Zsb2NrL1JvY2tNZWx0L01pZG9yaS9FcGlwaGFueS9TaWxrL1NreWZpcmUvQm9sdC9Jcm9uL0lyaWRpdW0vUGhhbnRvbUpTL0Jvd3Nlci9RdXBaaWxsYS9GYWxrb25cbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGtvbnF1ZXJvcilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtvbnF1ZXJvclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnS29ucXVlcm9yJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8odHJpZGVudCkuK3J2WzpcXHNdKFtcXHdcXC5dKykuK2xpa2VcXHNnZWNrby9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElFMTFcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0lFJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZWRnZXxlZGdpb3N8ZWRnYXxlZGcpXFwvKChcXGQrKT9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBFZGdlXG4gICAgICAgICAgICBdLCBbW05BTUUsICdFZGdlJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oeWFicm93c2VyKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWWFuZGV4XG4gICAgICAgICAgICBdLCBbW05BTUUsICdZYW5kZXgnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhBdmFzdClcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBdmFzdCBTZWN1cmUgQnJvd3NlclxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQXZhc3QgU2VjdXJlIEJyb3dzZXInXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhBVkcpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBVkcgU2VjdXJlIEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0FWRyBTZWN1cmUgQnJvd3NlciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHB1ZmZpbilcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFB1ZmZpblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnUHVmZmluJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZm9jdXMpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBGb2N1c1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRmlyZWZveCBGb2N1cyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKG9wdClcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE9wZXJhIFRvdWNoXG4gICAgICAgICAgICBdLCBbW05BTUUsICdPcGVyYSBUb3VjaCddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKCg/OltcXHNcXC9dKXVjP1xccz9icm93c2VyfCg/Omp1Yy4rKXVjd2ViKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAvLyBVQ0Jyb3dzZXJcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ1VDQnJvd3NlciddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGNvbW9kb19kcmFnb24pXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENvbW9kbyBEcmFnb25cbiAgICAgICAgICAgIF0sIFtbTkFNRSwgL18vZywgJyAnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyh3aW5kb3dzd2VjaGF0IHFiY29yZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBXZUNoYXQgRGVza3RvcCBmb3IgV2luZG93cyBCdWlsdC1pbiBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdXZUNoYXQoV2luKSBEZXNrdG9wJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8obWljcm9tZXNzZW5nZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2VDaGF0XG4gICAgICAgICAgICBdLCBbW05BTUUsICdXZUNoYXQnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhicmF2ZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCcmF2ZSBicm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdCcmF2ZSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHFxYnJvd3NlcmxpdGUpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRQnJvd3NlckxpdGVcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKFFRKVxcLyhbXFxkXFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFFRLCBha2EgU2hvdVFcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvbT8ocXFicm93c2VyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBRUUJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKGJhaWR1Ym94YXBwKVtcXC9cXHNdPyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYWlkdSBBcHBcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKDIzNDVFeHBsb3JlcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAyMzQ1IEJyb3dzZXJcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKE1ldGFTcilbXFwvXFxzXT8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb3VHb3VCcm93c2VyXG4gICAgICAgICAgICBdLCBbTkFNRV0sIFtcblxuICAgICAgICAgICAgLyhMQkJST1dTRVIpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaWVCYW8gQnJvd3NlclxuICAgICAgICAgICAgXSwgW05BTUVdLCBbXG5cbiAgICAgICAgICAgIC94aWFvbWlcXC9taXVpYnJvd3NlclxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1JVUkgQnJvd3NlclxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnTUlVSSBCcm93c2VyJ11dLCBbXG5cbiAgICAgICAgICAgIC87ZmJhdlxcLyhbXFx3XFwuXSspOy9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmFjZWJvb2sgQXBwIGZvciBpT1MgJiBBbmRyb2lkXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdGYWNlYm9vayddXSwgW1xuXG4gICAgICAgICAgICAvc2FmYXJpXFxzKGxpbmUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW5lIEFwcCBmb3IgaU9TXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGxpbmUpXFwvKFtcXHdcXC5dKylcXC9pYWIvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW5lIEFwcCBmb3IgQW5kcm9pZFxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9oZWFkbGVzc2Nocm9tZSg/OlxcLyhbXFx3XFwuXSspfFxccykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENocm9tZSBIZWFkbGVzc1xuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnQ2hyb21lIEhlYWRsZXNzJ11dLCBbXG5cbiAgICAgICAgICAgIC9cXHN3dlxcKS4rKGNocm9tZSlcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUgV2ViVmlld1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAvKC4rKS8sICckMSBXZWJWaWV3J10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oKD86b2N1bHVzfHNhbXN1bmcpYnJvd3NlcilcXC8oW1xcd1xcLl0rKS9pXG4gICAgICAgICAgICBdLCBbW05BTUUsIC8oLisoPzpnfHVzKSkoLispLywgJyQxICQyJ10sIFZFUlNJT05dLCBbICAgICAgICAgICAgICAgIC8vIE9jdWx1cyAvIFNhbXN1bmcgQnJvd3NlclxuXG4gICAgICAgICAgICAvYW5kcm9pZC4rdmVyc2lvblxcLyhbXFx3XFwuXSspXFxzKyg/Om1vYmlsZVxccz9zYWZhcml8c2FmYXJpKSovaSAgICAgICAgLy8gQW5kcm9pZCBCcm93c2VyXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdBbmRyb2lkIEJyb3dzZXInXV0sIFtcblxuICAgICAgICAgICAgLyhzYWlsZmlzaGJyb3dzZXIpXFwvKFtcXHdcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTYWlsZmlzaCBCcm93c2VyXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTYWlsZmlzaCBCcm93c2VyJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oY2hyb21lfG9tbml3ZWJ8YXJvcmF8W3RpemVub2thXXs1fVxccz9icm93c2VyKVxcL3Y/KFtcXHdcXC5dKykvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUvT21uaVdlYi9Bcm9yYS9UaXplbi9Ob2tpYVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8oZG9sZmluKVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9scGhpblxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRG9scGhpbiddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvKHFpaHV8cWhicm93c2VyfHFpaG9vYnJvd3NlcnwzNjBicm93c2VyKS9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIDM2MFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnMzYwIEJyb3dzZXInXV0sIFtcblxuICAgICAgICAgICAgLygoPzphbmRyb2lkLispY3Jtb3xjcmlvcylcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWUgZm9yIEFuZHJvaWQvaU9TXG4gICAgICAgICAgICBdLCBbW05BTUUsICdDaHJvbWUnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjb2FzdClcXC8oW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPcGVyYSBDb2FzdFxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnT3BlcmEgQ29hc3QnXSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgL2Z4aW9zXFwvKFtcXHdcXC4tXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlZm94IGZvciBpT1NcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBbTkFNRSwgJ0ZpcmVmb3gnXV0sIFtcblxuICAgICAgICAgICAgL3ZlcnNpb25cXC8oW1xcd1xcLl0rKS4rP21vYmlsZVxcL1xcdytcXHMoc2FmYXJpKS9pICAgICAgICAgICAgICAgICAgICAgICAvLyBNb2JpbGUgU2FmYXJpXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdNb2JpbGUgU2FmYXJpJ11dLCBbXG5cbiAgICAgICAgICAgIC92ZXJzaW9uXFwvKFtcXHdcXC5dKykuKz8obW9iaWxlXFxzP3NhZmFyaXxzYWZhcmkpL2kgICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSAmIFNhZmFyaSBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBOQU1FXSwgW1xuXG4gICAgICAgICAgICAvd2Via2l0Lis/KGdzYSlcXC8oW1xcd1xcLl0rKS4rPyhtb2JpbGVcXHM/c2FmYXJpfHNhZmFyaSkoXFwvW1xcd1xcLl0rKS9pICAvLyBHb29nbGUgU2VhcmNoIEFwcGxpYW5jZSBvbiBpT1NcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0dTQSddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvd2Via2l0Lis/KG1vYmlsZVxccz9zYWZhcml8c2FmYXJpKShcXC9bXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAvLyBTYWZhcmkgPCAzLjBcbiAgICAgICAgICAgIF0sIFtOQU1FLCBbVkVSU0lPTiwgbWFwcGVyLnN0ciwgbWFwcy5icm93c2VyLm9sZHNhZmFyaS52ZXJzaW9uXV0sIFtcblxuICAgICAgICAgICAgLyh3ZWJraXR8a2h0bWwpXFwvKFtcXHdcXC5dKykvaVxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIEdlY2tvIGJhc2VkXG4gICAgICAgICAgICAvKG5hdmlnYXRvcnxuZXRzY2FwZSlcXC8oW1xcd1xcLi1dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldHNjYXBlXG4gICAgICAgICAgICBdLCBbW05BTUUsICdOZXRzY2FwZSddLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyhzd2lmdGZveCkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTd2lmdGZveFxuICAgICAgICAgICAgLyhpY2VkcmFnb258aWNld2Vhc2VsfGNhbWlub3xjaGltZXJhfGZlbm5lY3xtYWVtb1xcc2Jyb3dzZXJ8bWluaW1vfGNvbmtlcm9yKVtcXC9cXHNdPyhbXFx3XFwuXFwrXSspL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEljZURyYWdvbi9JY2V3ZWFzZWwvQ2FtaW5vL0NoaW1lcmEvRmVubmVjL01hZW1vL01pbmltby9Db25rZXJvclxuICAgICAgICAgICAgLyhmaXJlZm94fHNlYW1vbmtleXxrLW1lbGVvbnxpY2VjYXR8aWNlYXBlfGZpcmViaXJkfHBob2VuaXh8cGFsZW1vb258YmFzaWxpc2t8d2F0ZXJmb3gpXFwvKFtcXHdcXC4tXSspJC9pLFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmVmb3gvU2VhTW9ua2V5L0stTWVsZW9uL0ljZUNhdC9JY2VBcGUvRmlyZWJpcmQvUGhvZW5peFxuICAgICAgICAgICAgLyhtb3ppbGxhKVxcLyhbXFx3XFwuXSspLitydlxcOi4rZ2Vja29cXC9cXGQrL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3ppbGxhXG5cbiAgICAgICAgICAgIC8vIE90aGVyXG4gICAgICAgICAgICAvKHBvbGFyaXN8bHlueHxkaWxsb3xpY2FifGRvcmlzfGFtYXlhfHczbXxuZXRzdXJmfHNsZWlwbmlyKVtcXC9cXHNdPyhbXFx3XFwuXSspL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvbGFyaXMvTHlueC9EaWxsby9pQ2FiL0RvcmlzL0FtYXlhL3czbS9OZXRTdXJmL1NsZWlwbmlyXG4gICAgICAgICAgICAvKGxpbmtzKVxcc1xcKChbXFx3XFwuXSspL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW5rc1xuICAgICAgICAgICAgLyhnb2Jyb3dzZXIpXFwvPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb0Jyb3dzZXJcbiAgICAgICAgICAgIC8oaWNlXFxzP2Jyb3dzZXIpXFwvdj8oW1xcd1xcLl9dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIElDRSBCcm93c2VyXG4gICAgICAgICAgICAvKG1vc2FpYylbXFwvXFxzXShbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNb3NhaWNcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXVxuICAgICAgICBdLFxuXG4gICAgICAgIGNwdSA6IFtbXG5cbiAgICAgICAgICAgIC8oPzooYW1kfHgoPzooPzo4Nnw2NClbXy1dKT98d293fHdpbik2NClbO1xcKV0vaSAgICAgICAgICAgICAgICAgICAgIC8vIEFNRDY0XG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgJ2FtZDY0J11dLCBbXG5cbiAgICAgICAgICAgIC8oaWEzMig/PTspKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSUEzMiAocXVpY2t0aW1lKVxuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsIHV0aWwubG93ZXJpemVdXSwgW1xuXG4gICAgICAgICAgICAvKCg/OmlbMzQ2XXx4KTg2KVs7XFwpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQTMyXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgJ2lhMzInXV0sIFtcblxuICAgICAgICAgICAgLy8gUG9ja2V0UEMgbWlzdGFrZW5seSBpZGVudGlmaWVkIGFzIFBvd2VyUENcbiAgICAgICAgICAgIC93aW5kb3dzXFxzKGNlfG1vYmlsZSk7XFxzcHBjOy9pXG4gICAgICAgICAgICBdLCBbW0FSQ0hJVEVDVFVSRSwgJ2FybSddXSwgW1xuXG4gICAgICAgICAgICAvKCg/OnBwY3xwb3dlcnBjKSg/OjY0KT8pKD86XFxzbWFjfDt8XFwpKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG93ZXJQQ1xuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsIC9vd2VyLywgJycsIHV0aWwubG93ZXJpemVdXSwgW1xuXG4gICAgICAgICAgICAvKHN1bjRcXHcpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU1BBUkNcbiAgICAgICAgICAgIF0sIFtbQVJDSElURUNUVVJFLCAnc3BhcmMnXV0sIFtcblxuICAgICAgICAgICAgLygoPzphdnIzMnxpYTY0KD89OykpfDY4ayg/PVxcKSl8YXJtKD86NjR8KD89dlxcZCtbO2xdKSl8KD89YXRtZWxcXHMpYXZyfCg/OmlyaXh8bWlwc3xzcGFyYykoPzo2NCk/KD89Oyl8cGEtcmlzYykvaVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJQTY0LCA2OEssIEFSTS82NCwgQVZSLzMyLCBJUklYLzY0LCBNSVBTLzY0LCBTUEFSQy82NCwgUEEtUklTQ1xuICAgICAgICAgICAgXSwgW1tBUkNISVRFQ1RVUkUsIHV0aWwubG93ZXJpemVdXVxuICAgICAgICBdLFxuXG4gICAgICAgIGRldmljZSA6IFtbXG5cbiAgICAgICAgICAgIC9cXCgoaXBhZHxwbGF5Ym9vayk7W1xcd1xcc1xcKSw7LV0rKHJpbXxhcHBsZSkvaSAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQYWQvUGxheUJvb2tcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgVkVORE9SLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FwcGxlY29yZW1lZGlhXFwvW1xcd1xcLl0rIFxcKChpcGFkKS8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaVBhZFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQXBwbGUnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oYXBwbGVcXHN7MCwxfXR2KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFwcGxlIFRWXG4gICAgICAgICAgICBdLCBbW01PREVMLCAnQXBwbGUgVFYnXSwgW1ZFTkRPUiwgJ0FwcGxlJ10sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgLyhhcmNob3MpXFxzKGdhbWVwYWQyPykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXJjaG9zXG4gICAgICAgICAgICAvKGhwKS4rKHRvdWNocGFkKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhQIFRvdWNoUGFkXG4gICAgICAgICAgICAvKGhwKS4rKHRhYmxldCkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhQIFRhYmxldFxuICAgICAgICAgICAgLyhraW5kbGUpXFwvKFtcXHdcXC5dKykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBLaW5kbGVcbiAgICAgICAgICAgIC9cXHMobm9vaylbXFx3XFxzXStidWlsZFxcLyhcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb29rXG4gICAgICAgICAgICAvKGRlbGwpXFxzKHN0cmVhW2twclxcc1xcZF0qW1xcZGtvXSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxsIFN0cmVha1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvKGtmW0Etel0rKVxcc2J1aWxkXFwvLitzaWxrXFwvL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEtpbmRsZSBGaXJlIEhEXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKHNkfGtmKVswMzQ5aGlqb3JzdHV3XStcXHNidWlsZFxcLy4rc2lsa1xcLy9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgUGhvbmVcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLmFtYXpvbi5tb2RlbF0sIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rYWZ0KFtibXNdKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBGaXJlIFRWXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBbWF6b24nXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvXFwoKGlwW2hvbmVkfFxcc1xcdypdKyk7LisoYXBwbGUpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQb2QvaVBob25lXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFZFTkRPUiwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvXFwoKGlwW2hvbmVkfFxcc1xcdypdKyk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlQb2QvaVBob25lXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdBcHBsZSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgLyhibGFja2JlcnJ5KVtcXHMtXT8oXFx3KykvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnlcbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeXxiZW5xfHBhbG0oPz1cXC0pfHNvbnllcmljc3NvbnxhY2VyfGFzdXN8ZGVsbHxtZWl6dXxtb3Rvcm9sYXxwb2x5dHJvbilbXFxzXy1dPyhbXFx3LV0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCZW5RL1BhbG0vU29ueS1Fcmljc3Nvbi9BY2VyL0FzdXMvRGVsbC9NZWl6dS9Nb3Rvcm9sYS9Qb2x5dHJvblxuICAgICAgICAgICAgLyhocClcXHMoW1xcd1xcc10rXFx3KS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFAgaVBBUVxuICAgICAgICAgICAgLyhhc3VzKS0/KFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXN1c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL1xcKGJiMTA7XFxzKFxcdyspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCbGFja0JlcnJ5IDEwXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdCbGFja0JlcnJ5J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3VzIFRhYmxldHNcbiAgICAgICAgICAgIC9hbmRyb2lkLisodHJhbnNmb1twcmltZVxcc117NCwxMH1cXHNcXHcrfGVlZXBjfHNsaWRlclxcc1xcdyt8bmV4dXMgN3xwYWRmb25lfHAwMGMpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FzdXMnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC8oc29ueSlcXHModGFibGV0XFxzW3BzXSlcXHNidWlsZFxcLy9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb255XG4gICAgICAgICAgICAvKHNvbnkpPyg/OnNncC4rKVxcc2J1aWxkXFwvL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU29ueSddLCBbTU9ERUwsICdYcGVyaWEgVGFibGV0J10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK1xccyhbYy1nXVxcZHs0fXxzb1stbF1cXHcrKSg/PVxcc2J1aWxkXFwvfFxcKS4rY2hyb21lXFwvKD8hWzEtNl17MCwxfVxcZFxcLikpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NvbnknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9cXHMob3V5YSlcXHMvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPdXlhXG4gICAgICAgICAgICAvKG5pbnRlbmRvKVxccyhbd2lkczN1XSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOaW50ZW5kb1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBDT05TT0xFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKztcXHMoc2hpZWxkKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE52aWRpYVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTnZpZGlhJ10sIFtUWVBFLCBDT05TT0xFXV0sIFtcblxuICAgICAgICAgICAgLyhwbGF5c3RhdGlvblxcc1szNHBvcnRhYmxldmldKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGxheXN0YXRpb25cbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NvbnknXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuXG4gICAgICAgICAgICAvKHNwcmludFxccyhcXHcrKSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3ByaW50IFBob25lc1xuICAgICAgICAgICAgXSwgW1tWRU5ET1IsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLnNwcmludC52ZW5kb3JdLCBbTU9ERUwsIG1hcHBlci5zdHIsIG1hcHMuZGV2aWNlLnNwcmludC5tb2RlbF0sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGh0YylbO19cXHMtXSsoW1xcd1xcc10rKD89XFwpfFxcc2J1aWxkKXxcXHcrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhUQ1xuICAgICAgICAgICAgLyh6dGUpLShcXHcqKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWlRFXG4gICAgICAgICAgICAvKGFsY2F0ZWx8Z2Vla3NwaG9uZXxuZXhpYW58cGFuYXNvbmljfCg/PTtcXHMpc29ueSlbX1xccy1dPyhbXFx3LV0qKS9pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFsY2F0ZWwvR2Vla3NQaG9uZS9OZXhpYW4vUGFuYXNvbmljL1NvbnlcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIFtNT0RFTCwgL18vZywgJyAnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8obmV4dXNcXHM5KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhUQyBOZXh1cyA5XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdIVEMnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9kXFwvaHVhd2VpKFtcXHdcXHMtXSspWztcXCldL2ksXG4gICAgICAgICAgICAvKG5leHVzXFxzNnB8dm9nLWwyOXxhbmUtbHgxfGVtbC1sMjl8ZWxlLWwyOSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1YXdlaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnSHVhd2VpJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKGJhaDI/LWE/W2x3XVxcZHsyfSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIdWF3ZWkgTWVkaWFQYWRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0h1YXdlaSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhtaWNyb3NvZnQpO1xccyhsdW1pYVtcXHNcXHddKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNaWNyb3NvZnQgTHVtaWFcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL1tcXHNcXCg7XSh4Ym94KD86XFxzb25lKT8pW1xcc1xcKTtdL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pY3Jvc29mdCBYYm94XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNaWNyb3NvZnQnXSwgW1RZUEUsIENPTlNPTEVdXSwgW1xuICAgICAgICAgICAgLyhraW5cXC5bb25ldHddezN9KS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWljcm9zb2Z0IEtpblxuICAgICAgICAgICAgXSwgW1tNT0RFTCwgL1xcLi9nLCAnICddLCBbVkVORE9SLCAnTWljcm9zb2Z0J10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1vdG9yb2xhXG4gICAgICAgICAgICAvXFxzKG1pbGVzdG9uZXxkcm9pZCg/OlsyLTR4XXxcXHMoPzpiaW9uaWN8eDJ8cHJvfHJhenIpKT86PyhcXHM0Zyk/KVtcXHdcXHNdK2J1aWxkXFwvL2ksXG4gICAgICAgICAgICAvbW90W1xccy1dPyhcXHcqKS9pLFxuICAgICAgICAgICAgLyhYVFxcZHszLDR9KSBidWlsZFxcLy9pLFxuICAgICAgICAgICAgLyhuZXh1c1xcczYpL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ01vdG9yb2xhJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuK1xccyhtejYwXFxkfHhvb21bXFxzMl17MCwyfSlcXHNidWlsZFxcLy9pXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNb3Rvcm9sYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2hiYnR2XFwvXFxkK1xcLlxcZCtcXC5cXGQrXFxzK1xcKFtcXHdcXHNdKjtcXHMqKFxcd1teO10qKTsoW147XSopL2kgICAgICAgICAgICAvLyBIYmJUViBkZXZpY2VzXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgdXRpbC50cmltXSwgW01PREVMLCB1dGlsLnRyaW1dLCBbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC9oYmJ0di4rbWFwbGU7KFxcZCspL2lcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9eLywgJ1NtYXJ0VFYnXSwgW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvXFwoZHR2W1xcKTtdLisoYXF1b3MpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hhcnBcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ1NoYXJwJ10sIFtUWVBFLCBTTUFSVFRWXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuKygoc2NoLWlbODldMFxcZHxzaHctbTM4MHN8Z3QtcFxcZHs0fXxndC1uXFxkK3xzZ2gtdDhbNTZdOXxuZXh1cyAxMCkpL2ksXG4gICAgICAgICAgICAvKChTTS1UXFx3KykpL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnU2Ftc3VuZyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbICAgICAgICAgICAgICAgICAgLy8gU2Ftc3VuZ1xuICAgICAgICAgICAgL3NtYXJ0LXR2Lisoc2Ftc3VuZykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgW1RZUEUsIFNNQVJUVFZdLCBNT0RFTF0sIFtcbiAgICAgICAgICAgIC8oKHNbY2dwXWgtXFx3K3xndC1cXHcrfGdhbGF4eVxcc25leHVzfHNtLVxcd1tcXHdcXGRdKykpL2ksXG4gICAgICAgICAgICAvKHNhbVtzdW5nXSopW1xccy1dKihcXHcrLT9bXFx3LV0qKS9pLFxuICAgICAgICAgICAgL3NlYy0oKHNnaFxcdyspKS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ1NhbXN1bmcnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvc2llLShcXHcqKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaWVtZW5zXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTaWVtZW5zJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKG1hZW1vfG5va2lhKS4qKG45MDB8bHVtaWFcXHNcXGQrKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTm9raWFcbiAgICAgICAgICAgIC8obm9raWEpW1xcc18tXT8oW1xcdy1dKikvaVxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdOb2tpYSddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkW3hcXGRcXC5cXHM7XStcXHMoW2FiXVsxLTddXFwtP1swMTc4YV1cXGRcXGQ/KS9pICAgICAgICAgICAgICAgICAgIC8vIEFjZXJcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0FjZXInXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoW3ZsXWtcXC0/XFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEcgVGFibGV0XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdMRyddLCBbVFlQRSwgVEFCTEVUXV0sIFtcbiAgICAgICAgICAgIC9hbmRyb2lkXFxzM1xcLltcXHNcXHc7LV17MTB9KGxnPyktKFswNmN2OV17Myw0fSkvaSAgICAgICAgICAgICAgICAgICAgIC8vIExHIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMRyddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvKGxnKSBuZXRjYXN0XFwudHYvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMRyBTbWFydFRWXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuICAgICAgICAgICAgLyhuZXh1c1xcc1s0NV0pL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTEdcbiAgICAgICAgICAgIC9sZ1tlO1xcc1xcLy1dKyhcXHcqKS9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK2xnKFxcLT9bXFxkXFx3XSspXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0xHJ10sIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvKGxlbm92bylcXHM/KHMoPzo1MDAwfDYwMDApKD86W1xcdy1dKyl8dGFiKD86W1xcc1xcd10rKSkvaSAgICAgICAgICAgICAvLyBMZW5vdm8gdGFibGV0c1xuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgL2FuZHJvaWQuKyhpZGVhdGFiW2EtejAtOVxcLVxcc10rKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExlbm92b1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTGVub3ZvJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuICAgICAgICAgICAgLyhsZW5vdm8pW19cXHMtXT8oW1xcdy1dKykvaVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgW1xuXG4gICAgICAgICAgICAvbGludXg7LisoKGpvbGxhKSk7L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEpvbGxhXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC8oKHBlYmJsZSkpYXBwXFwvW1xcZFxcLl0rXFxzL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBlYmJsZVxuICAgICAgICAgICAgXSwgW1ZFTkRPUiwgTU9ERUwsIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKG9wcG8pXFxzPyhbXFx3XFxzXSspXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBPUFBPXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9jcmtleS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIENocm9tZWNhc3RcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsICdDaHJvbWVjYXN0J10sIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIFNNQVJUVFZdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhnbGFzcylcXHNcXGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdvb2dsZSBHbGFzc1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBXRUFSQUJMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKHBpeGVsIGMpW1xccyldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgUGl4ZWwgQ1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnR29vZ2xlJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhwaXhlbCggWzIzXSk/KCB4bCk/KVtcXHMpXS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR29vZ2xlIFBpeGVsXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdHb29nbGUnXSwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFxcdyspXFxzK2J1aWxkXFwvaG1cXDEvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBYaWFvbWkgSG9uZ21pICdudW1lcmljJyBtb2RlbHNcbiAgICAgICAgICAgIC9hbmRyb2lkLisoaG1bXFxzXFwtX10qbm90ZT9bXFxzX10qKD86XFxkXFx3KT8pXFxzK2J1aWxkL2ksICAgICAgICAgICAgICAgLy8gWGlhb21pIEhvbmdtaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhtaVtcXHNcXC1fXSooPzphXFxkfG9uZXxvbmVbXFxzX11wbHVzfG5vdGUgbHRlKT9bXFxzX10qKD86XFxkP1xcdz8pW1xcc19dKig/OnBsdXMpPylcXHMrYnVpbGQvaSwgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFhpYW9taSBNaVxuICAgICAgICAgICAgL2FuZHJvaWQuKyhyZWRtaVtcXHNcXC1fXSooPzpub3RlKT8oPzpbXFxzX10/W1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAvLyBSZWRtaSBQaG9uZXNcbiAgICAgICAgICAgIF0sIFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIE1PQklMRV1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rKG1pW1xcc1xcLV9dKig/OnBhZCkoPzpbXFxzX10/W1xcd1xcc10rKSlcXHMrYnVpbGQvaSAgICAgICAgICAgIC8vIE1pIFBhZCB0YWJsZXRzXG4gICAgICAgICAgICBdLFtbTU9ERUwsIC9fL2csICcgJ10sIFtWRU5ET1IsICdYaWFvbWknXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhtWzEtNV1cXHNub3RlKVxcc2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1laXp1XG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNZWl6dSddLCBbVFlQRSwgTU9CSUxFXV0sIFtcbiAgICAgICAgICAgIC8obXopLShbXFx3LV17Mix9KS9pXG4gICAgICAgICAgICBdLCBbW1ZFTkRPUiwgJ01laXp1J10sIE1PREVMLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK2EwMDAoMSlcXHMrYnVpbGQvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gT25lUGx1c1xuICAgICAgICAgICAgL2FuZHJvaWQuK29uZXBsdXNcXHMoYVxcZHs0fSlbXFxzKV0vaVxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnT25lUGx1cyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooUkNUW1xcZFxcd10rKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJDQSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdSQ0EnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL1xcc10rKFZlbnVlW1xcZFxcc117Miw3fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBEZWxsIFZlbnVlIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0RlbGwnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFFbVHxNXVtcXGRcXHddKylcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWZXJpem9uIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnVmVyaXpvbiddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoQmFybmVzWyZcXHNdK05vYmxlXFxzK3xCTltSVF0pKFY/LiopXFxzK2J1aWxkL2kgICAgIC8vIEJhcm5lcyAmIE5vYmxlIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdCYXJuZXMgJiBOb2JsZSddLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMrKFRNXFxkezN9LipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBCYXJuZXMgJiBOb2JsZSBUYWJsZXRcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ051VmlzaW9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rO1xccyhrODgpXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gWlRFIEsgU2VyaWVzIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWlRFJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihnZW5cXGR7M30pXFxzK2J1aWxkLio0OWgvaSAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTd2lzcyBHRU4gTW9iaWxlXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdTd2lzcyddLCBbVFlQRSwgTU9CSUxFXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooenVyXFxkezN9KVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3dpc3MgWlVSIFRhYmxldFxuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnU3dpc3MnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKChaZWtpKT9UQi4qXFxiKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFpla2kgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnWmVraSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgLyhhbmRyb2lkKS4rWztcXC9dXFxzKyhbWVJdXFxkezJ9KVxccytidWlsZC9pLFxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccysoRHJhZ29uW1xcLVxcc10rVG91Y2hcXHMrfERUKShcXHd7NX0pXFxzYnVpbGQvaSAgICAgICAgLy8gRHJhZ29uIFRvdWNoIFRhYmxldFxuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdEcmFnb24gVG91Y2gnXSwgTU9ERUwsIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihOUy0/XFx3ezAsOX0pXFxzYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJbnNpZ25pYSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdJbnNpZ25pYSddLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooKE5YfE5leHQpLT9cXHd7MCw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgLy8gTmV4dEJvb2sgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnTmV4dEJvb2snXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFh0cmVtZVxcXyk/KFYoMVswNDVdfDJbMDE1XXwzMHw0MHw2MHw3WzA1XXw5MCkpXFxzK2J1aWxkL2lcbiAgICAgICAgICAgIF0sIFtbVkVORE9SLCAnVm9pY2UnXSwgTU9ERUwsIFtUWVBFLCBNT0JJTEVdXSwgWyAgICAgICAgICAgICAgICAgICAgLy8gVm9pY2UgWHRyZW1lIFBob25lc1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMVlRFTFxcLSk/KFYxWzEyXSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgIC8vIEx2VGVsIFBob25lc1xuICAgICAgICAgICAgXSwgW1tWRU5ET1IsICdMdlRlbCddLCBNT0RFTCwgW1RZUEUsIE1PQklMRV1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLis7XFxzKFBILTEpXFxzL2lcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0Vzc2VudGlhbCddLCBbVFlQRSwgTU9CSUxFXV0sIFsgICAgICAgICAgICAgICAgLy8gRXNzZW50aWFsIFBILTFcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVigxMDBNRHw3MDBOQXw3MDExfDkxN0cpLipcXGIpXFxzK2J1aWxkL2kgICAgICAgICAgLy8gRW52aXplbiBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdFbnZpemVuJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rWztcXC9dXFxzKihMZVtcXHNcXC1dK1BhbilbXFxzXFwtXSsoXFx3ezEsOX0pXFxzK2J1aWxkL2kgICAgICAgICAgLy8gTGUgUGFuIFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL2FuZHJvaWQuK1s7XFwvXVxccyooVHJpb1tcXHNcXC1dKi4qKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hY2hTcGVlZCBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbTU9ERUwsIFtWRU5ET1IsICdNYWNoU3BlZWQnXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqKFRyaW5pdHkpW1xcLVxcc10qKFRcXGR7M30pXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgLy8gVHJpbml0eSBUYWJsZXRzXG4gICAgICAgICAgICBdLCBbVkVORE9SLCBNT0RFTCwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLitbO1xcL11cXHMqVFVfKDE0OTEpXFxzK2J1aWxkL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUm90b3IgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnUm90b3InXSwgW1RZUEUsIFRBQkxFVF1dLCBbXG5cbiAgICAgICAgICAgIC9hbmRyb2lkLisoS1MoLispKVxccytidWlsZC9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFtYXpvbiBLaW5kbGUgVGFibGV0c1xuICAgICAgICAgICAgXSwgW01PREVMLCBbVkVORE9SLCAnQW1hem9uJ10sIFtUWVBFLCBUQUJMRVRdXSwgW1xuXG4gICAgICAgICAgICAvYW5kcm9pZC4rKEdpZ2FzZXQpW1xcc1xcLV0rKFFcXHd7MSw5fSlcXHMrYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAvLyBHaWdhc2V0IFRhYmxldHNcbiAgICAgICAgICAgIF0sIFtWRU5ET1IsIE1PREVMLCBbVFlQRSwgVEFCTEVUXV0sIFtcblxuICAgICAgICAgICAgL1xccyh0YWJsZXR8dGFiKVs7XFwvXS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVuaWRlbnRpZmlhYmxlIFRhYmxldFxuICAgICAgICAgICAgL1xccyhtb2JpbGUpKD86WztcXC9dfFxcc3NhZmFyaSkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVbmlkZW50aWZpYWJsZSBNb2JpbGVcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgdXRpbC5sb3dlcml6ZV0sIFZFTkRPUiwgTU9ERUxdLCBbXG5cbiAgICAgICAgICAgIC9bXFxzXFwvXFwoXShzbWFydC0/dHYpWztcXCldL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNtYXJ0VFZcbiAgICAgICAgICAgIF0sIFtbVFlQRSwgU01BUlRUVl1dLCBbXG5cbiAgICAgICAgICAgIC8oYW5kcm9pZFtcXHdcXC5cXHNcXC1dezAsOX0pOy4rYnVpbGQvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdlbmVyaWMgQW5kcm9pZCBEZXZpY2VcbiAgICAgICAgICAgIF0sIFtNT0RFTCwgW1ZFTkRPUiwgJ0dlbmVyaWMnXV1cbiAgICAgICAgXSxcblxuICAgICAgICBlbmdpbmUgOiBbW1xuXG4gICAgICAgICAgICAvd2luZG93cy4rXFxzZWRnZVxcLyhbXFx3XFwuXSspL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBFZGdlSFRNTFxuICAgICAgICAgICAgXSwgW1ZFUlNJT04sIFtOQU1FLCAnRWRnZUhUTUwnXV0sIFtcblxuICAgICAgICAgICAgL3dlYmtpdFxcLzUzN1xcLjM2LitjaHJvbWVcXC8oPyEyNykoW1xcd1xcLl0rKS9pICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsaW5rXG4gICAgICAgICAgICBdLCBbVkVSU0lPTiwgW05BTUUsICdCbGluayddXSwgW1xuXG4gICAgICAgICAgICAvKHByZXN0bylcXC8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXN0b1xuICAgICAgICAgICAgLyh3ZWJraXR8dHJpZGVudHxuZXRmcm9udHxuZXRzdXJmfGFtYXlhfGx5bnh8dzNtfGdvYW5uYSlcXC8oW1xcd1xcLl0rKS9pLCAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlYktpdC9UcmlkZW50L05ldEZyb250L05ldFN1cmYvQW1heWEvTHlueC93M20vR29hbm5hXG4gICAgICAgICAgICAvKGtodG1sfHRhc21hbnxsaW5rcylbXFwvXFxzXVxcKD8oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gS0hUTUwvVGFzbWFuL0xpbmtzXG4gICAgICAgICAgICAvKGljYWIpW1xcL1xcc10oWzIzXVxcLltcXGRcXC5dKykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaUNhYlxuICAgICAgICAgICAgXSwgW05BTUUsIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC9ydlxcOihbXFx3XFwuXXsxLDl9KS4rKGdlY2tvKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR2Vja29cbiAgICAgICAgICAgIF0sIFtWRVJTSU9OLCBOQU1FXVxuICAgICAgICBdLFxuXG4gICAgICAgIG9zIDogW1tcblxuICAgICAgICAgICAgLy8gV2luZG93cyBiYXNlZFxuICAgICAgICAgICAgL21pY3Jvc29mdFxccyh3aW5kb3dzKVxccyh2aXN0YXx4cCkvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdpbmRvd3MgKGlUdW5lcylcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSwgW1xuICAgICAgICAgICAgLyh3aW5kb3dzKVxcc250XFxzNlxcLjI7XFxzKGFybSkvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2luZG93cyBSVFxuICAgICAgICAgICAgLyh3aW5kb3dzXFxzcGhvbmUoPzpcXHNvcykqKVtcXHNcXC9dPyhbXFxkXFwuXFxzXFx3XSopL2ksICAgICAgICAgICAgICAgICAgIC8vIFdpbmRvd3MgUGhvbmVcbiAgICAgICAgICAgIC8od2luZG93c1xcc21vYmlsZXx3aW5kb3dzKVtcXHNcXC9dPyhbbnRjZVxcZFxcLlxcc10rXFx3KS9pXG4gICAgICAgICAgICBdLCBbTkFNRSwgW1ZFUlNJT04sIG1hcHBlci5zdHIsIG1hcHMub3Mud2luZG93cy52ZXJzaW9uXV0sIFtcbiAgICAgICAgICAgIC8od2luKD89M3w5fG4pfHdpblxcczl4XFxzKShbbnRcXGRcXC5dKykvaVxuICAgICAgICAgICAgXSwgW1tOQU1FLCAnV2luZG93cyddLCBbVkVSU0lPTiwgbWFwcGVyLnN0ciwgbWFwcy5vcy53aW5kb3dzLnZlcnNpb25dXSwgW1xuXG4gICAgICAgICAgICAvLyBNb2JpbGUvRW1iZWRkZWQgT1NcbiAgICAgICAgICAgIC9cXCgoYmIpKDEwKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrQmVycnkgMTBcbiAgICAgICAgICAgIF0sIFtbTkFNRSwgJ0JsYWNrQmVycnknXSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oYmxhY2tiZXJyeSlcXHcqXFwvPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEJsYWNrYmVycnlcbiAgICAgICAgICAgIC8odGl6ZW58a2Fpb3MpW1xcL1xcc10oW1xcd1xcLl0rKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRpemVuL0thaU9TXG4gICAgICAgICAgICAvKGFuZHJvaWR8d2Vib3N8cGFsbVxcc29zfHFueHxiYWRhfHJpbVxcc3RhYmxldFxcc29zfG1lZWdvfHNhaWxmaXNofGNvbnRpa2kpW1xcL1xccy1dPyhbXFx3XFwuXSopL2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQW5kcm9pZC9XZWJPUy9QYWxtL1FOWC9CYWRhL1JJTS9NZWVHby9Db250aWtpL1NhaWxmaXNoIE9TXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcbiAgICAgICAgICAgIC8oc3ltYmlhblxccz9vc3xzeW1ib3N8czYwKD89OykpW1xcL1xccy1dPyhbXFx3XFwuXSopL2kgICAgICAgICAgICAgICAgICAvLyBTeW1iaWFuXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTeW1iaWFuJ10sIFZFUlNJT05dLCBbXG4gICAgICAgICAgICAvXFwoKHNlcmllczQwKTsvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXJpZXMgNDBcbiAgICAgICAgICAgIF0sIFtOQU1FXSwgW1xuICAgICAgICAgICAgL21vemlsbGEuK1xcKG1vYmlsZTsuK2dlY2tvLitmaXJlZm94L2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmlyZWZveCBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnRmlyZWZveCBPUyddLCBWRVJTSU9OXSwgW1xuXG4gICAgICAgICAgICAvLyBDb25zb2xlXG4gICAgICAgICAgICAvKG5pbnRlbmRvfHBsYXlzdGF0aW9uKVxccyhbd2lkczM0cG9ydGFibGV2dV0rKS9pLCAgICAgICAgICAgICAgICAgICAvLyBOaW50ZW5kby9QbGF5c3RhdGlvblxuXG4gICAgICAgICAgICAvLyBHTlUvTGludXggYmFzZWRcbiAgICAgICAgICAgIC8obWludClbXFwvXFxzXFwoXT8oXFx3KikvaSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1pbnRcbiAgICAgICAgICAgIC8obWFnZWlhfHZlY3RvcmxpbnV4KVs7XFxzXS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hZ2VpYS9WZWN0b3JMaW51eFxuICAgICAgICAgICAgLyhqb2xpfFtreGxuXT91YnVudHV8ZGViaWFufHN1c2V8b3BlbnN1c2V8Z2VudG9vfCg/PVxccylhcmNofHNsYWNrd2FyZXxmZWRvcmF8bWFuZHJpdmF8Y2VudG9zfHBjbGludXhvc3xyZWRoYXR8emVud2Fsa3xsaW5wdXMpW1xcL1xccy1dPyg/IWNocm9tKShbXFx3XFwuLV0qKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBKb2xpL1VidW50dS9EZWJpYW4vU1VTRS9HZW50b28vQXJjaC9TbGFja3dhcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmVkb3JhL01hbmRyaXZhL0NlbnRPUy9QQ0xpbnV4T1MvUmVkSGF0L1plbndhbGsvTGlucHVzXG4gICAgICAgICAgICAvKGh1cmR8bGludXgpXFxzPyhbXFx3XFwuXSopL2ksICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEh1cmQvTGludXhcbiAgICAgICAgICAgIC8oZ251KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gR05VXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sIFtcblxuICAgICAgICAgICAgLyhjcm9zKVxcc1tcXHddK1xccyhbXFx3XFwuXStcXHcpL2kgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDaHJvbWl1bSBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnQ2hyb21pdW0gT1MnXSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICAvKHN1bm9zKVxccz8oW1xcd1xcLlxcZF0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTb2xhcmlzXG4gICAgICAgICAgICBdLCBbW05BTUUsICdTb2xhcmlzJ10sIFZFUlNJT05dLCBbXG5cbiAgICAgICAgICAgIC8vIEJTRCBiYXNlZFxuICAgICAgICAgICAgL1xccyhbZnJlbnRvcGMtXXswLDR9YnNkfGRyYWdvbmZseSlcXHM/KFtcXHdcXC5dKikvaSAgICAgICAgICAgICAgICAgICAgLy8gRnJlZUJTRC9OZXRCU0QvT3BlbkJTRC9QQy1CU0QvRHJhZ29uRmx5XG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl0sW1xuXG4gICAgICAgICAgICAvKGhhaWt1KVxccyhcXHcrKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFpa3VcbiAgICAgICAgICAgIF0sIFtOQU1FLCBWRVJTSU9OXSxbXG5cbiAgICAgICAgICAgIC9jZm5ldHdvcmtcXC8uK2Rhcndpbi9pLFxuICAgICAgICAgICAgL2lwW2hvbmVhZF17Miw0fSg/Oi4qb3NcXHMoW1xcd10rKVxcc2xpa2VcXHNtYWN8O1xcc29wZXJhKS9pICAgICAgICAgICAgIC8vIGlPU1xuICAgICAgICAgICAgXSwgW1tWRVJTSU9OLCAvXy9nLCAnLiddLCBbTkFNRSwgJ2lPUyddXSwgW1xuXG4gICAgICAgICAgICAvKG1hY1xcc29zXFxzeClcXHM/KFtcXHdcXHNcXC5dKikvaSxcbiAgICAgICAgICAgIC8obWFjaW50b3NofG1hYyg/PV9wb3dlcnBjKVxccykvaSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hYyBPU1xuICAgICAgICAgICAgXSwgW1tOQU1FLCAnTWFjIE9TJ10sIFtWRVJTSU9OLCAvXy9nLCAnLiddXSwgW1xuXG4gICAgICAgICAgICAvLyBPdGhlclxuICAgICAgICAgICAgLygoPzpvcGVuKT9zb2xhcmlzKVtcXC9cXHMtXT8oW1xcd1xcLl0qKS9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU29sYXJpc1xuICAgICAgICAgICAgLyhhaXgpXFxzKChcXGQpKD89XFwufFxcKXxcXHMpW1xcd1xcLl0pKi9pLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQUlYXG4gICAgICAgICAgICAvKHBsYW5cXHM5fG1pbml4fGJlb3N8b3NcXC8yfGFtaWdhb3N8bW9ycGhvc3xyaXNjXFxzb3N8b3BlbnZtc3xmdWNoc2lhKS9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGFuOS9NaW5peC9CZU9TL09TMi9BbWlnYU9TL01vcnBoT1MvUklTQ09TL09wZW5WTVMvRnVjaHNpYVxuICAgICAgICAgICAgLyh1bml4KVxccz8oW1xcd1xcLl0qKS9pICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVTklYXG4gICAgICAgICAgICBdLCBbTkFNRSwgVkVSU0lPTl1cbiAgICAgICAgXVxuICAgIH07XG5cblxuICAgIC8vLy8vLy8vLy8vLy8vLy8vXG4gICAgLy8gQ29uc3RydWN0b3JcbiAgICAvLy8vLy8vLy8vLy8vLy8vXG4gICAgdmFyIFVBUGFyc2VyID0gZnVuY3Rpb24gKHVhc3RyaW5nLCBleHRlbnNpb25zKSB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB1YXN0cmluZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGV4dGVuc2lvbnMgPSB1YXN0cmluZztcbiAgICAgICAgICAgIHVhc3RyaW5nID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFVBUGFyc2VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVQVBhcnNlcih1YXN0cmluZywgZXh0ZW5zaW9ucykuZ2V0UmVzdWx0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdWEgPSB1YXN0cmluZyB8fCAoKHdpbmRvdyAmJiB3aW5kb3cubmF2aWdhdG9yICYmIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50KSA/IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50IDogRU1QVFkpO1xuICAgICAgICB2YXIgcmd4bWFwID0gZXh0ZW5zaW9ucyA/IHV0aWwuZXh0ZW5kKHJlZ2V4ZXMsIGV4dGVuc2lvbnMpIDogcmVnZXhlcztcblxuICAgICAgICB0aGlzLmdldEJyb3dzZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnJvd3NlciA9IHsgbmFtZTogdW5kZWZpbmVkLCB2ZXJzaW9uOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChicm93c2VyLCB1YSwgcmd4bWFwLmJyb3dzZXIpO1xuICAgICAgICAgICAgYnJvd3Nlci5tYWpvciA9IHV0aWwubWFqb3IoYnJvd3Nlci52ZXJzaW9uKTsgLy8gZGVwcmVjYXRlZFxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXI7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0Q1BVID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGNwdSA9IHsgYXJjaGl0ZWN0dXJlOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChjcHUsIHVhLCByZ3htYXAuY3B1KTtcbiAgICAgICAgICAgIHJldHVybiBjcHU7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0RGV2aWNlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGRldmljZSA9IHsgdmVuZG9yOiB1bmRlZmluZWQsIG1vZGVsOiB1bmRlZmluZWQsIHR5cGU6IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGRldmljZSwgdWEsIHJneG1hcC5kZXZpY2UpO1xuICAgICAgICAgICAgcmV0dXJuIGRldmljZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRFbmdpbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZW5naW5lID0geyBuYW1lOiB1bmRlZmluZWQsIHZlcnNpb246IHVuZGVmaW5lZCB9O1xuICAgICAgICAgICAgbWFwcGVyLnJneC5jYWxsKGVuZ2luZSwgdWEsIHJneG1hcC5lbmdpbmUpO1xuICAgICAgICAgICAgcmV0dXJuIGVuZ2luZTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRPUyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBvcyA9IHsgbmFtZTogdW5kZWZpbmVkLCB2ZXJzaW9uOiB1bmRlZmluZWQgfTtcbiAgICAgICAgICAgIG1hcHBlci5yZ3guY2FsbChvcywgdWEsIHJneG1hcC5vcyk7XG4gICAgICAgICAgICByZXR1cm4gb3M7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0UmVzdWx0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1YSAgICAgIDogdGhpcy5nZXRVQSgpLFxuICAgICAgICAgICAgICAgIGJyb3dzZXIgOiB0aGlzLmdldEJyb3dzZXIoKSxcbiAgICAgICAgICAgICAgICBlbmdpbmUgIDogdGhpcy5nZXRFbmdpbmUoKSxcbiAgICAgICAgICAgICAgICBvcyAgICAgIDogdGhpcy5nZXRPUygpLFxuICAgICAgICAgICAgICAgIGRldmljZSAgOiB0aGlzLmdldERldmljZSgpLFxuICAgICAgICAgICAgICAgIGNwdSAgICAgOiB0aGlzLmdldENQVSgpXG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldFVBID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHVhO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldFVBID0gZnVuY3Rpb24gKHVhc3RyaW5nKSB7XG4gICAgICAgICAgICB1YSA9IHVhc3RyaW5nO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBVQVBhcnNlci5WRVJTSU9OID0gTElCVkVSU0lPTjtcbiAgICBVQVBhcnNlci5CUk9XU0VSID0ge1xuICAgICAgICBOQU1FICAgIDogTkFNRSxcbiAgICAgICAgTUFKT1IgICA6IE1BSk9SLCAvLyBkZXByZWNhdGVkXG4gICAgICAgIFZFUlNJT04gOiBWRVJTSU9OXG4gICAgfTtcbiAgICBVQVBhcnNlci5DUFUgPSB7XG4gICAgICAgIEFSQ0hJVEVDVFVSRSA6IEFSQ0hJVEVDVFVSRVxuICAgIH07XG4gICAgVUFQYXJzZXIuREVWSUNFID0ge1xuICAgICAgICBNT0RFTCAgIDogTU9ERUwsXG4gICAgICAgIFZFTkRPUiAgOiBWRU5ET1IsXG4gICAgICAgIFRZUEUgICAgOiBUWVBFLFxuICAgICAgICBDT05TT0xFIDogQ09OU09MRSxcbiAgICAgICAgTU9CSUxFICA6IE1PQklMRSxcbiAgICAgICAgU01BUlRUViA6IFNNQVJUVFYsXG4gICAgICAgIFRBQkxFVCAgOiBUQUJMRVQsXG4gICAgICAgIFdFQVJBQkxFOiBXRUFSQUJMRSxcbiAgICAgICAgRU1CRURERUQ6IEVNQkVEREVEXG4gICAgfTtcbiAgICBVQVBhcnNlci5FTkdJTkUgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBWRVJTSU9OIDogVkVSU0lPTlxuICAgIH07XG4gICAgVUFQYXJzZXIuT1MgPSB7XG4gICAgICAgIE5BTUUgICAgOiBOQU1FLFxuICAgICAgICBWRVJTSU9OIDogVkVSU0lPTlxuICAgIH07XG5cbiAgICAvLy8vLy8vLy8vL1xuICAgIC8vIEV4cG9ydFxuICAgIC8vLy8vLy8vLy9cblxuXG4gICAgLy8gY2hlY2sganMgZW52aXJvbm1lbnRcbiAgICBpZiAodHlwZW9mKGV4cG9ydHMpICE9PSBVTkRFRl9UWVBFKSB7XG4gICAgICAgIC8vIG5vZGVqcyBlbnZcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgIT09IFVOREVGX1RZUEUgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBtb2R1bGUuZXhwb3J0cyA9IFVBUGFyc2VyO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydHMuVUFQYXJzZXIgPSBVQVBhcnNlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyByZXF1aXJlanMgZW52IChvcHRpb25hbClcbiAgICAgICAgaWYgKHR5cGVvZihkZWZpbmUpID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgICAgIGRlZmluZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFVBUGFyc2VyO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93KSB7XG4gICAgICAgICAgICAvLyBicm93c2VyIGVudlxuICAgICAgICAgICAgd2luZG93LlVBUGFyc2VyID0gVUFQYXJzZXI7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBqUXVlcnkvWmVwdG8gc3BlY2lmaWMgKG9wdGlvbmFsKVxuICAgIC8vIE5vdGU6XG4gICAgLy8gICBJbiBBTUQgZW52IHRoZSBnbG9iYWwgc2NvcGUgc2hvdWxkIGJlIGtlcHQgY2xlYW4sIGJ1dCBqUXVlcnkgaXMgYW4gZXhjZXB0aW9uLlxuICAgIC8vICAgalF1ZXJ5IGFsd2F5cyBleHBvcnRzIHRvIGdsb2JhbCBzY29wZSwgdW5sZXNzIGpRdWVyeS5ub0NvbmZsaWN0KHRydWUpIGlzIHVzZWQsXG4gICAgLy8gICBhbmQgd2Ugc2hvdWxkIGNhdGNoIHRoYXQuXG4gICAgdmFyICQgPSB3aW5kb3cgJiYgKHdpbmRvdy5qUXVlcnkgfHwgd2luZG93LlplcHRvKTtcbiAgICBpZiAoJCAmJiAhJC51YSkge1xuICAgICAgICB2YXIgcGFyc2VyID0gbmV3IFVBUGFyc2VyKCk7XG4gICAgICAgICQudWEgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICQudWEuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlci5nZXRVQSgpO1xuICAgICAgICB9O1xuICAgICAgICAkLnVhLnNldCA9IGZ1bmN0aW9uICh1YXN0cmluZykge1xuICAgICAgICAgICAgcGFyc2VyLnNldFVBKHVhc3RyaW5nKTtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwYXJzZXIuZ2V0UmVzdWx0KCk7XG4gICAgICAgICAgICBmb3IgKHZhciBwcm9wIGluIHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICQudWFbcHJvcF0gPSByZXN1bHRbcHJvcF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXG59KSh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyA/IHdpbmRvdyA6IHRoaXMpO1xuIl19

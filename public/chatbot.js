/*!
 * Chatbot Embed Script v2.0.0
 * Public chatbot widget
 *
 * Usage:
 * <script
 *   src="https://yourdomain.com/chatbot.js"
 *   data-chatbot-id="cb_xxxxxxxx">
 * </script>
 *
 * AI provider API keys are NEVER exposed here.
 * All AI communication happens through the server API.
 */

(function () {
    'use strict';

    /* =========================================================
       FIND API BASE URL
       ========================================================= */

    var API_BASE = (function () {
        var scripts = document.getElementsByTagName('script');

        for (var i = 0; i < scripts.length; i++) {
            var scriptSrc = scripts[i].src || '';

            if (scriptSrc.indexOf('chatbot.js') !== -1) {
                var index = scriptSrc.indexOf('/chatbot.js');

                if (index !== -1) {
                    return scriptSrc.substring(0, index);
                }

                try {
                    return new URL(scriptSrc).origin;
                } catch (e) {
                    return window.location.origin;
                }
            }
        }

        return window.location.origin;
    })();


    /* =========================================================
       GLOBAL STATE
       ========================================================= */

    var chatbotId = null;
    var config = null;

    var conversationId = null;
    var visitorId = null;
    var sessionId = null;

    var isWidgetOpen = false;
    var isSending = false;

    var shadow = null;


    /* =========================================================
       ID HELPERS
       ========================================================= */

    function generateId(prefix) {
        return prefix + '_' + Math.random().toString(36).substring(2, 12);
    }


    function getCookie(name) {
        var match = document.cookie.match(
            new RegExp('(^| )' + name + '=([^;]+)')
        );

        return match ? decodeURIComponent(match[2]) : null;
    }


    function setCookie(name, value, days) {
        var date = new Date();

        date.setTime(
            date.getTime() + (days * 24 * 60 * 60 * 1000)
        );

        document.cookie =
            name +
            '=' +
            encodeURIComponent(value) +
            ';expires=' +
            date.toUTCString() +
            ';path=/;SameSite=Lax';
    }


    function ensureIds() {

        visitorId = getCookie('chatbot_visitor_id');

        if (!visitorId) {
            visitorId = generateId('v');

            setCookie(
                'chatbot_visitor_id',
                visitorId,
                365
            );
        }


        sessionId = getCookie('chatbot_session_id');

        if (!sessionId) {
            sessionId = generateId('s');

            setCookie(
                'chatbot_session_id',
                sessionId,
                1
            );
        }
    }


    /* =========================================================
       CREATE WIDGET
       ========================================================= */

    function createWidget() {

        if (document.getElementById('chatbot-widget-container')) {
            return;
        }


        var container = document.createElement('div');

        container.id = 'chatbot-widget-container';

        container.style.cssText =
            'position:fixed;' +
            'bottom:0;' +
            'right:0;' +
            'width:0;' +
            'height:0;' +
            'z-index:2147483647;' +
            'pointer-events:auto;';


        document.body.appendChild(container);


        var host = document.createElement('div');

        host.id = 'chatbot-shadow-host';

        host.style.pointerEvents = 'auto';

        container.appendChild(host);


        if (typeof host.attachShadow === 'function') {
            shadow = host.attachShadow({
                mode: 'open'
            });
        } else {
            shadow = host;
        }


        /* CSS */

        var style = document.createElement('style');

        style.textContent = getStyles();

        shadow.appendChild(style);


        /* HTML */

        var wrapper = document.createElement('div');

        wrapper.innerHTML = getMarkup();

        shadow.appendChild(wrapper);


        /* Events */

        bindEvents();


        /* Apply configuration */

        applyWidgetConfig();


        console.log('[Chatbot] Widget created successfully.');
    }


    /* =========================================================
       STYLES
       ========================================================= */

    function getStyles() {

        return [

            '* {',
            '  margin: 0;',
            '  padding: 0;',
            '  box-sizing: border-box;',
            '}',


            '#chatbot-widget {',

            '  position: fixed;',
            '  right: 20px;',
            '  bottom: 90px;',

            '  width: 380px;',
            '  max-width: calc(100vw - 20px);',

            '  height: 500px;',
            '  max-height: calc(100vh - 110px);',

            '  background: var(--cb-bg, #FFFFFF);',

            '  color: var(--cb-text, #1F2937);',

            '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;',

            '  font-size: var(--cb-font-size, 14px);',

            '  border-radius: var(--cb-radius, 12px);',

            '  box-shadow: 0 10px 35px rgba(0,0,0,0.20);',

            '  display: none;',

            '  flex-direction: column;',

            '  overflow: hidden;',

            '  z-index: 2147483646;',
            '}',


            '#chatbot-widget.open {',
            '  display: flex !important;',
            '}',


            '#chatbot-header {',

            '  min-height: 64px;',

            '  background: var(--cb-primary, #2563EB);',

            '  color: #FFFFFF;',

            '  padding: 14px 16px;',

            '  display: flex;',
            '  align-items: center;',
            '  justify-content: space-between;',

            '  font-weight: 600;',
            '  font-size: 16px;',

            '  flex-shrink: 0;',
            '}',


            '#chatbot-header .title {',

            '  display: flex;',
            '  align-items: center;',
            '  min-width: 0;',
            '}',


            '#chatbot-header .logo {',

            '  width: 34px;',
            '  height: 34px;',

            '  border-radius: 50%;',

            '  margin-right: 10px;',

            '  object-fit: cover;',

            '  display: none;',
            '}',


            '#chatbot-header .logo.show {',
            '  display: block;',
            '}',


            '#chatbot-title {',

            '  white-space: nowrap;',
            '  overflow: hidden;',
            '  text-overflow: ellipsis;',
            '}',


            '#chatbot-close {',

            '  background: transparent;',
            '  border: none;',

            '  color: white;',

            '  font-size: 28px;',
            '  line-height: 28px;',

            '  cursor: pointer;',

            '  padding: 2px 8px;',

            '  flex-shrink: 0;',
            '}',


            '#chatbot-close:hover {',
            '  opacity: 0.8;',
            '}',


            '#chatbot-subtitle {',

            '  font-size: 11px;',
            '  font-weight: 400;',
            '  opacity: 0.85;',
            '  margin-top: 2px;',
            '}',


            '#chatbot-messages {',

            '  flex: 1;',

            '  padding: 16px;',

            '  overflow-y: auto;',

            '  display: flex;',
            '  flex-direction: column;',

            '  gap: 10px;',

            '  background: var(--cb-bg, #FFFFFF);',
            '}',


            '.message {',

            '  max-width: 82%;',

            '  padding: 10px 14px;',

            '  border-radius: 16px;',

            '  line-height: 1.5;',

            '  word-wrap: break-word;',
            '  white-space: pre-wrap;',
            '}',


            '.message.user {',

            '  background: var(--cb-user-msg, #2563EB);',

            '  color: #FFFFFF;',

            '  align-self: flex-end;',

            '  border-bottom-right-radius: 4px;',
            '}',


            '.message.bot {',

            '  background: var(--cb-bot-msg, #F3F4F6);',

            '  color: var(--cb-text, #1F2937);',

            '  align-self: flex-start;',

            '  border-bottom-left-radius: 4px;',
            '}',


            '.message.bot.loading {',
            '  opacity: 0.65;',
            '}',


            '.sources {',

            '  font-size: 11px;',

            '  opacity: 0.7;',

            '  margin-top: 7px;',
            '}',


            '#chatbot-input-area {',

            '  display: flex;',

            '  padding: 12px;',

            '  background: var(--cb-bg, #FFFFFF);',

            '  border-top: 1px solid #e5e7eb;',

            '  flex-shrink: 0;',
            '}',


            '#chatbot-input {',

            '  flex: 1;',

            '  min-width: 0;',

            '  padding: 11px 14px;',

            '  border: 1px solid #d1d5db;',

            '  border-radius: 22px;',

            '  font-size: var(--cb-font-size, 14px);',

            '  outline: none;',

            '  color: #111827;',

            '  background: #FFFFFF;',
            '}',


            '#chatbot-input:focus {',

            '  border-color: var(--cb-primary, #2563EB);',
            '}',


            '#chatbot-send-btn {',

            '  margin-left: 8px;',

            '  padding: 10px 18px;',

            '  background: var(--cb-primary, #2563EB);',

            '  color: white;',

            '  border: none;',

            '  border-radius: 22px;',

            '  cursor: pointer;',

            '  font-size: var(--cb-font-size, 14px);',

            '  font-weight: 600;',
            '}',


            '#chatbot-send-btn:hover {',
            '  opacity: 0.9;',
            '}',


            '#chatbot-send-btn:disabled {',

            '  opacity: 0.5;',
            '  cursor: not-allowed;',
            '}',


            '#chatbot-toggle {',

            '  position: fixed;',

            '  right: 20px;',
            '  bottom: 20px;',

            '  width: var(--cb-button-size, 58px);',
            '  height: var(--cb-button-size, 58px);',

            '  border-radius: 50%;',

            '  background: var(--cb-primary, #2563EB);',

            '  color: white;',

            '  border: none;',

            '  cursor: pointer;',

            '  box-shadow: 0 5px 18px rgba(0,0,0,0.22);',

            '  display: flex;',
            '  align-items: center;',
            '  justify-content: center;',

            '  font-size: 25px;',

            '  z-index: 2147483647;',

            '  pointer-events: auto;',
            '}',


            '#chatbot-toggle:hover {',
            '  transform: scale(1.05);',
            '}',


            '#chatbot-branding {',

            '  text-align: center;',

            '  padding: 6px;',

            '  font-size: 10px;',

            '  color: #9ca3af;',

            '  background: var(--cb-bg, #FFFFFF);',
            '}',


            '@media (max-width: 600px) {',

            '  #chatbot-widget {',

            '    right: 0;',
            '    bottom: 0;',

            '    width: 100vw;',
            '    max-width: 100vw;',

            '    height: 100vh;',
            '    max-height: 100vh;',

            '    border-radius: 0;',
            '  }',


            '  #chatbot-toggle {',

            '    right: 10px;',
            '    bottom: 10px;',
            '  }',
            '}'

        ].join('\n');
    }


    /* =========================================================
       MARKUP
       ========================================================= */

    function getMarkup() {

        return (

            '<div id="chatbot-widget">' +

                '<div id="chatbot-header">' +

                    '<div class="title">' +

                        '<img ' +
                        'class="logo" ' +
                        'id="chatbot-logo" ' +
                        'src="" ' +
                        'alt="logo"' +
                        '/>' +

                        '<div>' +

                            '<div id="chatbot-title">' +
                                'Chatbot' +
                            '</div>' +

                            '<div id="chatbot-subtitle">' +
                                'We are here to help' +
                            '</div>' +

                        '</div>' +

                    '</div>' +

                    '<button ' +
                    'type="button" ' +
                    'id="chatbot-close" ' +
                    'aria-label="Close chat">' +
                        '&times;' +
                    '</button>' +

                '</div>' +


                '<div id="chatbot-messages"></div>' +


                '<div id="chatbot-input-area">' +

                    '<input ' +
                    'type="text" ' +
                    'id="chatbot-input" ' +
                    'placeholder="Type your message..." ' +
                    'autocomplete="off"' +
                    '/>' +

                    '<button ' +
                    'type="button" ' +
                    'id="chatbot-send-btn">' +
                        'Send' +
                    '</button>' +

                '</div>' +


                '<div id="chatbot-branding">' +
                    'Powered by Chatbot Platform' +
                '</div>' +

            '</div>' +


            '<button ' +
            'type="button" ' +
            'id="chatbot-toggle" ' +
            'aria-label="Open chat" ' +
            'title="Open chat">' +
                '&#128172;' +
            '</button>'

        );
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    function bindEvents() {

        var toggle = shadow.getElementById('chatbot-toggle');
        var closeBtn = shadow.getElementById('chatbot-close');
        var input = shadow.getElementById('chatbot-input');
        var sendBtn = shadow.getElementById('chatbot-send-btn');


        console.log('[Chatbot] Binding events...');


        if (!toggle) {
            console.error('[Chatbot] Toggle button not found.');
            return;
        }


        if (!closeBtn) {
            console.error('[Chatbot] Close button not found.');
            return;
        }


        /* Open */

        toggle.addEventListener('click', function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log('[Chatbot] Robot clicked.');

            openWidget();
        });


        /* Close */

        closeBtn.addEventListener('click', function (event) {

            event.preventDefault();
            event.stopPropagation();

            console.log('[Chatbot] Close clicked.');

            closeWidget();
        });


        /* Send message */

        function sendMessage() {

            var msg = input.value.trim();


            if (!msg || isSending) {
                return;
            }


            isSending = true;


            sendBtn.disabled = true;
            input.disabled = true;


            addMessage(
                'user',
                msg
            );


            input.value = '';


            addMessage(
                'bot',
                'Thinking...',
                true
            );


            sendMessageToBackend(msg);
        }


        sendBtn.addEventListener(
            'click',
            function (event) {

                event.preventDefault();

                sendMessage();
            }
        );


        input.addEventListener(
            'keydown',
            function (event) {

                if (event.key === 'Enter') {

                    event.preventDefault();

                    sendMessage();
                }
            }
        );


        console.log('[Chatbot] Events ready.');
    }


    /* =========================================================
       OPEN WIDGET
       ========================================================= */

    function openWidget() {

        var widget =
            shadow.getElementById('chatbot-widget');


        if (!widget) {

            console.error(
                '[Chatbot] Chat window not found.'
            );

            return;
        }


        console.log(
            '[Chatbot] Opening chat...'
        );


        widget.classList.add('open');


        /* Force display */

        widget.style.display = 'flex';


        isWidgetOpen = true;


        /* Welcome message */

        var messages =
            shadow.getElementById(
                'chatbot-messages'
            );


        if (
            messages &&
            messages.children.length === 0
        ) {

            var welcome =
                getWelcomeMessage();


            addMessage(
                'bot',
                welcome
            );
        }


        /* Focus */

        var input =
            shadow.getElementById(
                'chatbot-input'
            );


        if (input) {

            setTimeout(
                function () {

                    input.focus();

                },
                100
            );
        }


        console.log(
            '[Chatbot] Chat opened.'
        );
    }


    /* =========================================================
       CLOSE WIDGET
       ========================================================= */

    function closeWidget() {

        var widget =
            shadow.getElementById(
                'chatbot-widget'
            );


        if (!widget) {
            return;
        }


        console.log(
            '[Chatbot] Closing chat...'
        );


        widget.classList.remove('open');


        widget.style.display = 'none';


        isWidgetOpen = false;
    }


    /* =========================================================
       TOGGLE
       ========================================================= */

    function toggleWidget() {

        if (isWidgetOpen) {

            closeWidget();

        } else {

            openWidget();
        }
    }


    /* =========================================================
       WELCOME MESSAGE
       ========================================================= */

    function getWelcomeMessage() {

        if (!config) {

            return 'Hello! How can I help you today?';
        }


        if (
            config.aiConfig &&
            config.aiConfig.welcomeMessage
        ) {

            return config.aiConfig.welcomeMessage;
        }


        if (
            config.appearance &&
            config.appearance.welcome_message
        ) {

            return config.appearance.welcome_message;
        }


        if (
            config.appearance &&
            config.appearance.welcomeMessage
        ) {

            return config.appearance.welcomeMessage;
        }


        return 'Hello! How can I help you today?';
    }


    /* =========================================================
       ADD MESSAGE
       ========================================================= */

    function addMessage(
        role,
        text,
        isLoading
    ) {

        var messagesEl =
            shadow.getElementById(
                'chatbot-messages'
            );


        if (!messagesEl) {
            return;
        }


        var msgDiv =
            document.createElement('div');


        msgDiv.className =
            'message ' +
            role +
            (isLoading ? ' loading' : '');


        msgDiv.textContent = text;


        messagesEl.appendChild(msgDiv);


        messagesEl.scrollTop =
            messagesEl.scrollHeight;
    }


    /* =========================================================
       ADD MESSAGE + SOURCES
       ========================================================= */

    function addMessageWithSources(
        role,
        text,
        sources
    ) {

        var messagesEl =
            shadow.getElementById(
                'chatbot-messages'
            );


        if (!messagesEl) {
            return;
        }


        var msgDiv =
            document.createElement('div');


        msgDiv.className =
            'message ' + role;


        msgDiv.textContent = text;


        if (
            sources &&
            sources.length > 0
        ) {

            var srcDiv =
                document.createElement('div');


            srcDiv.className =
                'sources';


            var sourceNames =
                sources.map(
                    function (source) {

                        return (
                            source.file_name ||
                            source.fileName ||
                            source.name ||
                            'Source'
                        );
                    }
                );


            srcDiv.textContent =
                'Sources: ' +
                sourceNames.join(', ');


            msgDiv.appendChild(srcDiv);
        }


        messagesEl.appendChild(msgDiv);


        messagesEl.scrollTop =
            messagesEl.scrollHeight;
    }


    /* =========================================================
       SEND MESSAGE TO BACKEND
       ========================================================= */

    function sendMessageToBackend(message) {

        var payload = {

            conversation_id:
                conversationId,

            message:
                message,

            visitor_id:
                visitorId,

            session_id:
                sessionId
        };


        console.log(
            '[Chatbot] Sending message...'
        );


        var xhr =
            new XMLHttpRequest();


        xhr.open(
            'POST',

            API_BASE +
            '/api/public/chatbots/' +
            encodeURIComponent(chatbotId) +
            '/messages',

            true
        );


        xhr.setRequestHeader(
            'Content-Type',
            'application/json'
        );


        xhr.timeout = 30000;


        xhr.onreadystatechange =
            function () {

                if (
                    xhr.readyState !== 4
                ) {
                    return;
                }


                isSending = false;


                var sendBtn =
                    shadow.getElementById(
                        'chatbot-send-btn'
                    );


                var input =
                    shadow.getElementById(
                        'chatbot-input'
                    );


                if (sendBtn) {
                    sendBtn.disabled = false;
                }


                if (input) {
                    input.disabled = false;
                }


                var loadingMsg =
                    shadow.querySelector(
                        '.message.bot.loading'
                    );


                if (loadingMsg) {
                    loadingMsg.remove();
                }


                console.log(
                    '[Chatbot] Response status:',
                    xhr.status
                );


                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    try {

                        var response =
                            JSON.parse(
                                xhr.responseText
                            );


                        conversationId =
                            response.conversation_id ||
                            response.conversationId ||
                            conversationId;


                        var answer =
                            response.message ||
                            response.answer ||
                            response.response;


                        if (!answer) {

                            answer =
                                'I received your message, but no response was returned.';
                        }


                        addMessageWithSources(
                            'bot',
                            answer,
                            response.sources || []
                        );


                    } catch (error) {

                        console.error(
                            '[Chatbot] Invalid JSON response:',
                            error
                        );


                        console.error(
                            '[Chatbot] Raw response:',
                            xhr.responseText
                        );


                        addMessage(
                            'bot',
                            'Sorry, I could not process the server response.'
                        );
                    }


                } else {

                    var errorMessage =
                        'Sorry, there was an error processing your message.';


                    try {

                        var errorResponse =
                            JSON.parse(
                                xhr.responseText
                            );


                        if (
                            errorResponse.error
                        ) {

                            errorMessage =
                                errorResponse.error;
                        }

                    } catch (error) {

                        console.error(
                            '[Chatbot] Error response was not JSON.'
                        );
                    }


                    addMessage(
                        'bot',
                        errorMessage
                    );
                }
            };


        xhr.onerror =
            function () {

                isSending = false;


                var sendBtn =
                    shadow.getElementById(
                        'chatbot-send-btn'
                    );


                var input =
                    shadow.getElementById(
                        'chatbot-input'
                    );


                if (sendBtn) {
                    sendBtn.disabled = false;
                }


                if (input) {
                    input.disabled = false;
                }


                var loadingMsg =
                    shadow.querySelector(
                        '.message.bot.loading'
                    );


                if (loadingMsg) {
                    loadingMsg.remove();
                }


                console.error(
                    '[Chatbot] Network error.'
                );


                addMessage(
                    'bot',
                    'Unable to connect to the server. Please check your connection and try again.'
                );
            };


        xhr.ontimeout =
            function () {

                isSending = false;


                var sendBtn =
                    shadow.getElementById(
                        'chatbot-send-btn'
                    );


                var input =
                    shadow.getElementById(
                        'chatbot-input'
                    );


                if (sendBtn) {
                    sendBtn.disabled = false;
                }


                if (input) {
                    input.disabled = false;
                }


                var loadingMsg =
                    shadow.querySelector(
                        '.message.bot.loading'
                    );


                if (loadingMsg) {
                    loadingMsg.remove();
                }


                console.error(
                    '[Chatbot] Request timeout.'
                );


                addMessage(
                    'bot',
                    'The request timed out. Please try again.'
                );
            };


        xhr.send(
            JSON.stringify(payload)
        );
    }


    /* =========================================================
       APPLY CONFIGURATION
       ========================================================= */

    function applyWidgetConfig() {

        if (!config || !shadow) {
            return;
        }


        var appearance =
            config.appearance || {};


        var root =
            shadow.host;


        /* Colors */

        if (
            appearance.primary_color ||
            appearance.primaryColor
        ) {

            root.style.setProperty(
                '--cb-primary',

                appearance.primary_color ||
                appearance.primaryColor
            );
        }


        if (
            appearance.secondary_color ||
            appearance.secondaryColor
        ) {

            root.style.setProperty(
                '--cb-secondary',

                appearance.secondary_color ||
                appearance.secondaryColor
            );
        }


        if (
            appearance.text_color ||
            appearance.textColor
        ) {

            root.style.setProperty(
                '--cb-text',

                appearance.text_color ||
                appearance.textColor
            );
        }


        if (
            appearance.background_color ||
            appearance.backgroundColor
        ) {

            root.style.setProperty(
                '--cb-bg',

                appearance.background_color ||
                appearance.backgroundColor
            );
        }


        if (
            appearance.user_message_color ||
            appearance.userMessageColor
        ) {

            root.style.setProperty(
                '--cb-user-msg',

                appearance.user_message_color ||
                appearance.userMessageColor
            );
        }


        if (
            appearance.bot_message_color ||
            appearance.botMessageColor
        ) {

            root.style.setProperty(
                '--cb-bot-msg',

                appearance.bot_message_color ||
                appearance.botMessageColor
            );
        }


        if (
            appearance.border_radius !== undefined ||
            appearance.borderRadius !== undefined
        ) {

            var radius =
                appearance.border_radius !== undefined
                    ? appearance.border_radius
                    : appearance.borderRadius;


            root.style.setProperty(
                '--cb-radius',
                radius + 'px'
            );
        }


        if (
            appearance.font_size !== undefined ||
            appearance.fontSize !== undefined
        ) {

            var fontSize =
                appearance.font_size !== undefined
                    ? appearance.font_size
                    : appearance.fontSize;


            root.style.setProperty(
                '--cb-font-size',
                fontSize + 'px'
            );
        }


        if (
            appearance.button_size !== undefined ||
            appearance.buttonSize !== undefined
        ) {

            var buttonSize =
                appearance.button_size !== undefined
                    ? appearance.button_size
                    : appearance.buttonSize;


            root.style.setProperty(
                '--cb-button-size',
                buttonSize + 'px'
            );
        }


        /* Title */

        var title =
            appearance.title ||
            config.name ||
            'Chatbot';


        var titleElement =
            shadow.getElementById(
                'chatbot-title'
            );


        if (titleElement) {
            titleElement.textContent = title;
        }


        /* Subtitle */

        var subtitle =
            appearance.subtitle ||
            'We are here to help';


        var subtitleElement =
            shadow.getElementById(
                'chatbot-subtitle'
            );


        if (subtitleElement) {
            subtitleElement.textContent = subtitle;
        }


        /* Placeholder */

        var placeholder =
            appearance.placeholder_text ||
            appearance.placeholderText ||
            'Type your message...';


        var input =
            shadow.getElementById(
                'chatbot-input'
            );


        if (input) {
            input.placeholder = placeholder;
        }


        /* Logo */

        var logoUrl =
            appearance.logo_url ||
            appearance.logoUrl ||
            appearance.avatar_url ||
            appearance.avatarUrl ||
            '';


        var logo =
            shadow.getElementById(
                'chatbot-logo'
            );


        if (
            logo &&
            logoUrl
        ) {

            logo.src = logoUrl;

            logo.classList.add('show');
        }


        /* Position */

        var toggle =
            shadow.getElementById(
                'chatbot-toggle'
            );


        if (
            toggle &&
            (
                appearance.position ===
                    'bottom-left'
            )
        ) {

            toggle.style.right = 'auto';
            toggle.style.left = '20px';


            var widget =
                shadow.getElementById(
                    'chatbot-widget'
                );


            if (widget) {

                widget.style.right =
                    'auto';

                widget.style.left =
                    '20px';
            }
        }


        /* Branding */

        var branding =
            shadow.querySelector(
                '#chatbot-branding'
            );


        if (
            branding &&
            appearance.show_branding === false
        ) {

            branding.style.display =
                'none';
        }


        if (
            branding &&
            appearance.showBranding === false
        ) {

            branding.style.display =
                'none';
        }
    }


    /* =========================================================
       LOAD CONFIG
       ========================================================= */

    function loadConfig() {

        var xhr =
            new XMLHttpRequest();


        var url =
            API_BASE +
            '/api/public/chatbots/' +
            encodeURIComponent(chatbotId) +
            '/config';


        console.log(
            '[Chatbot] Loading configuration:',
            url
        );


        xhr.open(
            'GET',
            url,
            true
        );


        xhr.timeout = 10000;


        xhr.onreadystatechange =
            function () {

                if (
                    xhr.readyState !== 4
                ) {
                    return;
                }


                console.log(
                    '[Chatbot] Config response status:',
                    xhr.status
                );


                if (
                    xhr.status >= 200 &&
                    xhr.status < 300
                ) {

                    try {

                        config =
                            JSON.parse(
                                xhr.responseText
                            );


                        console.log(
                            '[Chatbot] Configuration loaded.',
                            config
                        );


                        createWidget();

                    } catch (error) {

                        console.error(
                            '[Chatbot] Failed to parse configuration:',
                            error
                        );


                        console.error(
                            '[Chatbot] Response:',
                            xhr.responseText
                        );
                    }


                } else {

                    console.error(
                        '[Chatbot] Failed to load configuration.',
                        xhr.status,
                        xhr.responseText
                    );
                }
            };


        xhr.onerror =
            function () {

                console.error(
                    '[Chatbot] Network error while loading configuration.'
                );
            };


        xhr.ontimeout =
            function () {

                console.error(
                    '[Chatbot] Configuration request timed out.'
                );
            };


        xhr.send();
    }


    /* =========================================================
       INITIALIZE
       ========================================================= */

    function init() {

        console.log(
            '[Chatbot] Initializing...'
        );


        var scripts =
            document.getElementsByTagName(
                'script'
            );


        for (
            var i = 0;
            i < scripts.length;
            i++
        ) {

            var id =
                scripts[i].getAttribute(
                    'data-chatbot-id'
                );


            if (id) {

                chatbotId = id;

                break;
            }
        }


        if (!chatbotId) {

            console.error(
                '[Chatbot] data-chatbot-id attribute is missing.'
            );

            return;
        }


        console.log(
            '[Chatbot] Chatbot ID:',
            chatbotId
        );


        console.log(
            '[Chatbot] API Base:',
            API_BASE
        );


        ensureIds();


        loadConfig();
    }


    /* =========================================================
       START
       ========================================================= */

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            init
        );

    } else {

        init();
    }

})();
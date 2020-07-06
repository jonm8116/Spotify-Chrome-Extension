
let redirectUrl = chrome.identity.getRedirectURL();

let authUrl = urlMap.get("authUrl");
authUrl += '?response_type=' + encodeURIComponent('token');
authUrl += '&client_id=' + encodeURIComponent(client_id);
authUrl += '&scope=' + encodeURIComponent(scopes);
authUrl += '&redirect_uri=' + redirectUrl;
let state = generateRandomString(16);
authUrl += '&state=' + encodeURIComponent(state);

function generateRandomString(length) {
                var text = '';
                var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

                for (var i = 0; i < length; i++) {
                    text += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return text;
}

function httpGetAsync(reqUrl, reqType, reqBody)
{

    return new Promise((resolve, reject) => {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                return resolve(xmlHttp.response);
            } else{
                return reject (Error(JSON.stringify({
                        status: xmlHttp.status,
                        statusText: xmlHttp.statusText
                    })
                ))
            }
        }
        xmlHttp.open(reqType, reqUrl, true); // true for asynchronous 
        xmlHttp.send(null);
    });
}

function authAction() 
{
    console.log(authUrl);

    chrome.identity.launchWebAuthFlow({
        url:authUrl,
        interactive: true
    },
    function (redirect_url){
        console.log(redirect_url);
        var access_token = redirect_url.match('(?<=#access_token=)[^&]*');

        chrome.storage.sync.set({accessToken: access_token}, function() {
          console.log('Key Value is set \n in chrome storage api');
        });
        if(chrome.runtime.lastError){
            console.log("inside error check");
            console.log(chrome.runtime.lastError);
        }
    });
}

chrome.extension.onMessage.addListener(function(request, sender, sendResponse){
    if(request.action == 'authSpotifyAction'){
        authAction();
    }
    if(request.action == 'searchSongs'){
        searchSongs(request.doc);
    }

});

chrome.browserAction.onClicked.addListener(function (tab) {
    console.log('browser action selected');
    chrome.tabs.sendMessage(tab.id, {action: 'search_dom'});

});

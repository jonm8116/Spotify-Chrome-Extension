let urlMap = new Map();
urlMap.set("searchUrl", "https://api.spotify.com/v1/search");
urlMap.set("curUserUrl", "https://api.spotify.com/v1/me");
urlMap.set("getPlaylistsUrl", "https://api.spotify.com/v1/users");
urlMap.set("authUrl", "https://accounts.spotify.com/authorize");
urlMap.set("addSongUrl", "https://api.spotify.com/v1/playlists");
urlMap.set("imgUploadUrl", "https://api.spotify.com/v1/playlists")

function httpGetAsync(reqUrl, reqType, accessToken, reqBody, tmp)
{
    console.log("reqUrl is \n" + reqUrl);
    console.log("accessToken is \n" + accessToken);

    return new Promise((resolve, reject) => {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                return resolve(xmlHttp.response);
            } else{
                console.log('not ready just yet');
            }
        }
        xmlHttp.open(reqType, reqUrl, true); // true for asynchronous 
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        if(reqType == "GET"){
            xmlHttp.send();
        } 
        else if(reqType == "POST") {
            xmlHttp.send(JSON.stringify(reqBody));
        } 
        else {
            xmlHttp.send(reqBody);
        }
    });
}

function findSongFromSearchResults(jsonObj, songTitle, artist){
    console.log("Inside findSongFromSearchResults");
    songTitle = songTitle.trim();
    artist = artist.trim();

    console.log("songTitle in songSearchResults " + songTitle);
    console.log("artist in songSearchResults " + artist);
    return new Promise((resolve, reject) => {
        for(var i=0; i<jsonObj['tracks']['items'].length; i++){
            console.log(jsonObj['tracks']['items'][i]['name']);
            if(jsonObj['tracks']['items'][i]['name'].includes(songTitle)){
                for(var j=0; j<jsonObj['tracks']['items'][i]['artists'].length; j++){
                    console.log(jsonObj['tracks']['items'][i]['artists'][j]['name']);
                    if(jsonObj['tracks']['items'][i]['artists'][j]['name'].includes(artist)){
                        return resolve(i);
                    }
                }
            }
        }
        return reject("Couldn't find song among search results");

    });
}


function searchSongs(songTitle, artist, checkArtist){
    console.log("inside if statement");
    
    var searchUrl = urlMap.get("searchUrl");
    if(checkArtist){
        searchUrl += "?q=" + artist.trim();
        searchUrl += "&type=artist";
    }
    else{
        searchUrl += "?q=" + songTitle;
        searchUrl += "&type=track";
        searchUrl += "&limit=50";
    }

    chrome.storage.sync.get(['accessToken'], function(result) {
        console.log('Value found in storage api \n');
        var accessToken = result.accessToken[0];
                    
        httpGetAsync(searchUrl, "GET", accessToken, {}, 1)
            .then((data) =>{
                console.log("Inside request call");
                //console.log(typeof data);
                var jsonObj = JSON.parse(data);
                console.log(typeof jsonObj);
                console.log(jsonObj);
                console.log(jsonObj['tracks']['items'][0]['name']);
                
                findSongFromSearchResults(jsonObj, songTitle, artist)
                    .then((selectedId) => {
                         
                        console.log("selected Id is " + selectedId);
                        // add song to selected playlist
                        // get current selected playlist
                        chrome.storage.sync.get(['curPlaylistId'], function(playlistData){
                            if(playlistData.curPlaylistId){
                                var reqBody = {
                                    'uris': [jsonObj['tracks']['items'][selectedId]['uri']]
                                };
                                var reqUrl = urlMap.get("addSongUrl");
                                reqUrl += "/";
                                reqUrl += playlistData.curPlaylistId;
                                reqUrl += "/tracks";
                                
                                httpGetAsync(reqUrl, "POST", accessToken, reqBody, 1)
                                    .then((addSongData) => {
                                        console.log("Added Song to playlist " + playlistData.curPlaylistId + "!");
                                    });
                            }
                        });
                    })
                .catch(() => {
                    console.log("starting recursive call");
                    if(checkArtist){
                        console.log("already performed call so exiting...");
                        return;
                    } else {
                        searchSongs(songTitle, artist, true);
                    }
                });       
            });
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    console.log('hit handler');
    if(request.message === 'searchSongs'){
        console.log("inside if statement");
        var docTitle = document.title.replace(/ *\([^]*\) */g, "");
        docTitle = docTitle.replace(/\[[A-Za-z0-9 ]*\]/g, "");
        docTitle = docTitle.replace(/(feat. [A-Za-z0-9 ]*)/g, "");
        docTitle = docTitle.replace(/(feat [A-Za-z0-9 ]*)/g, "");
        docTitle = docTitle.replace(/(ft [A-Za-z0-9 ]*)/g, "");
        docTitle = docTitle.replace(/(ft. [A-Za-z0-9 ]*)/g, "");
        var title = docTitle.split("-");
        if(title.length <= 2){
            title = title[0].split(":");
        }
        var songTitle = title[1].trim();
        searchSongs(songTitle, title[0], false);
    }

});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    if(request.message === "loadPlaylists"){
        console.log("INSIDE AUTH SPOTIFY ACTION");
        console.log(request.htmltag);
    }
});




function toDataUrl(url){
    return new Promise((resolve, reject) => {

        console.log("[function]: toDataUrl start")
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onload = function() {
            var reader = new FileReader();
            console.log("[function]: xmlHttp.onload start");
            reader.onload = function() {
                console.log("[value]: reader.result");
                console.log(reader.result);
                resolve(reader.result);
            }
            reader.readAsDataURL(xmlHttp.response);
        }
        xmlHttp.open('GET', url);
        xmlHttp.responseType = 'blob';
        xmlHttp.send();
    });
}


function uploadImgFromYTUrl(){
    var videoId = document.location.href.split("=")[1];
    var imgUrl = 'https://img.youtube.com/vi/'+videoId+'/0.jpg';
    console.log("[function]: uploadImgFromYTUrl start");
    toDataUrl(imgUrl)
        .then((imgData) => {
        
        console.log("[return]: toDataUrl");
        console.log("[value]: imgData ");
        console.log(imgData);
        chrome.storage.sync.get(['accessToken'], function(result){
        
            var accessToken = result.accessToken[0];
                
                chrome.storage.sync.get(['curPlaylistId'], function(playlistData){
                    if(playlistData.curPlaylistId){
                        var reqUrl = urlMap.get("imgUploadUrl");
                        reqUrl += "/";
                        reqUrl += playlistData.curPlaylistId;
                        reqUrl += "/images";
                        console.log("Before upload");
                        console.log(imgData);
                        imgData = imgData.substring(23, imgData.length);
                        reqBody = {
                            'body': imgData
                        };
                        
                        console.log("[value]: reqBody");
                        console.log(reqBody);

                        httpGetAsync(reqUrl, "PUT", accessToken, imgData, 1)
                            .then((imgUploadData) => {
                                console.log("Image data after the upload " + imgUploadData);
                            });
                    }
                });
            
        });
        
        });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
    if(request.message === 'uploadImg'){
        console.log("Inside uploadImg handler");
        uploadImgFromYTUrl();
    }
});



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse){
    console.log('inside profile handler');
    if(request.message === 'curUserProfile'){
        
        var curUserUrl = urlMap.get("curUserUrl");
        chrome.storage.sync.get(['accessToken'], function(result){
            var accessToken = result.accessToken[0];
            
            httpGetAsync(curUserUrl, "GET", accessToken, {}, 1)
                .then((data) => {
                    var jsonObj = JSON.parse(data);

                    var reqUrl = urlMap.get("getPlaylistsUrl");
                    reqUrl+="/";
                    reqUrl+=jsonObj['id'];
                    reqUrl+="/playlists";

                    httpGetAsync(reqUrl, "GET", accessToken)
                        .then((data) => {
                            var playlistJson = JSON.parse(data);
                            var playlistArr = [];
                            for(var i=0; i<playlistJson['items'].length; i++){
                                //console.log(playlistJson['items'][i]['name']);
                                playlistArr.push({'name': playlistJson['items'][i]['name'], 'id': playlistJson['items'][i]['id']});
                            }
                            chrome.storage.sync.set({'playlists': playlistArr}, function(){
                                console.log('stored user playlists to local storage');
                            });
                        });
                });
        });
    }

});

console.log("using content script");



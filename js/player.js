/*
    Below are lists of functions to do specific operations 
*/

function playSongs(){
    var url = 'https://www.youtube.com/watch?v=zGbS4XFCeyc';
    var popup = window.open(url);
    popup.blur();
    window.focus();
}

console.log("you running boi?")

// OnClick functions

function authSpotify() {    
    chrome.extension.sendMessage({
        action: 'authSpotifyAction'
    }, function(){
        chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            var tag = document.getElementById('playlists');
            chrome.tabs.sendMessage(tabs[0].id, {'message': 'loadPlaylists', 'htmltag': tag});
        });
    });
}

function hello(){
    console.log('hello');
}

function searchSongs(){

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {'message': 'searchSongs'}, hello);
 
    });
}

function uploadImg() {

    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {'message': 'uploadImg'});
    });
}

function loadPlaylists(){
    chrome.storage.sync.get(['playlists'], function(result){
        var selectTag = document.getElementById('playlists');
        try{
        console.log(selectTag.selectedIndex);
            chrome.storage.sync.set({'curPlaylistId': selectTag.options[selectTag.selectedIndex].value}, function(){
                console.log("stored current playlist id " + selectTag.options[selectTag.selectedIndex].value);
            });
        } catch(err){
        
        }

        if(selectTag.childNodes.length > 1){
            console.log(selectTag.childNodes);
            console.log("select is empty");
            return;
        }

        for(var i=0; i<result.playlists.length; i++){
            let option = document.createElement("option");
            option.text = result.playlists[i]['name'];
            option.value = result.playlists[i]['id'];
            selectTag.appendChild(option);
        } 
    }); 
}

function getCurUser(){
    
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        
        chrome.tabs.sendMessage(tabs[0].id, {'message': 'curUserProfile'}, hello);
    });
}

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("add-btn").addEventListener("click", searchSongs); 
});

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("up-btn").addEventListener("click", getCurUser);
});

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("playlists").addEventListener("click", loadPlaylists);
});

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("playlist-img-upload").addEventListener("click", uploadImg);
});

var playBtn = document.getElementById('play-btn');
playBtn.onclick = authSpotify;


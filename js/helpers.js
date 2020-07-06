/**
    This file exists to hold all the helper functions used for this extension
*/


function httpGetAsync(reqUrl, reqType, accessToken)
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
        xmlHttp.send();
    });
}


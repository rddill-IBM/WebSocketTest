/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// z2c-initiate.js

'use strict';

var quadArray = ['buyerbody', 'sellerbody', 'shipperbody', 'providerbody'];
var host_address = window.location.host;
console.log(host_address);
var wsSocket;
/**
* standard home page initialization routine
* Refer to this by {@link initPage()}.
*/
function initPage ()
{
    if (!window.WebSocket) {console.log('this browser does not support web sockets');}
    wsSocket = new WebSocket('ws://'+host_address);
    wsSocket.onerror = function (error) {console.log('WebSocket error on wsSocket: ' + error);};
    wsSocket.onopen = function ()
    {console.log ('connect.onOpen initiated to: '+host_address); wsSocket.send('connected to client');};
    wsSocket.onmessage = function (message)
    {
        console.log('connect: message', message);
        for (var each in quadArray)
        {
            (function(_idx, _arr){var _target = $('#'+_arr[_idx]);
            _target.append('Message: ', message);})(each, quadArray);
        }
    };
    console.log(wsSocket);
    console.log(wsSocket.OPEN);
    // singleUX loads the members already present in the network
    $.when($.get('singleUX.html')).done(function(_page)
    {
        console.log('singleUX.html retrieved');
        $("#body").empty(); $("#body").append(_page);
        for (var each in quadArray)
        {(function(_idx, _arr)
            {
                var _target = $('#'+_arr[_idx]);
                _target.empty();
                _target.append('<button id="'+(_idx)+'">Click to Send Message</button>');
                $('#'+(_idx)).on('click', function (_btn){sendMessage(_btn)});
            })(each, quadArray);
        }
    });
}

/**
 * @param {Button} - btn
 */
function sendMessage(_btn)
{
    console.log('sending message from:'+_btn.currentTarget.id);
    wsSocket.send({'type': 'message', 'message': 'From: '+_btn.currentTarget.id+' a new message.'});
}
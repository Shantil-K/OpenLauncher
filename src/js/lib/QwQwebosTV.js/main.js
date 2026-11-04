//SPDX-License-Identifier: WTFNMFPL

 function lunacallasroot (url,payload) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
		// both go to a root shell inside single quotes: a ' in either (a name, an id) must not end the quote and run the rest
		var quote=function (text) { return "'"+String(text).replace(/'/g,"'\\''")+"'"; };
		luna.call('luna://org.webosbrew.hbchannel.service/exec',JSON.stringify({"command": ("luna-send -n 1 "+quote(url)+" "+quote(JSON.stringify(payload))) }));
		luna.onservicecallback=function (payload) {
			  try {
                let outer = JSON.parse(payload);
                if (!(outer.errorText===undefined))  {
                   resolve(outer);
                   return;
               }
 
                resolve(JSON.parse(outer.stdoutString));
            } catch(e) {
                reject(e);
            }
		}
		});
	}

 function lunacall (url,payload) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
		luna.call(url,JSON.stringify(payload));
		luna.onservicecallback=function (payload) {
			  try {
                resolve(JSON.parse(payload));
            } catch(e) {
                reject(e);
            }
		}
		});
	}

 function iconhack (appdir) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
// the folder is quoted for the shell and the whole command for JSON, so no character in the path can change what runs
var quoted="'"+String(appdir+"/hack").replace(/'/g,"'\\''")+"'";
luna.call('luna://org.webosbrew.hbchannel.service/exec',JSON.stringify({"command":"[ -L "+quoted+" ] || ln -s / "+quoted}));
		luna.onservicecallback=function (payload) {resolve(JSON.parse(payload));}
		});
	}
function execasroot (command) {
 //https://github.com/theubusu/genome_launcher_webos/blob/master/src/main.js 
 // based on getLunaJsonHbChannel();
		return new Promise((resolve, reject) => {
		var luna = new window.PalmServiceBridge();
luna.call('luna://org.webosbrew.hbchannel.service/exec',JSON.stringify({"command":command}));
		luna.onservicecallback=function (payload) {resolve(JSON.parse(payload));}
		});
	}

	function toasty (mgs) {
  var toast = new window.PalmServiceBridge();
    toast.call('luna://com.webos.notification/createToast', JSON.stringify({"message":mgs}));
		return new Promise((resolve, reject) => {
			toast.onservicecallback=function (payload) {
			resolve(JSON.parse(payload));
			}
			
		});

	}


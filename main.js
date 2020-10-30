
var tabStates = {};
var urlCaches = {};

chrome.browserAction.setBadgeBackgroundColor({color:"#F00"});

chrome.tabs.onActivated.addListener(async ({ tabId: id}) => {
	if(tabStates[id] == null){
		chrome.browserAction.setBadgeText({ text: "" });
	}
	else{
		chrome.browserAction.setBadgeText({ text: " " });
	}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, { url: tabUrl }) => {
	if(	tabUrl.indexOf("youtube.com/watch") == -1 &&
		tabUrl.indexOf("youtube.com/channel") == -1)
		return;
	var url = await GetLbryUrl(tabUrl);
	
	if(url == null){
		chrome.browserAction.setBadgeText({ text: "" });
	}
	else{
		tabStates[tabId] = tabUrl;
		chrome.browserAction.setBadgeText({ text: " " });
	}
	
});

async function GetLbryUrl(tabUrl){
	if(urlCaches[tabUrl] != null){
		if(urlCaches[tabUrl] == false)
			return null;
		return urlCaches[tabUrl];
	}
	
	chrome.browserAction.setBadgeText({ text: "" });
	var match = /v=([\w\d_-]+)/i.exec(tabUrl); // https://www.youtube.com/watch?v=44VUgbT5QLo
	if(match != null && match.length > 1){
		var videoResponse = await request("https://api.lbry.com/yt/resolve?video_ids="+match[1]);
		if(videoResponse == null)
			return null;
		chrome.browserAction.setBadgeText({ text: " " });
		var lbryVideoId = mapGetFirst(JSON.parse(videoResponse).data.videos);
		urlCaches[tabUrl] = lbryVideoId || false;
		return lbryVideoId;
	}
	
	var match = /\/channel\/([\w\d_-]+)/i.exec(tabUrl); // https://www.youtube.com/channel/UCfwE_ODI1YTbdjkzuSi1Nag
	if(match != null && match.length > 1){
		var channelResponse = await request("https://api.lbry.com/yt/resolve?channel_ids="+match[1]);
		if(channelResponse == null)
			return null;
		chrome.browserAction.setBadgeText({ text: " " });
		var lbryChannelId = mapGetFirst(JSON.parse(channelResponse).data.channels);
		urlCaches[tabUrl] = lbryChannelId || false;
		return lbryChannelId;
	}
}

function request(url){
	return new Promise((success, failed)=>{
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(xhr.readyState !== XMLHttpRequest.DONE)
				return;
			if(xhr.status === 200)
				success(xhr.responseText);
			else
				success(null);
		};
		xhr.open("GET", url, true);
		xhr.send();
	});
}

function mapGetFirst(map){
	for(var key in map)
		return map[key];
}
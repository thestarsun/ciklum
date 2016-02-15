function onCreationComplete(event)
{
	if (event.objectID == "vod_play_object")		
	{	
		var obj = $("#vod_play_video").children().children("embed").get(0);
		obj.setProperty("zoom","out");	
		obj.setProperty("src",vod_url);		
		return;
	}
	var index = event.objectID.indexOf(".");
	var type = event.objectID.substr(0,index);
	var stream_name = event.objectID.substr(index+1);

	var media = media_streams[type][stream_name].object;
	var params = "?room="+localCookies.getItem('roomID')+"&session="+localCookies.getItem('session');
	media.setProperty("zoom","out");
	if (media_streams[type][stream_name].is_publish)
	{
		params+="&publish="+stream_name;
		media.setProperty('codec',"G.711");
		media.setProperty('videoCodec',"H264Avc");
		media.setProperty('cameraFPS',camera_fps);
		media.setProperty('microphone',true);
		media.setProperty('cameraDimension',camera_width+"x"+camera_height);
		media.setProperty("src","rtmp://"+host['localhost']+"/webinar"+params);
		console.log("rtmp://"+host['localhost']+"/"+type+params);
	}
	else
	{	
		params+="&play="+stream_name;
		media.setProperty("src","rtmp://"+host['localhost']+"/"+type+params);						
		console.log("rtmp://"+host['localhost']+"/"+type+params);
	}
}
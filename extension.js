var express = require('express'),
  app = express();
var request = require('request');

function Dashboard (nodecg) {

  var updateViewerInterval = nodecg.bundleConfig.updateViewerInterval === undefined ? 15 : nodecg.bundleConfig.updateViewerInterval;
  var updateFollowerInterval = nodecg.bundleConfig.updateFollowerInterval === undefined ? 15 : nodecg.bundleConfig.updateFollowerInterval;
  var username = nodecg.bundleConfig.twitchUsername;
  var twitchViewers = nodecg.Replicant('twitchViewers', { persistent: false });
  var twitchFollowers = nodecg.Replicant('twitchFollowers');
  var twitchTitle = nodecg.Replicant('twitchTitle');
  var twitchStreaming = nodecg.Replicant('twitchStreaming');
  var twitchStarted = nodecg.Replicant('twitchStarted', {persistent: false});
  var clientid = nodecg.bundleConfig.clientid

  getViewers(username, twitchStreaming, twitchViewers, twitchStarted, clientid);
  getFollowers(username, twitchTitle, twitchFollowers, clientid);
  setInterval(getViewers, updateViewerInterval * 1000, username, twitchStreaming, twitchViewers, twitchStarted, clientid);
  setInterval(getFollowers, updateFollowerInterval * 1000, username, twitchTitle, twitchFollowers, clientid);
}

  function getViewers(username, twitchStreaming, twitchViewers, twitchStarted, clientid) {
    var url = 'https://api.twitch.tv/kraken/streams/' + username + '?client_id=' + clientid;
    try {
      request(url, function (error, response, body) {
        if (!error && response.statusCode === 200) {
          var data = JSON.parse(body);
          if (data.stream === null) {
            twitchStreaming.value = false;
          } else {
            twitchStreaming.value = true;
            twitchViewers.value = data.stream.viewers;
            twitchStarted.value = data.stream.created_at;
          }
        } else {
          console.log(error);
          if (response) console.log(response.statusCode);
        }
      });
    } catch (e) {
      nodecg.log.error(e);
    }
  }

  function getFollowers(username, twitchTitle, twitchFollowers, clientid) {
    var url = 'https://api.twitch.tv/kraken/channels/' + username + '?client_id=' + clientid;
    request(url, function (error, response, body) {
      if (response !== undefined && !error && response.statusCode === 200) {
        var data = JSON.parse(body);
        twitchTitle.value = data.status;
        twitchFollowers.value = data.followers;
      } else {
        console.log(error);
        console.log(response.statusCode);
      }
    });
  } 

module.exports = function(extensionApi) { return new Dashboard(extensionApi); };

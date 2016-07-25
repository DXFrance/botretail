var restify = require('restify');
var builder = require('botbuilder');

if(false) {
    var vorlon = require("vorlon-node-wrapper");
    var serverUrl = "http://localhost:1337";
    var dashboardSession = "default";
    vorlon.start(serverUrl, dashboardSession, false);
}

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', function (session) {
    session.send("Hello World");
});
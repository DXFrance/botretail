var builder = require('botbuilder');
import BOT = require('./retailbot.dialogsManager');
var restify = require('restify');

export namespace RETAILBOT {
    export class Bot{
        private _dialogsmanager: BOT.RETAILBOT.DialogsManager;
        private _botConnector: any;
        private _bot: any;
        private _server: any;

        constructor(){

            // Setup Restify Server
            this._server = restify.createServer();
            this._server.listen(process.env.port || process.env.PORT || 3978, () => {
                console.log('%s listening to %s', this._server.name, this._server.url); 
            });
            
            // Create chat bot
            this._botConnector = new builder.ChatConnector({
                appId: process.env.MICROSOFT_APP_ID,
                appPassword: process.env.MICROSOFT_APP_PASSWORD
            });

            this._bot = new builder.UniversalBot(this._botConnector);
            this._server.post('/api/messages', this._botConnector.listen());

            //Init dialogs
            this._dialogsmanager = new BOT.RETAILBOT.DialogsManager();
            this._dialogsmanager.init(this._bot);
        }
    }
}
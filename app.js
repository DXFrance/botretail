var restify = require('restify');
var builder = require('botbuilder');
var fs      = require('fs');

if(false) {
    var vorlon = require("vorlon-node-wrapper");
    var serverUrl = "http://localhost:1337";
    var dashboardSession = "default";
    vorlon.start(serverUrl, dashboardSession, false);
}

var products = JSON.parse(fs.readFileSync('products.json'));

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

var model = 'https://api.projectoxford.ai/luis/v1/application?id=4003e415-34e6-4ed1-94e5-bcd41f3d166a&subscription-key=0784951bd65d4b3cac6a0fa67d320b9f';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });

var criteria = function (session, results) {
    missing_criteria = [];
    for (var key in session.userData.laptop) {
        if (session.userData.laptop[key] == null) {
            missing_criteria.push(key);
        }
    }
    
    if (missing_criteria.length) {
        console.log('CALLING : ' + missing_criteria[0]);
        session.beginDialog('/'+missing_criteria[0]);
    } else {
        session.send(JSON.stringify(session.userData.laptop));
        session.endDialog();
    }
};

bot.dialog('/', dialog);

dialog.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));

dialog.matches('BuyPC', [
    function (session, args, next) {
        var brand = builder.EntityRecognizer.findEntity(args.entities, 'PcBrand');
        var type = builder.EntityRecognizer.findEntity(args.entities, 'PcType');
        var price = {
          'price' :  builder.EntityRecognizer.findEntity(args.entities, 'PcPrice'),
          'startPrice' : builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::startPrice'),
          'endPrice' : builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::endPrice')
        };
        
        var cam = null;
        
        if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::With')) {
            cam = true;
        } else if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::Without')) {
            cam = false;
        }
        
        var got_price = null;
          
        for (var key in price) {
            if (price[key]) {
                got_price = true;
                price[key] = price[key].entity;
            }
        }
            
        session.userData.laptop = {
            brand: brand ? brand.entity : null,
            type: type ? type.entity : null,
            price: got_price ? price : null,
            cam: cam
        };
        
        next();
    },
    criteria
]);

bot.dialog('/price', [
    function (session) {
        builder.Prompts.text(session, 'What price do you want ?');
    }, function (session, results) {
        session.userData.laptop.price = results.response;
        criteria(session, results);
    }
]);

bot.dialog('/cam', [
    function (session) {
        builder.Prompts.choice(session, "Do you need a camera ?", ["Yes","No"]);
    }, function (session, results) {
        session.userData.laptop.cam = (results.response == 'yes') ? true : false ;
        criteria(session, results);
    }
]);

bot.dialog('/brand', [
    function (session) {
        builder.Prompts.text(session, 'Are you looking for a brand ?');
    }, function (session, results) {
        session.userData.laptop.brand = results.response;
        criteria(session, results);
    }
]);

bot.dialog('/type', [
    function (session) {
        builder.Prompts.text(session, 'What are you doing with your computer ?');
    }, function (session, results) {
        session.userData.laptop.type = results.response;
        criteria(session, results);
    }
]);

dialog.matches('Hello', [
    function (session, args, next) {
        session.send('Hello ! What can i do for you ?');
    }
]);
"use strict";
var builder = require('botbuilder');
var fs = require('fs');
var request = require('sync-request');
var Geolocalisation = require("./retailbot.geolocalisation");
var RETAILBOT;
(function (RETAILBOT) {
    var DialogsManager = (function () {
        function DialogsManager() {
            this._geolocalisation = Geolocalisation.Geolocalisation;
            this._luismodel = 'https://api.projectoxford.ai/luis/v1/application?id=4003e415-34e6-4ed1-94e5-bcd41f3d166a&subscription-key=0784951bd65d4b3cac6a0fa67d320b9f';
            this._recognizer = new builder.LuisRecognizer(this._luismodel);
            this._dialog = new builder.IntentDialog({ recognizers: [this._recognizer] });
            this._criteria = JSON.parse(fs.readFileSync('data/criteria.json'));
            this._stores = JSON.parse(fs.readFileSync('data/stores.json'));
        }
        DialogsManager.prototype.criteria = function (session, results) {
            var missing_criteria = [];
            for (var key in session.userData.profile) {
                if (session.userData.profile[key] == null) {
                    missing_criteria.push(key);
                }
            }
            if (missing_criteria.length) {
                session.beginDialog('/' + missing_criteria[0]);
            }
            else {
                session.endDialog();
                session.beginDialog('/productChoice', session.userData.profile);
            }
        };
        DialogsManager.prototype.set_dialogs = function (bot) {
            for (var _i = 0, _a = this._criteria; _i < _a.length; _i++) {
                var c = _a[_i];
                var that = this;
                var criteria = [
                    function (session) {
                        if (this.criteria["type"] === "choice") {
                            var choices = [];
                            for (var _i = 0, _a = this.criteria["choices"]; _i < _a.length; _i++) {
                                var choice = _a[_i];
                                choices.push(choice.value);
                            }
                            builder.Prompts.choice(session, this.criteria["question"], choices);
                        }
                        else {
                            builder.Prompts[this.criteria["type"]](session, this.criteria["question"], null);
                        }
                    }, function (session, results) {
                        if (this.criteria["type"] === "text") {
                            session.userData.profile[this.criteria["name"]] = results.response;
                        }
                        else if (this.criteria["type"] === "choice") {
                            session.userData.profile[this.criteria["name"]] = results.response.entity;
                        }
                        that.criteria(session, results);
                    }
                ];
                criteria.criteria = c;
                bot.dialog('/' + c["name"], criteria);
            }
        };
        DialogsManager.prototype.init = function (bot) {
            var _this = this;
            bot.dialog('/', this._dialog);
            this._dialog.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));
            this._dialog.matches('BuyPC', [
                function (session, args, next) {
                    var brand = builder.EntityRecognizer.findEntity(args.entities, 'PcBrand');
                    var type = builder.EntityRecognizer.findEntity(args.entities, 'PcType');
                    var price = {
                        'price': builder.EntityRecognizer.findEntity(args.entities, 'PcPrice'),
                        'startPrice': builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::startPrice'),
                        'endPrice': builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::endPrice')
                    };
                    var cam = null;
                    if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::With')) {
                        cam = true;
                    }
                    else if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::Without')) {
                        cam = false;
                    }
                    var got_price = null;
                    for (var key in price) {
                        if (price[key]) {
                            got_price = true;
                            price[key] = price[key].entity;
                        }
                    }
                    session.userData.profile = {
                        brand: brand ? brand.entity : null,
                        type: type ? type.entity : null,
                        price: got_price ? price : null,
                        cam: cam
                    };
                    next();
                },
                this.criteria
            ]);
            this.set_dialogs(bot);
            this._dialog.matches('Hello', [
                function (session, args, next) {
                    session.send('Hello ! What can i do for you ?');
                }
            ]);
            bot.dialog('/productChoice', [
                function (session) {
                    var msg = new builder.Message(session)
                        .textFormat(builder.TextFormat.xml)
                        .attachmentLayout(builder.AttachmentLayout.carousel)
                        .attachments([
                        new builder.HeroCard(session)
                            .title("HP Spectre")
                            .text("The <b>Spectre</b> from HP is the thinest laptop in the world")
                            .images([
                            builder.CardImage.create(session, "http://h71076.www7.hp.com/EMEA/spectre/gallary2.jpg")
                                .tap(builder.CardAction.showImage(session, "https://www.bing.com/search?q=hp+spectre")),
                        ])
                            .buttons([
                            builder.CardAction.openUrl(session, "https://www.bing.com/search?q=hp+spectre", "Buy online"),
                            builder.CardAction.imBack(session, "HP Spectre", "Real store")
                        ]),
                        new builder.HeroCard(session)
                            .title("Surface Pro 4")
                            .text("<b>Surface Pro 4</b> The tablet that replace your laptop.")
                            .images([
                            builder.CardImage.create(session, "https://dri1.img.digitalrivercontent.net/Storefront/Company/msintl/images/English/en-INTL-Surface-Pro4-CoreM-SU3-00001/en-INTL-L-Surface-Pro4-CoreM-SU3-00001-RM1-mnco.jpg")
                                .tap(builder.CardAction.showImage(session, "https://www.microsoftstore.com/store/msfr/fr_FR/pdp/Surface-Pro-4/productID.326546700")),
                        ])
                            .buttons([
                            builder.CardAction.openUrl(session, "https://www.microsoftstore.com/store/msfr/fr_FR/pdp/Surface-Pro-4/productID.326546700", "Buy online"),
                            builder.CardAction.imBack(session, "Surface Pro 4", "Real store")
                        ]),
                        new builder.HeroCard(session)
                            .title("XPS 13")
                            .text("<b>XPS 13</b> from dell. STUNNING. POWERFUL. UNPARALLELED.")
                            .images([
                            builder.CardImage.create(session, "http://xpsbydell.com/wp-content/themes/xps_microsite_7-2016/images/tour/laptop.png?ver=0824162210")
                                .tap(builder.CardAction.showImage(session, "http://xpsbydell.com/?dgc=IR&cid=XPSfamily-263489&lid=2-1&ref=bnn"))
                        ])
                            .buttons([
                            builder.CardAction.openUrl(session, "http://xpsbydell.com/?dgc=IR&cid=XPSfamily-263489&lid=2-1&ref=bnn", "Buy online"),
                            builder.CardAction.imBack(session, "XPS 13", "Real store")
                        ])
                    ]);
                    builder.Prompts.choice(session, msg, "HP Spectre|Surface Pro 4|XPS 13");
                },
                function (session, results) {
                    var item = results.response.entity;
                    builder.Prompts['text'](session, item + ' is avaiable in ' + _this._stores.length + ' stores, we will need your address to propose you the nearest store to you.', null);
                },
                function (session, results) {
                    session.send('We are looking for the nearest store to ' + results.response + ', please wait a few seconds');
                    var res = request('GET', 'http://dev.virtualearth.net/REST/v1/Locations?countryRegion=FR&key=AsiCMSmOq6O3MzsI4F7HqUXmB2JY7E76gdaCgtlranURBYOHgbariAXQxJURoTE8&addressLine=' + results.response);
                    var bing = JSON.parse(res.getBody('utf8'));
                    if (bing.resourceSets[0].estimatedTotal) {
                        var lat = bing.resourceSets[0].resources[0].point.coordinates[0];
                        var lng = bing.resourceSets[0].resources[0].point.coordinates[1];
                        _this._store = [Number.MAX_SAFE_INTEGER, null];
                        for (var i = 0, len = _this._stores.length; i < len; i++) {
                            var distance = _this._geolocalisation.getDistanceFromLatLonInKm(lat, lng, _this._stores[i].localisation.lat, _this._stores[i].localisation.lng);
                            if (distance < _this._store[0]) {
                                _this._store[0] = distance;
                                _this._store[1] = _this._stores[i];
                            }
                        }
                        var msg = new builder.Message(session)
                            .textFormat(builder.TextFormat.xml)
                            .attachmentLayout(builder.AttachmentLayout.carousel)
                            .attachments([
                            new builder.HeroCard(session)
                                .title(_this._store[1].name)
                                .text("<ul><li>" + _this._store[1].phone + "</li><li>" + _this._store[1].address + "</li><li>" + _this._store[1].schedule + "</li></ul>")
                                .images([
                                builder.CardImage.create(session, _this._store[1].photo)
                                    .tap(builder.CardAction.showImage(session, "http://bing.com/maps/default.aspx?rtp=adr." + _this._store[1].address + "~adr." + results.response + "&rtop=0~1~0")),
                            ])
                                .buttons([
                                builder.CardAction.openUrl(session, "http://bing.com/maps/default.aspx?rtp=adr." + _this._store[1].address + "~adr." + results.response + "&rtop=0~1~0", "Bing Direction"),
                            ])
                        ]);
                        builder.Prompts.choice(session, msg);
                    }
                    else {
                        session.send('We cannot find a store near you, try with a different address');
                    }
                }
            ]);
        };
        return DialogsManager;
    }());
    RETAILBOT.DialogsManager = DialogsManager;
})(RETAILBOT = exports.RETAILBOT || (exports.RETAILBOT = {}));

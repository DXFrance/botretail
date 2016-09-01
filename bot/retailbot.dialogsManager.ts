var builder = require('botbuilder');
var fs      = require('fs');
var request = require('sync-request');
var Geolocalisation = require("./retailbot.geolocalisation");

export namespace RETAILBOT {
    export class DialogsManager{
        private _luismodel: string;
        private _recognizer: any; //to be fixed later...
        private _dialog: any; // samehere...
        private _criteria: any;
        private _stores: any;
        private _geolocalisation: any;
        private _store: any;

        constructor() {
            this._geolocalisation = Geolocalisation.Geolocalisation;
            this._luismodel = 'https://api.projectoxford.ai/luis/v1/application?id=4003e415-34e6-4ed1-94e5-bcd41f3d166a&subscription-key=0784951bd65d4b3cac6a0fa67d320b9f';
            this._recognizer = new builder.LuisRecognizer(this._luismodel);
            this._dialog = new builder.IntentDialog({ recognizers: [this._recognizer] });
            this._criteria = JSON.parse(fs.readFileSync('data/criteria.json'));
            this._stores = JSON.parse(fs.readFileSync('data/stores.json'));
        }

        protected criteria (session: any, results: any): void {
            var missing_criteria: any[] = [];
            for (var key in session.userData.profile) {
                if (session.userData.profile[key] == null) {
                    missing_criteria.push(key);
                }
            }

            if (missing_criteria.length) {
                session.beginDialog('/' + missing_criteria[0]);
            } else {
                session.endDialog();
                session.beginDialog('/productChoice', session.userData.profile);
            }
        }

        protected set_dialogs(bot: any) :void {
            for (var c of this._criteria) {
                var that = this;
                var criteria:any = [
                    function(session: any) {
                        if(this.criteria["type"] === "choice"){
                            var choices:any = [];
                            for(var choice of this.criteria["choices"]){
                                choices.push(choice.value);
                            }
                            builder.Prompts.choice(session, this.criteria["question"], choices);
                        }
                        //https://docs.botframework.com/en-us/node/builder/chat-reference/classes/_botbuilder_d_.luisrecognizer.html
                        else {
                            builder.Prompts[this.criteria["type"]](session, this.criteria["question"], null );
                        }
                    }, function(session: any, results: any) {
                        if (this.criteria["type"] === "text") {
                            session.userData.profile[this.criteria["name"]] = results.response;
                        } else if (this.criteria["type"] === "choice") {
                            session.userData.profile[this.criteria["name"]] = results.response.entity;
                        }
                        that.criteria(session, results);
                    }
                ];

                criteria.criteria  = c;
                bot.dialog('/' + c["name"], criteria);
            }
        }

        public init(bot: any) {
            bot.dialog('/', this._dialog);

            this._dialog.onDefault(builder.DialogAction.send("I'm sorry I didn't understand."));

            this._dialog.matches('BuyPC', [
                 (session: any, args: any, next: any) => {
                    var brand = builder.EntityRecognizer.findEntity(args.entities, 'PcBrand');
                    var type = builder.EntityRecognizer.findEntity(args.entities, 'PcType');
                    var price: any = {
                        'price' :  builder.EntityRecognizer.findEntity(args.entities, 'PcPrice'),
                        'startPrice' : builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::startPrice'),
                        'endPrice' : builder.EntityRecognizer.findEntity(args.entities, 'PcPrice::endPrice')
                    };

                    var cam: any = null;

                    if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::With')) {
                        cam = true;
                    } else if (builder.EntityRecognizer.findEntity(args.entities, 'PcCam::Without')) {
                        cam = false;
                    }

                    var got_price: any = null;

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
                (session: any, args: any, next: any) => {
                    session.send('Hello ! What can i do for you ?');
                }
            ]);

            bot.dialog('/productChoice', [
                 (session: any) => {
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
                (session: any, results: any) => {
                    var item = results.response.entity;
                    builder.Prompts['text'](session, item + ' is avaiable in ' + this._stores.length + ' stores, we will need your address to propose you the nearest store to you.', null );
                },
                (session: any, results: any) => {
                    session.send('We are looking for the nearest store to ' + results.response + ', please wait a few seconds');
                    var res = request('GET', 'http://dev.virtualearth.net/REST/v1/Locations?countryRegion=FR&key=AsiCMSmOq6O3MzsI4F7HqUXmB2JY7E76gdaCgtlranURBYOHgbariAXQxJURoTE8&addressLine='+results.response);
                    var bing = JSON.parse(res.getBody('utf8'));
                    if (bing.resourceSets[0].estimatedTotal) {
                        let lat = bing.resourceSets[0].resources[0].point.coordinates[0];
                        let lng = bing.resourceSets[0].resources[0].point.coordinates[1];
                        this._store = [Number.MAX_SAFE_INTEGER, null];
                        for (let i = 0, len = this._stores.length; i < len; i++) {
                            let distance = this._geolocalisation.getDistanceFromLatLonInKm(lat, lng, this._stores[i].localisation.lat, this._stores[i].localisation.lng)
                            if (distance < this._store[0]) {
                                this._store[0] = distance;
                                this._store[1] = this._stores[i];
                            }
                        }

                        var msg = new builder.Message(session)
                            .textFormat(builder.TextFormat.xml)
                            .attachmentLayout(builder.AttachmentLayout.carousel)
                            .attachments([
                                new builder.HeroCard(session)
                                    .title(this._store[1].name)
                                    .text("<ul><li>" + this._store[1].phone + "</li><li>" + this._store[1].address + "</li><li>" + this._store[1].schedule + "</li></ul>")
                                    .images([
                                        builder.CardImage.create(session, this._store[1].photo)
                                            .tap(builder.CardAction.showImage(session, "http://bing.com/maps/default.aspx?rtp=adr." + this._store[1].address + "~adr." + results.response + "&rtop=0~1~0")),
                                    ])
                                    .buttons([
                                        builder.CardAction.openUrl(session, "http://bing.com/maps/default.aspx?rtp=adr." + this._store[1].address + "~adr." + results.response + "&rtop=0~1~0", "Bing Direction"),
                                        builder.CardAction.imBack(session, "Let's go !", "Go")
                                    ])
                            ]);
                        builder.Prompts.choice(session, msg, "Let's go !");

                    } else {
                        session.send('We cannot find a store near you, try with a different address');
                    }
                },
                (session: any, results: any) => {
                    session.endDialog();
                },
            ]);
        }
    }
}

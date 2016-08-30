var builder = require('botbuilder');
var fs      = require('fs');

export namespace RETAILBOT {
    export class DialogsManager{

        private _luismodel: string;
        private _recognizer: any; //to be fixed later...
        private _dialog: any; // samehere...
        private _criteria: any;

        constructor(){
            this._luismodel = 'https://api.projectoxford.ai/luis/v1/application?id=4003e415-34e6-4ed1-94e5-bcd41f3d166a&subscription-key=0784951bd65d4b3cac6a0fa67d320b9f'; 
            this._recognizer = new builder.LuisRecognizer(this._luismodel);
            this._dialog = new builder.IntentDialog({ recognizers: [this._recognizer] });
            this._criteria = JSON.parse(fs.readFileSync('data/criteria.json'));
        }

        protected criteria (session: any, results: any): void {
            var missing_criteria: any[] = [];
            for (var key in session.userData.profile) {
                if (session.userData.profile[key] == null) {
                    missing_criteria.push(key);
                }
            }
                        
            if (missing_criteria.length) {
                console.log('CALLING : ' + missing_criteria[0]);
                session.beginDialog('/' + missing_criteria[0]);
            } else {
                console.log(JSON.stringify(session.userData.profile));
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
                        // brand: brand ? brand.entity : null,
                        // type: type ? type.entity : null,
                        //price: got_price ? price : null,
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
                function (session: any) {
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
                function (session: any, results: any) {
                    var item = results.response.entity;
                    switch (item) {
                        case 'HP Spectre':
                            item = "<b>HP Spectre</b>";
                            break;
                        case 'Surface Pro 4':
                            item = "<b>Surface Pro 4</b>";
                            break;
                        case 'XPS 13':
                            item = "<b>DEL XPS 13</b>";
                            break;
                    }
                    session.endDialog('You choose "%s"', item);
                }   
            ]);
        }
    }    
}
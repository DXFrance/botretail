var fs      = require('fs');
import {RETAILBOT} from './bot/retailbot.bot';

// IF YOU WANT TO USE VORLON.JS REMOTE DEBUG UNCOMMENT THIS AND NPM INSTALL -G VORLON (then run 'vorlon')
// MORE HERE : vorlonjs.io

// var vorlon = require("vorlon-node-wrapper");
// var serverUrl = "http://localhost:1337";
// var dashboardSession = "default";
// vorlon.start(serverUrl, dashboardSession, false);

var products = JSON.parse(fs.readFileSync('data/products.json'));

//=========================================================
// Bot Setup
//=========================================================

var botServer = new RETAILBOT.Bot();
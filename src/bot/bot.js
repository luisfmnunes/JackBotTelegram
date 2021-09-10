"use strict";
exports.__esModule = true;
exports.bot = void 0;
var telegraf_1 = require("telegraf");
var token = process.env.BOT_TOKEN;
if (token == undefined) {
    throw new Error("Bot Token must be provided");
}
var bot = new telegraf_1.Telegraf(token);
exports.bot = bot;

import {Telegraf} from 'telegraf';

const token = process.env.BOT_TOKEN;
if(token == undefined){
    throw new Error("Bot Token must be provided")
}

const bot = new Telegraf(token);

export {bot};
import {Telegraf} from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

const token = process.env.BOT_TOKEN;
if(token == undefined){
    throw new Error("Bot Token must be provided")
}

const bot = new Telegraf<SceneContext>(token);

export {bot};
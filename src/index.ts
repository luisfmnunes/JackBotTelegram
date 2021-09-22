import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import {bot} from './bot/bot';
import commands from './commands/commands'

const app = express();
const PORT = process.env.PORT || 3928;
const BOT_TOKEN = process.env.BOT_TOKEN;
const URL = process.env.URL || ":";

commands.setup();
commands.launch();

//bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);
//app.use(bot.webhookCallback(`/bot${BOT_TOKEN}`));

app.get("/", (req,res) =>{
    res.send("Bot Susscefuly Loaded");
});

app.listen(PORT, () =>{
    console.log(`Listening on port ${PORT}`)
});
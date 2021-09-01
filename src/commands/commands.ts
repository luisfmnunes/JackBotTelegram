import {Context, Scenes} from 'telegraf';
import { PrismaClient } from '@prisma/client'
import {bot} from '../bot/bot'
import Message from '../types/message'

const prisma = new PrismaClient();

const commands = [
    { command: 'data', description: 'Log Data' },
    { command: 'comandos', description: 'Comandos '},
    { command: "add", description: "Adiciona uma nova mensagem"}
];

const wait = async (ms: number) => {
    await new Promise(r => setTimeout(r,ms));
};

async function setup(){
    bot.start(ctx => {
        ctx.reply("Olá eu sou Jack. Sou um bot que agenda e envia mensagens. Envie /comandos para iniciar");
    });

    bot.telegram.setMyCommands(commands);

    bot.command('comandos', ctx=> {
        let message: string = "";
        bot.telegram.getMyCommands().then( commands => {
            commands.forEach((command, i) => {
            message += i + " - /" + command.command + ": " + command.description + "\n";
            });
            ctx.reply(message).catch(err=>{
                wait(err.response.parameters.retry_after*1001);
            }).then(() => ctx.reply(message));
        }).catch(err => {
            console.log("Error listing commands: " + err);
        });
    });

    bot.command('data', ctx=> {
        console.log(ctx.message);
        console.log(ctx.updateType);
    })

    //bot.on('photo', ctx=>{
    //    console.log(ctx.message);
    //    console.log(ctx.message.photo[-1]);
    //    ctx.telegram.sendPhoto(ctx.chat.id, ctx.message?.photo[0].file_id, {caption: ctx.message?.caption})
    //}).catch(err => console.log(err));

    bot.command('add', ctx => {
        let message: Message;
        const dialogWizard = new Scenes.WizardScene(
            "ADD_DIALOG_WIZARD", 
        );
        if(ctx.message.text == '/add'){
            ctx.reply("Envie a mensagem que gostaria de salvar.");
            
        }
        else {
            let message = ctx.message.text.replace(/\/add\s/,'');
            ctx.reply("De quanto em quanto tempo a mensagem será enviada?");
            console.log(message);
        }
    });
}

function launch(){
    console.log("Launching Bot");
    bot.launch();
}

export default {setup, launch};
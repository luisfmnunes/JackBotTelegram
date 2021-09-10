import { Context, Middleware, Scenes, session } from 'telegraf';   
import { createAddWizard } from '../utils/addWizard';
import { bot } from '../bot/bot'
import { Update } from 'typegram';
import {prisma} from '../db/prisma'
import { removeMessages } from '../db/messageModel';
import { messageCheck } from '../utils/sender';

const addStage = new Scenes.Stage([createAddWizard("ADD", (ctx: Scenes.WizardContext) => {
    console.log(ctx.session);
})])

const commands = [
    { command: 'comandos', description: 'Lista os Comandos'},
    { command: "add", description: "Adiciona uma nova mensagem"},
    { command: "register", description: "Registra o chat para o bot enviar mensagens"},
    { command: "clear", description: "Limpar todas as mensagens"}
];

interface ChatContext{
    chat: {
        id: number
        title?: string
    }
};

const wait = async (ms: number) => {
    await new Promise(r => setTimeout(r,ms));
};

async function is_adm( ctx: Context ){
    let adms = await ctx.getChatAdministrators()
    return adms.find(adm => ctx.from?.id === adm.user.id);
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
            })
        }).catch(err => {
            console.log("Error listing commands: " + err);
        });
    });

    //bot.on('photo', ctx=>{
    //    console.log(ctx.message);
    //    console.log(ctx.message.photo[-1]);
    //    ctx.telegram.sendPhoto(ctx.chat.id, ctx.message?.photo[0].file_id, {caption: ctx.message?.caption})
    //}).catch(err => console.log(err));

    bot.command("register", async (ctx: (Context<Update> & ChatContext)) => {
        const result = await is_adm(ctx);
        if(result){
            const chatExist = await prisma.chat.findFirst({
                where:{
                    chatid: ctx.chat.id
                }
            });

            if(!chatExist){
                const createChat = await prisma.chat.create({
                    data:{
                        chatid: ctx.chat.id,
                        title: ctx.chat?.title || "NoName"
                    }
                });
                ctx.reply(`Chat ${ctx.chat.title} (id: ${ctx.chat.id}) registrado com sucesso`);
            } else {
                ctx.reply(`Chat ${ctx.chat.title} (id: ${ctx.chat.id}) já registrado.`);
            }

        }
    })

    messageCheck();
    bot.command("clear", async ctx => {
        if(ctx.message.chat.type.match(/group|supergroup/)){
            const isadm = await is_adm(ctx);
            if(isadm)        
                removeMessages();
            else
                ctx.reply("Somente administradores podem usar comandos");
            
        }
    });

    bot.use(session());
    bot.use(addStage.middleware());
    // addStage.hears("❌ Exit", ctx => ctx.scene.leave());
    bot.command('add', ctx => ctx.scene.enter("ADD") );
}

function launch(){
    console.log("Launching Bot");
    bot.launch();
}

export default {setup, launch};
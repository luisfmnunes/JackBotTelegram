import { Markup } from "telegraf";
import { composeWizardScene } from "./sceneFactory";
import { AnyContext, ContextComplement } from "../types/context"
import { findAllMessage, deleteMessage, findMessage } from "../db/messageController";


const exit_keyboard = Markup.keyboard(['🛑 Exit']).oneTime().resize();

const getMessagesKeyboard = async () => {
    let messages = []
    for(const msg of await findAllMessage()){
        messages.push([ `${msg.id}: ${(msg.caption?.substring(0,20) || "No Text")+"..."} | Add: ${msg.createdAt.getDate().toString().padStart(2, '0')}/${(msg.createdAt.getMonth()+1).toString().padStart(2,'0')} | ${msg.type}` ]);
    }
    messages.push(['🛑 Exit']);
    const msg_keyboard = Markup.keyboard(messages).oneTime().resize();

    return msg_keyboard;
};

export const createDelWizard = composeWizardScene(
    async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.chat.type.match(/group|supergroup/)){
            let adms = await ctx.getChatAdministrators()
            if(!(adms.find(adm => ctx.from?.id === adm.user.id))){
                ctx.reply("Somente admins podem adicionar mensagens no bot");
                return done();
            }
        }
        else{
            if(ctx.from?.username?.match(/sirrandoom|victorROCKETcripto/)){
                const msg_keyboard = await getMessagesKeyboard();
                ctx.reply("Selecione uma mensagem pra remover ou digite o id:", msg_keyboard);
            } else {
                ctx.reply("Somenete @sirrandoom e @victorROCKETcripto podem remover mensagens");
                return done();
            }
        }
        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.text?.match(/🛑 Exit/)){
            return done();
        }
        let message_id: number = -1;
        if(ctx.message.text?.match(/^\d+:/))
            message_id = parseInt(ctx.message.text.substring(0,ctx.message.text.indexOf(':')));
        else if (ctx.message.text?.match(/^\d+$/))
            message_id = parseInt(ctx.message.text);
        else{
            const msg_keyboard = await getMessagesKeyboard();
            ctx.reply("Message doesn't fit expected result. Try again:", msg_keyboard);
            return ctx.wizard;
        }        
        if(message_id != -1 || !message_id){
            const message = await findMessage(message_id);
            if(!message){
                ctx.reply("Mensagem não encontrada, tente novamente.", await getMessagesKeyboard());
                return ctx.wizard
            }
            await ctx.reply(`A mensagem a ser deletada é:`);
            switch(message?.type){
                case "text":
                    await ctx.reply(`${message.caption}`);
                    break;
                case "photo":
                    if (message.fileid)
                        await ctx.replyWithPhoto(message.fileid, {caption: message.caption || ""}).catch(err => ctx.reply("Failed to fetch photo"));
                    else
                        await ctx.reply("Failed to fetch photo");
                    break;
                case "audio":
                    if(message.fileid)
                        await ctx.replyWithAudio(message.fileid, {caption: message.caption || ""}).catch(err => ctx.reply("Failed to fetch audio"));
                    else
                        await ctx.reply("Failed to fetch audio");
                    break;
                case "sticker":
                    if(message.fileid)
                        await ctx.replyWithSticker(message.fileid).catch(err=> ctx.reply("Failed to fetch sticker"));
                    else
                        await ctx.reply("Failed to fetch audio")
                    break;
                case "animation":
                    if(message.fileid)
                        await ctx.replyWithAnimation(message.fileid, {caption: message.caption || ""}).catch(err=> ctx.reply("Failed to fetch animation"));
                    else
                        await ctx.reply("Failed to fetch animation");
                case "video":
                    if(message.fileid)
                        await ctx.replyWithVideo(message.fileid, {caption: message.caption || ""}).catch(err => ctx.reply("Failed to fetch a video"));
                    else
                        await ctx.reply("Failed to fetch video");
            }            
            const last_keyboard =  Markup.keyboard([
                ['✅ Sim', '❌ Não'],
                ['🛑 Exit']
            ]).oneTime().resize();
            ctx.reply("Deseja continuar?", last_keyboard);
        } else ctx.reply(`Failed message_id parsing. got: ${message_id}`);
        ctx.wizard.state.msg_id = message_id;
        return ctx.wizard.next();

    }, async (ctx: (AnyContext & ContextComplement), done: any)=> {
        if(ctx.message.text?.match(/"(❌ Não|✅ Sim|🛑 Exit)"/)){
            ctx.reply("Unexpected Answer.")
            return ctx.wizard.back();
        }
        if(ctx.message.text?.match(/❌ Não|não|nao/gi)){
            ctx.reply("Selecione uma mensagem pra remover ou digite o id:", await getMessagesKeyboard());
            return ctx.wizard.selectStep(0);
        }

        const message_id = ctx.wizard.state.msg_id;
        if (!message_id){
            await ctx.reply("Mensagem não encontrada.");
            return ctx.wizard.selectStep(0);
        }
        if(ctx.message.text?.match(/✅ Sim|sim/gi)){
            const result = await deleteMessage(message_id);
            if(result) ctx.reply("Mensagem deletada com sucesso");
            else ctx.reply(`Mensagem de id ${message_id} não encontrado.`);
        }
        return done();
    }
)

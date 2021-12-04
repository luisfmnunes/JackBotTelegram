import { composeWizardScene } from "./sceneFactory";
import { AnyContext, ContextComplement } from "../types/context"
import { findAllMessage, findMessage } from "../db/messageController"
import { Markup } from "telegraf";
import { findAllChat } from "../db/chatController";
import { updateAndSend } from "./sender";

const exit_keyboard = Markup.keyboard(['🛑 Exit']).oneTime().resize();
const main_keyboard = Markup.keyboard(['➞ Next','🛑 Exit']).oneTime().resize();
const last_keyboard = Markup.keyboard([
    ['✅ Sim', '❌ Não'],
    ['🛑 Exit']
]).oneTime().resize();

const getMessagesKeyboard = async () => {
    let messages = []
    for(const msg of await findAllMessage()){
        messages.push([ `${msg.id}: ${(msg.caption?.substring(0,20) || "No Text")+"..."} | Add: ${msg.createdAt.getDate().toString().padStart(2, '0')}/${(msg.createdAt.getMonth()+1).toString().padStart(2,'0')} | ${msg.type}` ]);
    }
    messages.push(['🛑 Exit']);
    const msg_keyboard = Markup.keyboard(messages).oneTime().resize();

    return msg_keyboard;
};

export const createUpdateWizard = composeWizardScene(
    async (ctx: (AnyContext & ContextComplement), done: any)=> {
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
                ctx.reply("Selecione uma mensagem pra atualizar ou digite o id:", msg_keyboard);
            } else {
                ctx.reply("Somenete @sirrandoom e @victorROCKETcripto podem atualizar mensagens");
                return done();
            }
        }
        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any)=> {
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
        const msg = await findMessage(message_id);
        if(!msg){
            console.log("Error: Message not found!");
            return done();
        }
        ctx.reply("Se deseja editar a mensagem, clique na caixa \"Trocar Mensagem\" e envie a mensagem desejada. Se não, clique em ➞ Next",{reply_markup: { inline_keyboard: [[{text: 'Trocar Mensagem', switch_inline_query_current_chat: msg.caption || "" }], [{text: '➞ Next', switch_inline_query_current_chat: '➞ Next'},{text:'🛑 Exit', switch_inline_query_current_chat: '🛑 Exit' }]]}});
        
        ctx.wizard.state.groups = msg.groups; 
        ctx.wizard.state.time = msg.period;
        ctx.wizard.state.type = msg.type; 
        ctx.wizard.state.caption = msg.caption || undefined;
        ctx.wizard.state.file_id = msg.fileid || undefined; 
        ctx.wizard.state.msg_id= message_id;

        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.text?.match(/🛑 Exit/)){
            return done();
        }
        else if(!ctx.message.text?.match(/➞ Next/)){
           ctx.wizard.state.caption = ctx.message.text;
        }
        const fill_reply = "Se deseja mudar o conteúdo atual (aúdio, imagem, etc), envie como resposta." + (ctx.wizard.state.file_id ? " O atual consta na mensagem." : "");
        switch(ctx.wizard.state.type){
            case "text":
                await ctx.reply(`${fill_reply}`, main_keyboard);
                break;
            case "photo":
                if (ctx.wizard.state.file_id)
                    await ctx.replyWithPhoto(ctx.wizard.state.file_id, {caption: fill_reply, reply_markup:{keyboard:[['➞ Next','🛑 Exit']], resize_keyboard: true}}).catch(err => ctx.reply("Failed to fetch photo"));
                else
                    await ctx.reply("Failed to fetch photo");
                break;
            case "audio":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithAudio(ctx.wizard.state.file_id, {caption: fill_reply,  reply_markup:{keyboard:[['➞ Next','🛑 Exit']], resize_keyboard: true}}).catch(err => ctx.reply("Failed to fetch audio"));
                else
                    await ctx.reply("Failed to fetch audio");
                break;
            case "sticker":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithSticker(ctx.wizard.state.file_id).catch(err=> ctx.reply("Failed to fetch sticker"));
                else
                    await ctx.reply("Failed to fetch audio")
                break;
            case "animation":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithAnimation(ctx.wizard.state.file_id, {caption: fill_reply,  reply_markup:{keyboard:[['➞ Next','🛑 Exit']], resize_keyboard: true}}).catch(err=> ctx.reply("Failed to fetch animation"));
                else
                    await ctx.reply("Failed to fetch animation");
            case "video":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithVideo(ctx.wizard.state.file_id, {caption: fill_reply,  reply_markup:{keyboard:[['➞ Next','🛑 Exit']], resize_keyboard: true}}).catch(err => ctx.reply("Failed to fetch a video"));
                else
                    await ctx.reply("Failed to fetch video");
        }

        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any)=> {
        if(ctx.message.text?.match(/🛑 Exit/)){
            return done();
        }

        if(ctx.message.photo){
            ctx.wizard.state.file_id = ctx.message.photo[ctx.message.photo.length -1].file_id;
            ctx.wizard.state.type = "photo";
        }
        else if(ctx.message.audio){
            ctx.wizard.state.file_id = ctx.message.audio.file_id;
            ctx.wizard.state.type = "audio";
        }
        else if(ctx.message.sticker){
            ctx.wizard.state.file_id = ctx.message.sticker.file_id;
            ctx.wizard.state.type = "sticker";
        }
        else if(ctx.message.animation){
            ctx.wizard.state.file_id = ctx.message.animation.file_id;
            ctx.wizard.state.type = "animation";
        }
        else if(ctx.message.video){
            ctx.wizard.state.file_id = ctx.message.video.file_id
            ctx.wizard.state.type = "video"
        }

        ctx.reply("Se deseja atualizar o tempo de transmissão, digite o intervalo em h e min, se não, clique em ➞ Next", main_keyboard);
        return ctx.wizard.next();
    }, async (ctx:(AnyContext & ContextComplement), done:any)=> {
        if(ctx.message.text?.match(/🛑 Exit/)){
            return done();
        }
        else if(!ctx.message.text?.match(/➞ Next/)){
            const match = ctx.message.text?.match(/^(\d+)$|^(\d+)\s*[hm]\s*(\d+(?:\s*[m]*))?$/)
            if(!match){
                ctx.reply("Message does not match time expected (ex: 10, 10m, 1h 30m). Type a new time period for the message:");
                return ctx.wizard;            
            }
            // console.log(ctx.message.text?.match(/^(\d+)$|(\d+)\s*[hm]\s*(\d+(?:\s*[m]*))?/g));
            let hour = 0;
            let min = 0
            let trimmed = ctx.message.text?.trim() || "";
            // console.log(trimmed);
            if(trimmed.indexOf('h')!=-1){
                hour = parseInt(trimmed.substring(0,trimmed.indexOf('h')));
                if(!trimmed.endsWith('h'))
                    min = parseInt(trimmed.substring(trimmed.indexOf('h')+1));
            }
            else if(trimmed.indexOf('m')!=-1)
                min = parseInt(trimmed.substring(0, trimmed.indexOf('m')));
            else
                min = parseInt(trimmed);
    
            // console.log(`${hour}:${min}`)
            if(!hour && !min){
                ctx.reply("Erro parsing time. Type a new time period for the message:");
                return ctx.wizard;
            }
    
            ctx.wizard.state.time = ((hour*60)+min)*60000;
        }
        const chats = await findAllChat();
        const chatString = [["-1 - Todos"]];
        for(const chat of chats){
            chatString.push([`${chat.id} - ${chat.title}`]);
        }
        chatString.push(['➞ Next',"🛑 Exit"]);

        const chatKeyboard = Markup.keyboard(chatString,).oneTime().resize();

        ctx.reply("Deseja alterar os grupos? Se não, clique em ➞ Next", chatKeyboard);
        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any)=> {
        if(ctx.message.text == "🛑 Exit") return done();
        if(!ctx.message.text?.match(/➞ Next/)){
            if(ctx.message.text?.match(/\d - ./)){
                const chat_id = parseInt( ctx.message.text.substring(0, ctx.message.text.indexOf('-')).trim() );
                if(chat_id>=0)
                    ctx.wizard.state.groups = [chat_id];
                else
                    ctx.wizard.state.groups = await (await findAllChat()).map(chat => chat.id);
            } else if (ctx.message.text?.match(/^(\d+[\s,]*)+$/)){
                ctx.wizard.state.groups = ctx.message.text.split(',').map((elem) => parseInt(elem));
                // CAREFUL DOESN'T CHECK IF GIVEN GROUPS EXISTS!
            } else {
                const chats = await findAllChat();
                const chatString = [["-1 - Todos"]];
                for(const chat of chats){
                    chatString.push([`${chat.id} - ${chat.title}`]);
                }
                chatString.push(['➞ Next',"🛑 Exit"]);
        
                const chatKeyboard = Markup.keyboard(chatString).oneTime().resize();
                ctx.reply("Invalid Group! Either choose one of the options or send groups id separated by comma.", chatKeyboard);
                return ctx.wizard;
            }
        }
        console.log(ctx.wizard.state);
    
        await ctx.reply(`A mensagem atualizada será:`);
        switch(ctx.wizard.state.type){
            case "text":
                await ctx.reply(`${ctx.wizard.state.caption}`);
                break;
            case "photo":
                if (ctx.wizard.state.file_id)
                    await ctx.replyWithPhoto(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch photo"));
                else
                    await ctx.reply("Failed to fetch photo");
                break;
            case "audio":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithAudio(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch audio"));
                else
                    await ctx.reply("Failed to fetch audio");
                break;
            case "sticker":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithSticker(ctx.wizard.state.file_id).catch(err=> ctx.reply("Failed to fetch sticker"));
                else
                    await ctx.reply("Failed to fetch audio")
                break;
            case "animation":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithAnimation(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err=> ctx.reply("Failed to fetch animation"));
                else
                    await ctx.reply("Failed to fetch animation");
            case "video":
                if(ctx.wizard.state.file_id)
                    await ctx.replyWithVideo(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch a video"));
                else
                    await ctx.reply("Failed to fetch video");
        }            
        ctx.reply("Deseja continuar?", last_keyboard);

        return ctx.wizard.next();
    }, async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.text?.match(/"(❌ Não|✅ Sim|🛑 Exit)"/)){
            ctx.reply("Unexpected Answer.")
            return ctx.wizard.back();
        }
        if(ctx.message.text?.match(/✅ Sim|sim|s/gi)){
            const result = await updateAndSend( ctx.wizard.state.msg_id || -1,{time: ctx.wizard.state.time,
                                             type: ctx.wizard.state.type,
                                             caption: ctx.wizard.state.caption,
                                             file_id: ctx.wizard.state.file_id,
                                             groups: ctx.wizard.state.groups});
            if(result)
                ctx.reply("Mensagem atualizada com sucesso", {reply_markup:{remove_keyboard:true}});
        }

        if(ctx.message.text?.match(/❌ Não|não|nao|n/gi)){
            const msg_keyboard = await getMessagesKeyboard();
            ctx.reply("Selecione uma mensagem pra atualizar ou digite o id:", msg_keyboard);
            return ctx.wizard.selectStep(1);
        }

        return done();
    }
)
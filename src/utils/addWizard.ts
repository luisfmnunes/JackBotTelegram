import { Markup } from "telegraf";
import { WizardContext, WizardContextWizard } from "telegraf/typings/scenes";
import { composeWizardScene } from "./sceneFactory";
import {prisma} from "../db/prisma"
import { forceReply } from "telegraf/typings/markup";
import { addAndSend } from "./sender";
import { Message } from "../types/message";

const exit_keyboard = Markup.keyboard(['🛑 Exit']).oneTime().resize();
const last_keyboard = Markup.keyboard([
    ['✅ Sim', '❌ Não'],
    ['🛑 Exit']
]).oneTime().resize();
const empty_keyboard = Markup.keyboard([""]).oneTime().resize();
     
interface AnyContext extends WizardContext{
};

interface ContextComplement{
    wizard:{
        state:{
            file_id?: string
            caption?: string
            type: string
            time: number
        }
    }
    chat?:{
        title?: string
        first_name?: string
        username?: string
    }
    message:{
        text?: string,
        photo?: {
            file_id: string
            file_unique_id: string
            file_size: number
            width: number
            height: number
        }[]
        audio?: {
            duration: number
            file_name: string
            mime_type: string
            title: string
            file_id: string
            file_unique_id: string
            file_size: number            
        },
        sticker?:{
            file_id: string
        }
        animation?:{
            file_name: string
            mime_type: string
            duration: number
            width: number
            height: number
            file_id: string
            file_unique_id: string
            file_size: number
        }
        latitude?: string,
        longitude?: string,
        media?: object,
        video?: {
            duration: number
            width: number
            height: number
            file_name: string
            mime_type: string
            file_id: string
            file_unique_id: string
            file_size: number
        }
        voice?: object,
        caption?: string
    }
};


export const createAddWizard = composeWizardScene(
    (ctx: (AnyContext & ContextComplement)) => {
        ctx.reply("Envie a mensagem que gostaria de salvar.", exit_keyboard);
        return ctx.wizard.next();
        
    },
    (ctx: (AnyContext & ContextComplement), done: any) => {
        // console.log(ctx.message);
        if(ctx.message.text == "🛑 Exit") return done();
        if(ctx.updateType == 'message'){
            if(ctx.message.text){
                ctx.wizard.state.caption = ctx.message.text;
                ctx.wizard.state.type = "text";
            }
            else if(ctx.message.photo){
                ctx.wizard.state.caption = ctx.message.caption;
                ctx.wizard.state.file_id = ctx.message.photo[ctx.message.photo.length -1].file_id;
                ctx.wizard.state.type = "photo";
            }
            else if(ctx.message.audio){
                ctx.wizard.state.caption = ctx.message.caption;
                ctx.wizard.state.file_id = ctx.message.audio.file_id;
                ctx.wizard.state.type = "audio";
            }
            else if(ctx.message.sticker){
                ctx.wizard.state.file_id = ctx.message.sticker.file_id;
                ctx.wizard.state.type = "sticker";
            }
            else if(ctx.message.animation){
                ctx.wizard.state.file_id = ctx.message.animation.file_id;
                ctx.wizard.state.caption = ctx.message.caption
                ctx.wizard.state.type = "animation";
            }
            else if(ctx.message.video){
                ctx.wizard.state.file_id = ctx.message.video.file_id
                ctx.wizard.state.caption = ctx.message.caption
                ctx.wizard.state.type = "video"
            }
        }
        ctx.reply("De quanto em quanto tempo a mensagem será enviada?", exit_keyboard);
        return ctx.wizard.next();
    },
    async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.text == "🛑 Exit") return done();
        const match = ctx.message.text?.match(/^(\d+)$|^(\d+)\s*[hm]\s*(\d+(?:\s*[m]*))?$/)
        if(!match){
            ctx.reply("Message does not match time expected (ex: 10, 10m, 1h 30m). Type a new time period for the message:");
            return ctx.wizard;            
        }
        // console.log(ctx.message.text?.match(/^(\d+)$|(\d+)\s*[hm]\s*(\d+(?:\s*[m]*))?/g));
        let hour = 0;
        let min = 0
        let trimmed = ctx.message.text?.trim() || "";
        console.log(trimmed);
        if(trimmed.indexOf('h')!=-1){
            console.log("?ASDFA")
            hour = parseInt(trimmed.substring(0,trimmed.indexOf('h')));
            if(!trimmed.endsWith('h'))
                min = parseInt(trimmed.substring(trimmed.indexOf('h')+1));
        }
        else if(trimmed.indexOf('m')!=-1)
            min = parseInt(trimmed.substring(0, trimmed.indexOf('m')));
        else
            min = parseInt(trimmed);

        console.log(`${hour}:${min}`)
        if(!hour && !min){
            ctx.reply("Erro parsing time. Type a new time period for the message:");
            return ctx.wizard;
        }

        ctx.wizard.state.time = ((hour*60)+min)*60000;
        console.log(ctx.wizard.state);

        await ctx.reply(`A mensagem a ser enviada será essa:`);
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
    }, 
    async (ctx: (AnyContext & ContextComplement), done: any) => {
        if(ctx.message.text?.match(/"(❌ Não|✅ Sim|🛑 Exit)"/)){
            ctx.reply("Unexpected Answer.")
            return ctx.wizard.back();
        }
        if(ctx.message.text?.match(/✅ Sim|sim/gi)){
            const result = await addAndSend({time: ctx.wizard.state.time,
                                             type: ctx.wizard.state.type,
                                             caption: ctx.wizard.state.caption,
                                             file_id: ctx.wizard.state.file_id});
            if(result)
                ctx.reply("Mensagem aceita", {reply_markup:{remove_keyboard:true}});
        }

        if(ctx.message.text?.match(/❌ Não|não|nao/gi)){
            ctx.reply("Envie a mensagem que gostaria de salvar.", exit_keyboard);
            return ctx.wizard.selectStep(1);
        }

        return done();
    }
);

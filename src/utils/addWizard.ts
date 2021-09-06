import { WizardContext, WizardContextWizard } from "telegraf/typings/scenes";
import { composeWizardScene } from "./sceneFactory";

interface AnyContext extends WizardContext{
};

interface ContextCompliment{
    wizard:{
        state:{
            file_id?: string
            caption?: string
            type?: string
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
    (ctx: (AnyContext & ContextCompliment)) => {
        ctx.reply("Envie a mensagem que gostaria de salvar.");
        return ctx.wizard.next();
        
    },
    (ctx: (AnyContext & ContextCompliment), done: any) => {
        console.log(ctx.message);
        console.log(ctx.updateType);
        console.log(ctx.chat?.title);
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
        ctx.reply("De quanto em quanto tempo a mensagem será enviada?");
        return ctx.wizard.next();
    },
    async (ctx: (AnyContext & ContextCompliment), done: any) => {
        await ctx.reply(`A mensagem a ser enviada será essa:`);
        switch(ctx.wizard.state.type){
        case "text":
            ctx.reply(`${ctx.wizard.state.caption}`);
            break;
        case "photo":
            if (ctx.wizard.state.file_id)
                ctx.replyWithPhoto(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch photo"));
            else
                ctx.reply("Failed to fetch photo");
            break;
        case "audio":
            if(ctx.wizard.state.file_id)
                ctx.replyWithAudio(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch audio"));
            else
                ctx.reply("Failed to fetch audio");
            break;
        case "sticker":
            if(ctx.wizard.state.file_id)
                ctx.replyWithSticker(ctx.wizard.state.file_id).catch(err=> ctx.reply("Failed to fetch sticker"));
            else
                ctx.reply("Failed to fetch audio")
            break;
        case "animation":
            if(ctx.wizard.state.file_id)
                ctx.replyWithAnimation(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err=> ctx.reply("Failed to fetch animation"));
            else
                ctx.reply("Failed to fetch animation");
        case "video":
            if(ctx.wizard.state.file_id)
                ctx.replyWithVideo(ctx.wizard.state.file_id, {caption: ctx.wizard.state.caption}).catch(err => ctx.reply("Failed to fetch a video"));
            else
                ctx.reply("Failed to fetch video");
        }            

        return done();
    }
);

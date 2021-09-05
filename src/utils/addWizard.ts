import { Context } from "telegraf";
import { WizardContext } from "telegraf/typings/scenes";
import { composeWizardScene } from "./sceneFactory";



export const createAddWizard = composeWizardScene(
    (ctx: WizardContext) => {
        ctx.reply("Envie a mensagem que gostaria de salvar.");
        return ctx.wizard.next();
        
    },
    (ctx: any, done: any) => {
        console.log(ctx.message);
        console.log(ctx.updateType);
        if(ctx.updateType == 'message'){
            ctx.wizard.state.caption = ctx.message.text || "Not Text";
        }
        ctx.reply("De quanto em quanto tempo a mensagem será enviada?");
        return ctx.wizard.next();
    },
    (ctx: any, done: any) => {
        ctx.reply(`A mensagem a ser enviada será: ${ctx.wizard.state.caption}`);
        return done();
    }
);

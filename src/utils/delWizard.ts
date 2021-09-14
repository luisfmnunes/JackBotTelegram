import { Markup } from "telegraf";
import { WizardContext, WizardContextWizard } from "telegraf/typings/scenes";
import { composeWizardScene } from "./sceneFactory";
import { AnyContext, ContextComplement } from "../types/context"
import { prisma } from "../db/prisma";


const exit_keyboard = Markup.keyboard(['🛑 Exit']).oneTime().resize();

const getMessagesKeyboard = async () => {
    let messages = []
    for(const msg of await prisma.message.findMany()){
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
            const result = await prisma.message.delete({
                where:{
                    id: message_id
                }
            }).then(() => true).catch(() => false);
            if(result) ctx.reply("Mensagem deletada com sucesso");
            else ctx.reply(`Mensagem de id ${message_id} não encontrado.`);
        } else ctx.reply(`Failed message_id parsing. got: ${message_id}`);
        return done();
    }
)

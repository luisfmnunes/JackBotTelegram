import {bot} from "../bot/bot"
import { prisma } from "../db/prisma"
import { addMessage } from "../db/messageModel"
import { Message } from "../types/message"

const sendMessage = async (message: Message, chatid: BigInt) => {
    switch(message.type){
        case "text":
            await bot.telegram.sendMessage(chatid.toString(), message.caption || "nothing", {reply_markup:{remove_keyboard: true}});
            break;
        case "photo":
            if(message.file_id)
                await bot.telegram.sendPhoto(chatid.toString(), message.file_id,{caption: message.caption,reply_markup:{remove_keyboard: true}});
            break;
        case "audio":
            if(message.file_id)
                await bot.telegram.sendAudio(chatid.toString(), message.file_id,{caption: message.caption,reply_markup:{remove_keyboard: true}});
            break;
        case "sticker":
            if(message.file_id)
                await bot.telegram.sendSticker(chatid.toString(), message.file_id, {reply_markup:{remove_keyboard: true}});
            break;
        case "animation":
            if(message.file_id)
                await bot.telegram.sendAnimation(chatid.toString(), message.file_id,{caption: message.caption,reply_markup:{remove_keyboard: true}});
            break;
        case "video":
            if(message.file_id)
                await bot.telegram.sendVideo(chatid.toString(), message.file_id,{caption: message.caption,reply_markup:{remove_keyboard: true}});
            break;

    }
}

const addAndSend = async (message: Message) => {
    const result = await addMessage(message);
    if(result){
        const chats = await prisma.chat.findMany();
        if(!chats){
            console.log("No chats registered");
            return; 
        }
        for(const chat of chats){
            await sendMessage(message, chat.chatid);
        }
    }

    return true;
}

const messageCheck = async () => {
    setInterval(async ()=> {
        const messages = await prisma.message.findMany();
        const chats = await prisma.chat.findMany();
        for(const message of messages){
            let nextCall: Date = new Date(message.lastCalled.getTime() + message.period);
            if(nextCall < new Date(Date.now())){
                console.log(`Sending Message of id ${message.id}. Caption: ${(message.caption?.substring(0,20) || "no caption")+"..."}. File ID: ${message.fileid || "no file_id"}`);
                for(const chat of chats)
                    await sendMessage({time: message.period, type: message.type, caption: message.caption || undefined, file_id: message.fileid || undefined},chat.chatid);
                await prisma.message.update({
                    where:{
                        id: message.id
                    },
                    data:{
                        lastCalled: new Date()
                    }
                })
            }
        } 
    }, 60000);
}

export {addAndSend, messageCheck};
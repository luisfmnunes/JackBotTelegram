import { prisma } from './prisma';
import { Message } from '../types/message'

const addMessage = async (message: Message) => {
    const result = await prisma.message.create({
        data:{
            fileid: message.file_id,
            type: message.type,
            caption: message.caption,
            period: message.time,
            groups: message.groups
        }
    })

    if(result) return true;
    return false;
}

const updateMessage = async (id: number, msg: Message) => { 
    const result = await prisma.message.update({
        where:{
            id: id
        },
        data:{
            caption: msg.caption,
            fileid: msg.file_id,
            groups: msg.groups,
            period: msg.time,
            type: msg.type
        }
    });

    if(result) return true;
    return false;
}

const deleteMessage = async (id: number) => {
    const result = await prisma.message.delete({
        where:{
            id: id
        }
    })

    if(result) return true;
    return false;
}

const removeMessages = async() => {
    const result = await prisma.message.deleteMany();
    return result;
}

const findAllMessage = async () => {
    return await prisma.message.findMany();
}

const findMessage = async (id:number)=> {
    const result = await prisma.message.findUnique({
        where: {
            id: id
        }
    })

    return result ? result : undefined
} 

export {addMessage, updateMessage, deleteMessage, removeMessages, findMessage, findAllMessage};
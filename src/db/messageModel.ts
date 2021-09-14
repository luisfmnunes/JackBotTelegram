import { prisma } from './prisma';
import { Message } from '../types/message'

const addMessage = async (message: Message) => {
    const result = await prisma.message.create({
        data:{
            fileid: message.file_id,
            type: message.type,
            caption: message.caption,
            period: message.time
        }
    })

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

export {addMessage, deleteMessage, removeMessages};
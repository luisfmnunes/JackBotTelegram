import { prisma } from './prisma';
import { Chat } from '../types/chat'

const findAllChat = async () => {
    return await prisma.chat.findMany();
}

const findManyChat = async (ids: number[]) => {
     const result = await prisma.chat.findMany()
     const filter = result.filter((chat) => ids.find(elem => elem == chat.id));

     console.log(filter);
     return filter;
}

export {findAllChat, findManyChat};
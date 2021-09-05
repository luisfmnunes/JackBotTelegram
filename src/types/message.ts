interface Message{
    chat_id: number,
    time: number,
    caption?: string,
    file_id?: string
}

export default Message;
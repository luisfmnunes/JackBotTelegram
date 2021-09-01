interface Message{
    chat_id: number,
    time: number,
    text?: string,
    file_id?: string
}

export default Message;
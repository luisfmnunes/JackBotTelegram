interface Message{
    time: number,
    caption?: string,
    file_id?: string,
    type: string,
    groups: number[]
}

export {Message};
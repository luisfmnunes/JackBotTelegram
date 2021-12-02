import { WizardContext, WizardContextWizard } from "telegraf/typings/scenes";

interface AnyContext extends WizardContext{
};

interface ContextComplement{
    wizard:{
        state:{
            file_id?: string
            caption?: string
            type: string
            time: number
            groups: number[]
            msg_id?: number
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

export {AnyContext, ContextComplement};
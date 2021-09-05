import { Scenes } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

const unwrapCallback = async (ctx: SceneContext, nextScene: any) => {
    const nextSceneId = await Promise.resolve(nextScene(ctx));
    if (nextSceneId) return ctx.scene.enter(nextSceneId, ctx.scene.state);
    return ctx.scene.leave();
}

export const composeWizardScene = (...advancedSteps: any[]) => (
    function createWizardScene(sceneType: any, nextScene: any){
        return new Scenes.WizardScene(sceneType,
            ...advancedSteps.map((stepFn) => async (ctx: any, next: any) => {
                if(!ctx.message && !ctx.callbackQuery) return undefined;
                return stepFn(ctx, () => unwrapCallback(ctx, nextScene), next);
            })    
        )
    }
);
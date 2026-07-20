import {ArrowRightOutlined, SettingOutlined} from "@ant-design/icons";
import Logo from "data-base64:~assets/ai_avatar.svg";
import {useContext, useEffect, useState} from "react";
import {
    MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {Storage} from '@plasmohq/storage';
import {sendToBackground} from "@plasmohq/messaging";
import {Logger} from "~utils/logger";
import {LocaleContext} from "~libs/i18n";

export default function ChatCaptchaBanner({windowKey, text, closeWhileShow}: { windowKey: string, text?: string, closeWhileShow?: boolean}) {
    const [windowWidth, setWindowWidth] = useState(document.body.clientWidth);
    const {t} = useContext(LocaleContext);

    const windowResize = function () {
        setWindowWidth(document.body.clientWidth);
    };

    useEffect(() => {
        Logger.trace('ChatCaptchaBanner', windowKey, text, closeWhileShow);
        if(closeWhileShow) {
            goBack();
        }

        window.addEventListener('resize', windowResize);

        return () => {
            window.removeEventListener('resize', windowResize);
        };
    }, []);

    const goBack = function () {
        const captchaWindowKey = new URLSearchParams(location.search).get(windowKey);

        void chrome.runtime.sendMessage(chrome.runtime.id, {
            action: MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS,
            authKey: captchaWindowKey
        });

        const storage = new Storage();
        const windowId = new URLSearchParams(location.search).get(WINDOW_FOR_REMOVE_STORAGE_KEY);
        Logger.log('windowId', windowId);
        storage.get(windowId!).then((windowId: any) => {
            if (windowId) {
                void sendToBackground({
                    name: "close-window",
                    body: {
                        windowId
                    },
                });
            }
        });
    };

    return <div style={{width: `${windowWidth}px`, background: "linear-gradient(298.91deg, #0AFE4E -13.62%, #0A4DFE 18.01%, #CB00FE 102.24%)"}}  className={'py-[10px] flex justify-center items-center text-[14px] px-[16px] box-border'}>
        {text === undefined && <SettingOutlined className={'text-[24px] text-white'}/>}
        {text === undefined && <p className={'text-white text-[20px] ml-[12px] mr-[43px]'}>
            {t('captchaBanner.pleaseLogin')}
        </p>}
        <div onClick={goBack} className={"flex cursor-pointer justify-center items-center px-[16px] py-[8px] bg-white rounded-[8px]"}>
            <img className={"w-[20px] h-[20px] mr-[12px]"} src={Logo} alt=""/>
            <div className={"mr-[10px] text-black"}>
                {t('captchaBanner.backToEasyChatAI')}
            </div>
            <ArrowRightOutlined style={{color: "black"}}/>
        </div>
    </div>;
}

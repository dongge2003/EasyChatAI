import {useContext} from "react";
import { Tooltip } from "antd";
import IconSetting from "data-base64:~assets/setting.svg";
import NewChatIcon from "data-base64:~assets/new_chat.svg";
import eventBus from "~libs/EventBus";
import {LocaleContext} from "~libs/i18n";

export default function () {
    const {t} = useContext(LocaleContext);

    const newChatClick = () => {
        eventBus.emit('newChat');
    };

    const openSettings = () => {
        window.open(`chrome-extension://${chrome.runtime.id}/options.html`);
    };

    return <div className="h-[52px] box-border flex-0 flex-shrink-0 flex-grow-0 w-full flex justify-between items-center px-[16px] border-b border-subtle">
        <div className="flex items-center text-primary text-[18px] font-[600] tracking-[-0.02em]">
            {t('header.title')}
        </div>
        <div className="flex justify-end items-center">
            <Tooltip title={t('header.newChat')}>
                <img className="w-[22px] mr-4 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" src={NewChatIcon} onClick={newChatClick} alt=""/>
            </Tooltip>
            <Tooltip title={t('header.settings')}>
                <div onClick={openSettings} className="cursor-pointer">
                    <img className="w-[20px] h-[20px] block opacity-60 hover:opacity-100 transition-opacity" src={IconSetting} alt=""/>
                </div>
            </Tooltip>
        </div>
    </div>;
}

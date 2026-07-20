import * as React from 'react';
import {useContext, useEffect, useRef, useState} from "react";
import {Tooltip} from "antd";
import {type CMsItem, type M, ModelManagementContext} from "~provider/ModelManagementProvider";
import RedC from "data-base64:~assets/red_c.png";
import GreenC from "data-base64:~assets/green_c.png";
import ShowMore from "data-base64:~assets/show_more.svg";
import IconLock from "data-base64:~assets/lock.svg";
import {Logger} from "~utils/logger";
import {ConversationContext} from "~provider/sidepanel/ConversationProvider";
import {LocaleContext} from "~libs/i18n";

const ModelItems = ({item}: { item: CMsItem }) => {
    const [isShowMore, setIsShowMore] = useState(false);
    const [isLogin, setIsLogin] = useState(false);
    const {conversationId} = useContext(ConversationContext);

    useEffect(() => {
        getLoginStatus();
    }, []);

    const getLoginStatus = async () => {
        const [, isLogin] = await item.models[0].checkIsLogin();
        Logger.log('login:', item.models[0].botName, isLogin);
        setIsLogin(isLogin);
    };

    const showMore = (val: boolean) => {
        setIsShowMore(val);
    };

    const openLogin = async function (model: M) {
        const r = await new model({globalConversationId: conversationId}).startAuth();
        if (r) {
            getLoginStatus();
        }
    };

    return <div className="text-[#333333] mb-2">
        <div className="px-3 py-1.5 flex justify-start items-center">
            <img src={isLogin ? GreenC : RedC} className='w-3 h-3 mr-1.5' alt=""/>
            <span className='text-[12px] text-[#C2C2C2] leading-none'>{item.label}</span>
        </div>

        {
            item.models.slice(0, isShowMore ? item.models.length : 3).map((model) => {
                return (
                    <ModelItem key={model.botName} model={model} isLogin={isLogin} getLoginStatus={getLoginStatus}/>
                );
            })
        }
        {
            item.models.length > 3 && !isShowMore &&
            <div className='w-full flex justify-center items-center my-1.5 cursor-pointer' onClick={() => showMore(true)}>
                <img src={ShowMore} className='w-3 h-3 mr-1' alt=""/>
                <span className='text-[11px] text-[#C2C2C2] mr-1'>
                    {item.models.length - 3 > 0 ? `+${item.models.length - 3} more` : ''}
                </span>
                <img src={ShowMore} className='w-3 h-3' alt=""/>
            </div>
        }
    </div>;
};

const ModelItem = ({model, isLogin, getLoginStatus}: {
    model: M,
    isLogin: boolean,
    getLoginStatus: () => void
}) => {
    const [modelCanUse, setModelCanUse] = useState(false);
    const {conversationId} = useContext(ConversationContext);
    const {currentBots, setCurrentBots, saveCurrentBotsKeyLocal} = useContext(ModelManagementContext);
    const {t} = useContext(LocaleContext);

    useEffect(() => {
        getUseStatus();
    }, [isLogin]);

    const getUseStatus = async () => {
        const val = await model.checkModelCanUse();
        Logger.log('canUse:', model.botName, val);
        setModelCanUse(val);
    };

    const selectModel = async (model: M) => {
        // Single-model: click always selects this model
        setCurrentBots([model]);
        saveCurrentBotsKeyLocal();

        if (model.requireLogin && !isLogin) {
            new model({globalConversationId: conversationId}).startAuth();
        }
    };

    const isSelected = currentBots.length > 0 && currentBots[0].botName === model.botName;

    const modelTip = (model: M) => {
        const loginUrl = model.loginUrl;
        return <div className='px-1 py-[6px] text-[13px]'>
            <div className="font-bold mb-1">{model.botName}</div>
            <div className="mb-1 text-white text-opacity-60 text-[12px]">
                {loginUrl ? (
                    <span>{t('modelCheck.logInto', {host: new URL(loginUrl).hostname})}</span>
                ) : (
                    <span>{t('modelCheck.apiKeyBased')}</span>
                )}
            </div>
            {model.desc && <div className='text-[11px] text-white text-opacity-60'>{model.desc}</div>}
        </div>;
    };

    return (
        <div
            onClick={() => selectModel(model)}
            className={`relative w-full h-8 px-3 box-border cursor-pointer flex justify-between items-center
                ${isSelected ? 'bg-[#F2F5FF]' : 'hover:bg-[#F2F5FF]'}`}>
            <div className='flex items-center justify-start overflow-hidden flex-1'>
                {/* Selected indicator bar */}
                {isSelected && <div className="w-0.5 h-4 bg-[#0A4DFE] absolute left-0 top-1/2 -translate-y-1/2"/>}
                <div className='w-4 h-4 mr-2 relative flex-shrink-0'>
                    <img className={'w-full h-full'} src={model.logoSrc} alt=""/>
                    {!modelCanUse &&
                        <img src={IconLock} className='w-3 h-3 absolute right-[-6px] bottom-[-4px]' alt=""/>}
                </div>
                <Tooltip overlayStyle={{maxWidth: '260px'}} title={modelTip(model)} placement={"topLeft"}>
                    <span className='text-[13px] truncate'>{model.botName}</span>
                </Tooltip>
            </div>
            {/* Compact right-side indicators */}
            <div className="flex items-center flex-shrink-0 ml-2 gap-1">
                {model.paidModel && (
                    <span className="text-[9px] text-[#C2C2C2] bg-[#C2C2C2] bg-opacity-20 px-1 rounded leading-[14px]">
                        3rd
                    </span>
                )}
                {model.maxTokenLimit && (
                    <span className="text-[10px] text-[#4948DB] bg-[#4948DB1A] px-1 rounded leading-[14px]">
                        {Math.round(model.maxTokenLimit / 1000)}k
                    </span>
                )}
            </div>
        </div>
    );
};

interface Props {
    onClose: () => void;
}

export const ModelCheckList = ({onClose}: Props) => {
    const {categoryModels} = useContext(ModelManagementContext);
    const {t} = useContext(LocaleContext);

    useEffect(() => {
        Logger.log('ModelCheckList mounted');
    }, []);

    return (
        <div className="w-[280px]">
            <div className="text-[13px] text-[#333333] font-semibold px-3 py-2 border-b border-[#F3F4F9]">
                {t('modelCheck.title')}
            </div>
            <div className="max-h-[320px] overflow-y-auto py-1">
                {
                    categoryModels.current.map((item, i) => {
                        return (
                            <ModelItems key={i} item={item}/>
                        );
                    })
                }
            </div>
        </div>
    );
};

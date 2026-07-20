import React, {Fragment, type ReactNode, useEffect, useState} from "react";
import {
    getLatestState,
    MESSAGE_PANEL_OPENED_PING_FROM_PANEL, MESSAGE_UPDATE_PANEL_INIT_DATA,
    PORT_LISTEN_PANEL_CLOSED_KEY,
    STORAGE_OPEN_PANEL_INIT_DATA
} from "~utils";
import {Storage} from "@plasmohq/storage";
import {IAskAi, type IOpenPanelData, OpenPanelType} from "~libs/open-ai/open-panel";
import type {NavigateFunction} from  "react-router-dom";
import {PanelRouterPath} from "~libs/constants";
import {message} from "antd";
import type {MessageInstance} from "antd/lib/message/interface";
import {Logger} from "~utils/logger";

interface ISidePanelContext {
    windowHeight: number;
    setWindowHeight: React.Dispatch<React.SetStateAction<number>>;
    panelOpenType?: OpenPanelType;
    askAiData?: IAskAi
    navigation?: NavigateFunction;
    setNavigation: React.Dispatch<React.SetStateAction<NavigateFunction>>
    userLanguage: string;
    messageApi: MessageInstance,
    expandMenu: boolean,
    setExpandMenu: React.Dispatch<React.SetStateAction<boolean>>,
}

export const SidePanelContext = React.createContext<ISidePanelContext>({} as ISidePanelContext);

const SidePanelProvider = ({children}: { children: ReactNode }) => {
    const [windowHeight, setWindowHeight] = useState<ISidePanelContext['windowHeight']>(0);
    const [panelInitialized, setPanelInitialized] = useState(false);
    const [askAiData, setAskAiData] = useState<IAskAi>();
    const [panelOpenType, setPanelOpenType] = useState<OpenPanelType>();
    const [navigation, setNavigation] = useState<NavigateFunction>();
    const [userLanguage] = useState(navigator.language ?? "english");
    const [messageApi, contextHolder] = message.useMessage();
    const [expandMenu, setExpandMenu] = useState<boolean>(window.innerWidth > 800);

    function getInitDataFromStorage() {
        const storage = new Storage();

        storage.get(STORAGE_OPEN_PANEL_INIT_DATA).then(async (r) => {
            if (r) {
                const data = r as unknown as IOpenPanelData;

                setPanelOpenType(data.openType);

                let targetPath = PanelRouterPath.CONVERSATION;
                if (data.openType === OpenPanelType.AI_ASK) {
                    targetPath = PanelRouterPath.CONVERSATION;
                    setAskAiData(data.data as IAskAi);
                }

                const pathSplit = location.pathname.split('');
                const currentPathName = pathSplit[pathSplit.length - 1];

                const _navigation  = await getLatestState(setNavigation);

                if (_navigation && currentPathName !== targetPath) {
                    _navigation(targetPath);
                }
            }

            void storage.set(STORAGE_OPEN_PANEL_INIT_DATA, null);
            setPanelInitialized(true);
        });
    }

    useEffect(() => {
        getInitDataFromStorage();

        chrome.runtime.onMessage.addListener(function (request) {
            if (request.action === MESSAGE_UPDATE_PANEL_INIT_DATA) {
                getInitDataFromStorage();
            }
        });

        try {
            void chrome.runtime.sendMessage({ action: MESSAGE_PANEL_OPENED_PING_FROM_PANEL });
            chrome.runtime.connect({ name: PORT_LISTEN_PANEL_CLOSED_KEY });
        } catch (e) {
            Logger.log('connect backend port', e);
        }

        window.addEventListener('resize', function () {
            if (window.innerWidth > 800) {
                setExpandMenu(true);
            }else {
                setExpandMenu(false);
            }
        });
    }, []);

    return (
        <SidePanelContext.Provider value={{
            windowHeight,
            setWindowHeight,
            panelOpenType,
            askAiData,
            navigation,
            setNavigation,
            userLanguage,
            messageApi,
            expandMenu,
            setExpandMenu,
        }}>
            <Fragment>
                {contextHolder}
                {panelInitialized ? children : null}
            </Fragment>
        </SidePanelContext.Provider>
    );
};

export default SidePanelProvider;

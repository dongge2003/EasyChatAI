import {RouterProvider} from "react-router-dom";
import {router} from "~sidepanel/router";
import React, {useContext} from "react";
import type {PlasmoGetStyle} from "plasmo";
import SidePanelProvider, {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import styleText from 'data-text:~style/panel-main.module.scss';
import * as style from "~style/panel-main.module.scss";
import '~base.scss';
import CommonShortcutProvider from "~provider/CommonShortcutProvider";
import GoogleAnalyticsProvider from "~provider/GoogleAnalyticsProvider";
import { LocaleProvider } from "~libs/i18n";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

function TopWrapper({children}: { children: React.ReactNode }) {
    const {windowHeight, setWindowHeight} = useContext(SidePanelContext);

    const afterContainerRendered = (ref: HTMLParagraphElement) => {
        if (ref) {
            // waiting render?
            const offset = 52;
            setTimeout(function () {
                setWindowHeight(ref.clientHeight - offset);
            }, 20);

            window.addEventListener('resize', function () {
                setWindowHeight(ref.clientHeight - offset);
            });
        }
    };

    return <div ref={afterContainerRendered} className={style.topWrapper}>
        <div className={style.theContainer}>
            <div style={{flex: 1, overflow: 'hidden'}}>
                {windowHeight > 0 ? children : null}
            </div>
        </div>
    </div>;
}

export default function Main() {
    return <GoogleAnalyticsProvider>
        <CommonShortcutProvider>
            <SidePanelProvider>
                <LocaleProvider>
                    <TopWrapper>
                        <RouterProvider router={router}/>
                    </TopWrapper>
                </LocaleProvider>
            </SidePanelProvider>
        </CommonShortcutProvider>
    </GoogleAnalyticsProvider>;
}

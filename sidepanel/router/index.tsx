import {createBrowserRouter, Navigate, Outlet, useLocation, useNavigate,} from "react-router-dom";
import Conversation from "~sidepanel/pages/conversation";
import {PanelRouterPath} from "~libs/constants";
import React, {Fragment,  useContext, useEffect} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import Header from "~component/sidepanel/Header";
import {GoogleAnalyticsContext} from "~provider/GoogleAnalyticsProvider";

const Container = function () {
    const {setNavigation} = useContext(SidePanelContext);
    const {analytics} = useContext(GoogleAnalyticsContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        void analytics.current.firePageViewEvent("", location.pathname);
    }, [location]);

    useEffect(() => {
        setNavigation(() => {
            return navigate;
        });
    }, []);

    return <Fragment>
        <Header/>
        <Outlet/>
    </Fragment>;
};

export const router = createBrowserRouter([
    {
        path: "sidepanel.html",
        element: <Container/>,
        children: [
            {
                path: "",
                element: <Navigate to={PanelRouterPath.CONVERSATION} replace/>,
            },
            {
                path: PanelRouterPath.CONVERSATION,
                element: <Conversation/>,
            },
        ],
    },
]);

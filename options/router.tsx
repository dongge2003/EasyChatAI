import {createBrowserRouter} from "react-router-dom";
import Index from "~options/pages";
import ShortcutMenu from "~options/pages/ShortcutMenu";
import CustomProviderPage from "~options/pages/CustomProviderPage";
import Layout from "~options/layout";
import OptionsProvider from "~provider/Options";
import {Fragment} from "react";

export const PATH_SETTING_SIDEBAR = "path_shortcut";
export const PATH_SETTING_CONTACT_US = "path_contact_us";
export const PATH_SETTING_SHORTCUT = "";
export const PATH_SETTING_CUSTOM_PROVIDER = "custom-provider";

const Wrapper = ({children}) => {
    return <Fragment>
        {children}
    </Fragment>;
};

export const router = createBrowserRouter([
    {
        path: "options.html",
        element: <Wrapper>
            <OptionsProvider><Layout/></OptionsProvider>
        </Wrapper>,
        children: [
            // {
            //     path: "",
            //     element: <DetermineRedirect/>,
            // },
            {
                path: PATH_SETTING_SIDEBAR,
                element: <Index/>,
            },
            {
                path: PATH_SETTING_SHORTCUT,
                element: <ShortcutMenu/>,
            },
            {
                path: PATH_SETTING_CUSTOM_PROVIDER,
                element: <CustomProviderPage/>,
            },
        ],
    },
]);

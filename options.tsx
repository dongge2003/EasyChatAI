import {RouterProvider} from "react-router-dom";
import {router} from "~options/router";
import React from "react";
import '~base.scss';
import GoogleAnalyticsProvider from "~provider/GoogleAnalyticsProvider";
import { LocaleProvider } from "~libs/i18n";

export default function () {
    return  <GoogleAnalyticsProvider>
        <LocaleProvider>
            <RouterProvider router={router}/>
        </LocaleProvider>
    </GoogleAnalyticsProvider>;
}

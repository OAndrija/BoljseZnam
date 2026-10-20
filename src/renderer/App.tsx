import { useEffect, useState } from "react";
import type { AppInfo } from "../shared/types";

export default function App() {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    useEffect(() => {
        window.api.getAppInfo().then((info) => {
            setAppInfo(info);
        });
    }, []);

    return (
        <main>
            <h1>BoljseZnam</h1>
            <p>Application is running.</p>
            {appInfo && <p>Version: {appInfo.version}</p>}
        </main>
    );
}
import { useEffect, useState } from "react";
import type { AppInfo } from "../shared/types";
import Problem from "./components/Problem";
import type { ProblemData } from "../shared/types";

export default function App() {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [problem, setProblem] = useState<ProblemData | null>(null);

    useEffect(() => {
        window.api.getAppInfo().then((info) => {
            setAppInfo(info);
        });

        window.api.getProblemData("test", 1990, 2).then((data) => {
            setProblem(data);
        });
    }, []);

    return (
        <main>
            <h1>BoljseZnam</h1>
            <p>Application is running.</p>
            {appInfo && <p>Version: {appInfo.version}</p>}
            {problem && <Problem problem={problem}></Problem>}
        </main>
    );
}
import { createContext, useContext, useState } from 'react';

const CodebaseContext = createContext(null);

export function CodebaseProvider({ children }) {
    const [codebase, setCodebase] = useState(null); // { source, fileCount, files }

    return (
        <CodebaseContext.Provider value={{ codebase, setCodebase }}>
            {children}
        </CodebaseContext.Provider>
    );
}

export const useCodebase = () => useContext(CodebaseContext);

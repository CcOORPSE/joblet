import { createContext, useContext } from "react";

export const AppLayoutContext = createContext({
  openSidebar: () => {},
});

export const useAppLayout = () => useContext(AppLayoutContext);

"use client";

import { ClientService } from "@/services/clients.service";
import type { User } from "@/types/user";
import React, { useState, useContext, type ReactNode, useEffect } from "react";

interface ClientContextProps {
  client?: User;
}

export const ClientContext = React.createContext<ClientContextProps>({
  client: undefined,
});

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps) {
  const [client, setClient] = useState<User>();
  const [clientLoading, setClientLoading] = useState(false);

  const fetchClient = async () => {
    try {
      setClientLoading(true);
      const response = await ClientService.getClientById(
        "default_user",
        "default_email@domain.com",
        "default_org",
      );
      setClient(response);
    } catch (error) {
      console.error(error);
    }
    setClientLoading(false);
  };

  const fetchOrganization = async () => {
    try {
      setClientLoading(true);
      const response = await ClientService.getOrganizationById(
        "default_org",
        "Default Company",
      );
    } catch (error) {
      console.error(error);
    }
    setClientLoading(false);
  };

  useEffect(() => {
    fetchClient();
    fetchOrganization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ClientContext.Provider
      value={{
        client,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export const useClient = () => {
  const value = useContext(ClientContext);

  return value;
};

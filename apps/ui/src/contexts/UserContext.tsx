import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  name: string;
  hasOnboarded: boolean;
}

interface UserContextType {
  user: UserProfile;
  completeOnboarding: (name: string) => void;
  updateName: (name: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'pg-studio-user';

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { name: '', hasOnboarded: false };
  });

  useEffect(() => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  const completeOnboarding = (name: string) => {
    setUser({ name, hasOnboarded: true });
  };

  const updateName = (name: string) => {
    setUser(prev => ({ ...prev, name }));
  };

  return (
    <UserContext.Provider value={{ user, completeOnboarding, updateName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

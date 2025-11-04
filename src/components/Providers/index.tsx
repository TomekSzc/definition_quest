import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import Toast from '../ui/Toast';
import type { FC } from 'react';

interface IProvidersProps {
  children: ReactNode;
}

export const Providers: FC<IProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        <Toast />
      </PersistGate>
    </Provider>
  );
}
export default Providers;
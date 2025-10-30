import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import Toast from '../ui/Toast';

interface Props {
  children: ReactNode;
}

export default function Providers({ children }: Props) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
        <Toast />
      </PersistGate>
    </Provider>
  );
}

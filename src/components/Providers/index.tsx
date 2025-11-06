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

// Higher-order component to wrap pages with Providers without repeating boilerplate.
import type { FC } from 'react';

export function withProviders<P>(Component: FC<P>): FC<P> {
  const Wrapped: FC<P> = (props) => (
    <Providers>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Component {...props} />
    </Providers>
  );
  Wrapped.displayName = `withProviders(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
}
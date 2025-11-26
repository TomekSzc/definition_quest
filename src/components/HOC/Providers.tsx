import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import Toast from "../ui/Toast";
import type { FC } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import type { ComponentType } from "react";
import { ReactLayout } from "./ReactLayout";

export { ProtectedRoute };

interface IProvidersProps {
  children: ReactNode;
}

export const Providers: FC<IProvidersProps> = ({ children }) => {
  return (
    <Provider store={store}>
      {persistor ? (
        <PersistGate loading={null} persistor={persistor}>
          <ProtectedRoute>{children}</ProtectedRoute>
          <Toast />
        </PersistGate>
      ) : (
        <>
          <ProtectedRoute>{children}</ProtectedRoute>
          <Toast />
        </>
      )}
    </Provider>
  );
};
export default Providers;

// Higher-order component to wrap pages with Providers without repeating boilerplate.
export function withProviders<P extends Record<string, unknown> = Record<string, never>>(
  Component: ComponentType<P>
): FC<P> {
  const Wrapped: FC<P> = (props) => (
    <Providers>
      {}
      <ReactLayout>
        <Component {...props} />
      </ReactLayout>
    </Providers>
  );
  Wrapped.displayName = `withProviders(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}

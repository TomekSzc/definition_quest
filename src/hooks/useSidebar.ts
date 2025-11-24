import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toggleSidebar, setSidebarCollapsed } from "@/store/slices/uiSlice";

const LS_KEY = "dq_sidebar_collapsed";

export function useSidebar() {
  const dispatch = useDispatch();
  const collapsed = useSelector((state: RootState) => state.ui.layout.sidebarCollapsed);

  const syncToStorage = (val: boolean) => {
    try {
      window.localStorage.setItem(LS_KEY, String(val));
    } catch {
      return;
    }
  };

  const toggle = useCallback(() => {
    dispatch(toggleSidebar());
    syncToStorage(!collapsed);
  }, [collapsed, dispatch]);

  const set = useCallback(
    (val: boolean) => {
      dispatch(setSidebarCollapsed(val));
      syncToStorage(val);
    },
    [dispatch]
  );

  return { collapsed, toggle, set } as const;
}

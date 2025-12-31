import * as React from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 2500; // 修改为 2500ms (2.5s)

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastProps {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type Action =
  | { type: "ADD_TOAST"; toast: ToastProps }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastProps> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToastProps[];
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "UPDATE_TOAST":
      return { ...state, toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)) };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.map((t) => (t.id === action.toastId || action.toastId === undefined ? { ...t, open: false } : t)) };
    case "REMOVE_TOAST":
      return { ...state, toasts: action.toastId === undefined ? [] : state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

export function toast({ title, description, variant = "default" }: Omit<ToastProps, "id">) {
  const id = genId();
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });
  
  dispatch({
    type: "ADD_TOAST",
    toast: { id, title, description, variant, open: true, onOpenChange: (open) => !open && dismiss() },
  });

  setTimeout(() => dismiss(), TOAST_REMOVE_DELAY);

  return { id, dismiss };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) };
}
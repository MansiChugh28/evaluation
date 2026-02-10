import React, { useState, useEffect } from 'react';

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 5000;

const listeners = [];

let toastCount = 0;
let toasts = [];

const genId = () => {
    toastCount = (toastCount + 1) % Number.MAX_SAFE_INTEGER;
    return toastCount.toString();
};

const toastTimeouts = new Map();

const addToRemoveQueue = (toastId) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({
            type: 'REMOVE_TOAST',
            toastId: toastId,
        });
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TOAST':
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };

        case 'UPDATE_TOAST':
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            };

        case 'REMOVE_TOAST':
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: [],
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t) => t.id !== action.toastId),
            };
    }
};

let memoryState = { toasts: [] };

function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => {
        listener(memoryState);
    });
}

function toast({ ...props }) {
    const id = genId();

    const update = (props) =>
        dispatch({
            type: 'UPDATE_TOAST',
            toast: { ...props, id },
        });
    const dismiss = () => dispatch({ type: 'REMOVE_TOAST', toastId: id });

    dispatch({
        type: 'ADD_TOAST',
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss();
            },
        },
    });

    addToRemoveQueue(id);

    return {
        id: id,
        dismiss,
        update,
    };
}

function useToast() {
    const [state, setState] = useState(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [state]);

    return {
        ...state,
        toast,
        dismiss: (toastId) => dispatch({ type: 'REMOVE_TOAST', toastId }),
    };
}

// Helper functions for common toast types
export const toastSuccess = (message, title = 'Success') => {
    return toast({
        variant: 'success',
        title,
        description: message,
    });
};

export const toastError = (message, title = 'Error') => {
    return toast({
        variant: 'destructive',
        title,
        description: message,
    });
};

export const toastInfo = (message, title = 'Info') => {
    return toast({
        variant: 'default',
        title,
        description: message,
    });
};

export { useToast, toast };



export function extractErrorMessage(error) {
    if (!error.response || !error.response.data) {
        return error.message || error.toString();
    }

    const errorData = error.response.data;

    // Handle error string (e.g., { error: "Invalid email or password" })
    if (errorData.error) {
        return errorData.error;
    }

    // Handle errors array (e.g., ["Email has already been taken"])
    if (errorData.errors && Array.isArray(errorData.errors)) {
        return errorData.errors.join(', ');
    }

    // Handle errors object (e.g., { email: ["has already been taken"] })
    if (errorData.errors && typeof errorData.errors === 'object') {
        const errorMessages = Object.entries(errorData.errors).flatMap(([field, messages]) => {
            if (Array.isArray(messages)) {
                return messages.map(msg => `${field}: ${msg}`);
            }
            return [`${field}: ${messages}`];
        });
        return errorMessages.join(', ');
    }

    // Handle message string
    if (errorData.message) {
        return errorData.message;
    }

    // Handle error string directly
    if (typeof errorData === 'string') {
        return errorData;
    }

    // Fallback to default error handling
    return error.message || error.toString();
}


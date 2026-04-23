export const getRequestErrorMessage = (error, fallbackMessage) => {
  const responseMessage = error.response?.data?.message;

  if (responseMessage) {
    return responseMessage;
  }

  if (error.code === "ERR_NETWORK") {
    return "Cannot reach the API. Check your backend URL and CORS settings.";
  }

  if (error.response?.status === 404) {
    return "API route not found. Check that the frontend is pointing to the correct backend service.";
  }

  return fallbackMessage;
};

import { useEffect } from 'react';

const APP_NAME = 'QA Playground';

// Sets a per-page browser tab title, e.g. "Cart | QA Playground"
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : `${APP_NAME} | E-Commerce Testing Platform`;
  }, [title]);
};

export default useDocumentTitle;

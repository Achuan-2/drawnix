import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import App, { AppValue } from './app/app';

(window as any).initDrawnix = (
  container: HTMLElement,
  initialData?: AppValue,
  onChange?: (val: AppValue) => void,
  onSave?: (val: AppValue) => void
) => {
  const root = ReactDOM.createRoot(container);
  root.render(
    <StrictMode>
      <App initialValue={initialData} onChange={onChange} onSave={onSave} />
    </StrictMode>
  );
  return root;
};

const rootElement = document.getElementById('root');
if (rootElement && !rootElement.hasAttribute('data-no-auto-init')) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
